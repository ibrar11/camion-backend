import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { SchedulerRegistry } from '@nestjs/schedule';
import { InjectRepository } from '@nestjs/typeorm';
import { IsNull, LessThan, MoreThan, Repository } from 'typeorm';

import { Campaign } from './entities/campaign.entity';
import { CartItem } from '../cart/entities/cart-items.entity';
import { PricingService } from '../pricing/pricing.service';

// Node.js setTimeout max safe delay (~24.8 days). Campaigns further away than
// this will be re-registered on the next server restart via onModuleInit.
const MAX_TIMEOUT_MS = 2_147_483_647;

@Injectable()
export class CampaignsScheduler implements OnModuleInit {
  private readonly logger = new Logger(CampaignsScheduler.name);

  constructor(
    @InjectRepository(Campaign) private readonly campaignRepository: Repository<Campaign>,
    @InjectRepository(CartItem) private readonly cartItemRepository: Repository<CartItem>,
    private readonly pricingService: PricingService,
    private readonly schedulerRegistry: SchedulerRegistry,
  ) { }

  /**
   * On startup: re-register timeouts for future campaigns and immediately
   * process any that expired while the server was down.
   */
  async onModuleInit() {
    const [futureCampaigns, expiredCampaigns] = await Promise.all([
      this.campaignRepository.find({
        where: { finishesAt: MoreThan(new Date()), cartAdjustedAt: IsNull() },
      }),
      this.campaignRepository.find({
        where: { finishesAt: LessThan(new Date()), cartAdjustedAt: IsNull() },
        relations: { campaignCategories: { category: true } },
      }),
    ]);

    for (const campaign of futureCampaigns) {
      this.scheduleCartAdjustment(campaign);
    }

    for (const campaign of expiredCampaigns) {
      await this.processCampaign(campaign);
    }
  }

  /**
   * Schedules a one-shot timeout to adjust cart prices exactly when the
   * campaign's finishesAt time arrives. Call this after creating or updating
   * a campaign so the timer is always in sync with the stored finishesAt.
   */
  scheduleCartAdjustment(campaign: Campaign) {
    const timeoutName = `campaign-cart-adjust-${campaign.uuid}`;

    // Clear any existing timeout (handles campaign updates that change finishesAt)
    try {
      this.schedulerRegistry.deleteTimeout(timeoutName);
    } catch { /* not yet registered — safe to ignore */ }

    const delay = campaign.finishesAt.getTime() - Date.now();

    if (delay <= 0) {
      // Already expired — reload with relations and process now
      this.campaignRepository
        .findOne({
          where: { id: campaign.id },
          relations: { campaignCategories: { category: true } },
        })
        .then(c => c && this.processCampaign(c));
      return;
    }

    if (delay > MAX_TIMEOUT_MS) {
      // Campaign is more than ~24 days away. The timeout would overflow;
      // onModuleInit will re-register it after the next restart.
      this.logger.warn(
        `Campaign ${campaign.uuid} finishes in ${Math.round(delay / 86_400_000)}d — ` +
        `beyond safe timeout range; will re-register on next server start`,
      );
      return;
    }

    const timeout = setTimeout(async () => {
      const c = await this.campaignRepository.findOne({
        where: { id: campaign.id },
        relations: { campaignCategories: { category: true } },
      });
      if (c) await this.processCampaign(c);

      try { this.schedulerRegistry.deleteTimeout(timeoutName); } catch { /* already gone */ }
    }, delay);

    this.schedulerRegistry.addTimeout(timeoutName, timeout);

    this.logger.log(
      `Cart adjustment for campaign ${campaign.uuid} scheduled in ` +
      `${Math.round(delay / 1000)}s (at ${campaign.finishesAt.toISOString()})`,
    );
  }

  private async processCampaign(campaign: Campaign) {
    this.logger.log(`Adjusting cart prices for expired campaign: ${campaign.uuid} (${campaign.nameEn})`);

    try {
      const categoryIds = campaign.campaignCategories
        .map(cc => cc.category?.id)
        .filter((id): id is number => id != null);

      if (!categoryIds.length) {
        campaign.cartAdjustedAt = new Date();
        await this.campaignRepository.save(campaign);
        return;
      }

      const cartItemsWithProduct = await this.cartItemRepository
        .createQueryBuilder('cartItem')
        .innerJoinAndSelect('cartItem.product', 'product')
        .innerJoinAndSelect('product.productCategories', 'pc')
        .innerJoinAndSelect('pc.category', 'category')
        .innerJoin('category.campaignCategories', 'cc')
        .innerJoin('cc.campaign', 'camp')
        .where('camp.id = :campaignId', { campaignId: campaign.id })
        .innerJoinAndSelect('cartItem.variant', 'variant')
        .select(['cartItem', 'product', 'pc', 'category', 'variant'])
        .getMany();

      if (!cartItemsWithProduct.length) {
        this.logger.log(`No cart items to adjust for campaign ${campaign.uuid}`);
        campaign.cartAdjustedAt = new Date();
        await this.campaignRepository.save(campaign);
        return;
      }

      this.logger.log(`Adjusting ${cartItemsWithProduct.length} cart item(s) for campaign ${campaign.uuid}`);

      for (const cartItem of cartItemsWithProduct) {
        const currency = cartItem.subTotal.currencyCode;

        const price = await this.pricingService.applyPriceOnProductVariant(
          cartItem.product,
          cartItem.variant,
          null,
          currency,
          true,
        );

        if (price.amount < 0) {
          this.logger.warn(`Price calculation failed for cart item ${cartItem.uuid}, skipping`);
          continue;
        }

        cartItem.subTotal = { amount: price.amount * cartItem.quantity, minorAmount: 0, currencyCode: currency };
        cartItem.discountPrice = { amount: 0, minorAmount: 0, currencyCode: currency };
        cartItem.total = { amount: price.amount * cartItem.quantity, minorAmount: 0, currencyCode: currency };

        await this.cartItemRepository.save(cartItem);
      }

      campaign.cartAdjustedAt = new Date();
      await this.campaignRepository.save(campaign);

      this.logger.log(`Campaign ${campaign.uuid} — cart prices adjusted for ${cartItemsWithProduct.length} item(s)`);
    } catch (err: any) {
      this.logger.error(`Failed to adjust cart prices for campaign ${campaign.uuid}: ${err?.message}`);
    }
  }
}

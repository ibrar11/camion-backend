import crypto from 'node:crypto';

import {
  BadRequestException,
  Inject,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';

import { generateSlug } from '../common/slug';
import { getSkipAndTake } from '../common/pagination';
import { FileService } from '../common/file.service';
import { S3Service } from '../common/s3.service';
import {
  getExchangedPrice,
  moneyFromFloat,
  moneyFromMinor,
  moneyToMinor,
  subtractMoney,
} from '../common/currency';
import { calculateStock } from '../common/calculateStock';
import { getShippingRate } from '../common/calculateShipping';
import { getBestCampaign } from '../common/bestCampaign';
import { ExchangeRate } from '../pricing/entities/exchange-rate.entity';
import { PricingService } from '../pricing/pricing.service';
import { CurrencyCode } from '../inventory/enums/CurrencyCode.enum';
import { ProductStatus } from '../inventory/enums/ProductStatus.enum';
import { Product } from '../inventory/entities/product.entity';
import { ProductVariant } from '../inventory/entities/product-variant.entity';
import { CartItem } from '../cart/entities/cart-items.entity';

import { Bundle, BundleDiscountType, BundleMode } from './entities/bundle.entity';
import { BundleItem } from './entities/bundle-item.entity';
import { CreateBundleDto, BundleItemInputDto } from './dtos/CreateBundleDto';
import { UpdateBundleDto } from './dtos/UpdateBundleDto';

type BundleAllocationEntry = {
  bundleUuid: string;
  bundleTitle: string;
  quantity: number;
  discountMinor: number;
  discountPercentage?: number | null;
};

type BundleSelectionInput = {
  productUuid?: string;
  variantUuid?: string;
};

type ResolvedBundleCartSelection = {
  bundle: Bundle;
  selectedItems: Array<BundleItem>;
  treatAsBundle: boolean;
  minimumSelectionCount: number;
};

type BundleItemSelectionState = BundleItem & {
  configuredVariantUuid?: string | null;
};

type BundleHydrationMode = 'storefront' | 'cart';
type BundleHydrationCache = Map<string, Promise<Product>>;

@Injectable()
export class BundlesService {
  private readonly logger = new Logger(BundlesService.name);

  constructor(
    @InjectRepository(Bundle)
    private readonly bundleRepository: Repository<Bundle>,
    @InjectRepository(BundleItem)
    private readonly bundleItemRepository: Repository<BundleItem>,
    @InjectRepository(Product)
    private readonly productRepository: Repository<Product>,
    @InjectRepository(ProductVariant)
    private readonly variantRepository: Repository<ProductVariant>,
    @InjectRepository(ExchangeRate)
    private readonly exchangeRateRepository: Repository<ExchangeRate>,
    @Inject(PricingService) private readonly pricingService: PricingService,
    @Inject(S3Service) private readonly s3Service: S3Service,
    @Inject(FileService) private readonly fileService: FileService,
  ) {}

  async createBundle(body: CreateBundleDto): Promise<Bundle> {
    this.logger.log('Attempting to create a bundle');
    await this.validateBundlePayload(body);

    const existing = await this.bundleRepository.findOneBy({
      slug: body.slug.trim().toLowerCase(),
    });
    if (existing) {
      throw new BadRequestException({
        errors: {
          slug: 'A bundle using the same slug already exists. Please use a different slug.',
        },
      });
    }

    const bundle = new Bundle();
    bundle.uuid = crypto.randomUUID();
    await this.assignBundleFields(bundle, body);
    await this.bundleRepository.save(bundle);
    await this.materializeBundleItemsForMode(bundle, body);
    return this.findOne(bundle.uuid);
  }

  findAll(
    filters: string,
    sort: string,
    pageNumber: number = 1,
    itemsPerPage: number = 100,
  ): Promise<Array<Bundle>> {
    const { skip, take } = getSkipAndTake(pageNumber, itemsPerPage);
    return this.bundleRepository.find({
      relationLoadStrategy: 'query',
      relations: {
        items: {
          product: true,
          variant: true,
        },
      },
      order: {
        id: 'DESC',
      },
      skip,
      take,
    });
  }

  async findOne(uuid: string): Promise<Bundle> {
    const bundle = await this.bundleRepository.findOne({
      where: { uuid },
      relations: {
        items: {
          product: true,
          variant: true,
        },
      },
    });
    if (!bundle) {
      throw new NotFoundException({
        error: 'Failed to find the bundle. Please check and try again.',
      });
    }
    return bundle;
  }

  async updateBundle(uuid: string, body: UpdateBundleDto): Promise<Bundle> {
    const bundle = await this.findOne(uuid);
    await this.validateBundlePayload(body, bundle.uuid);
    await this.assignBundleFields(bundle, body);
    await this.bundleRepository.save(bundle);
    await this.materializeBundleItemsForMode(bundle, body);
    return this.findOne(bundle.uuid);
  }

  async delete(uuid: string): Promise<void> {
    await this.bundleRepository.delete({ uuid });
  }

  async updateImage(uuid: string, file: Express.Multer.File): Promise<Bundle> {
    const bundle = await this.findOne(uuid);
    let params: { key: string; url: string } | null = null;
    try {
      params = await this.s3Service.uploadFile('bundles', file);
    } finally {
      await this.fileService.deleteFile(file);
    }
    bundle.imageUrl = params?.url ?? null;
    await this.bundleRepository.save(bundle);
    return this.findOne(uuid);
  }

  async findBundlesForProduct(
    productUUID: string,
    currency: string,
    countryCode?: string,
  ): Promise<Array<Bundle>> {
    const product = await this.productRepository.findOne({
      where: {
        uuid: productUUID,
        status: ProductStatus.ACTIVE,
      },
      relations: {
        productCategories: {
          category: true,
        },
      },
    });
    if (!product) {
      throw new NotFoundException({
        error: 'Failed to find the product. Please check and try again.',
      });
    }

    const now = new Date();
    const matchingBundles = (
      await this.bundleRepository
        .createQueryBuilder('bundle')
        .leftJoinAndSelect('bundle.items', 'item')
        .leftJoinAndSelect('item.product', 'itemProduct')
        .leftJoinAndSelect(
          'item.variant',
          'itemVariant',
        )
        .leftJoinAndSelect('itemVariant.inventoryItem', 'itemVariantInventory')
        .leftJoinAndSelect('itemVariantInventory.levels', 'itemVariantLevels')
        .where('bundle.isActive = :isActive', { isActive: true })
        .andWhere(
          '(bundle.anchorProductUuid = :productUUID OR itemProduct.uuid = :productUUID)',
          { productUUID },
        )
        .orderBy('bundle.id', 'DESC')
        .getMany()
    ).filter(
      (bundle) =>
        this.isBundleActiveAt(bundle, now) &&
        this.matchesBundleContext(bundle, productUUID),
    );
    const hydrationCache: BundleHydrationCache = new Map();
    await this.primeStorefrontBundleHydrationCache(
      [...new Set(
        matchingBundles
          .flatMap((bundle) => bundle.items ?? [])
          .map((item) => item.product?.uuid)
          .filter((uuid): uuid is string => Boolean(uuid)),
      )],
      currency as CurrencyCode,
      hydrationCache,
    );

    const resolvedBundles = await Promise.all(
      matchingBundles.map((bundle) =>
        this.resolveBundleForContext(
          bundle,
          product,
          currency as CurrencyCode,
          countryCode,
          'storefront',
          hydrationCache,
        ),
      ),
    );
    return resolvedBundles.filter((bundle): bundle is Bundle => bundle !== null);
  }

  async getBundleForCartAdd(
    bundleUuid: string,
    currency: CurrencyCode,
    countryCode?: string,
    selectedItems?: Array<BundleSelectionInput>,
  ): Promise<ResolvedBundleCartSelection> {
    const bundle = await this.bundleRepository.findOne({
      where: { uuid: bundleUuid, isActive: true },
      relations: {
        items: {
          product: true,
          variant: {
            inventoryItem: {
              levels: true,
            },
          },
        },
      },
    });

    if (!bundle) {
      throw new NotFoundException({
        error: 'Failed to find the bundle. Please check and try again.',
      });
    }

    const now = new Date();
    if (bundle.startsAt && bundle.startsAt.getTime() > now.getTime()) {
      throw new BadRequestException({
        error: 'Bundle is not active yet.',
      });
    }
    if (bundle.finishesAt && bundle.finishesAt.getTime() < now.getTime()) {
      throw new BadRequestException({
        error: 'Bundle has already expired.',
      });
    }

    const contextProduct = bundle.anchorProductUuid
      ? await this.loadContextProduct(bundle.anchorProductUuid)
      : null;
    const hydrated = await this.resolveBundleForContext(
      bundle,
      contextProduct,
      currency,
      countryCode,
      'cart',
    );
    if (!hydrated) {
      throw new BadRequestException({
        error:
          'Bundle is not currently available for the selected customer context.',
      });
    }

    const selectableItems = await this.buildSelectableBundleItemsForCartAdd(
      hydrated,
    );
    const sourceProductRequired =
      this.requiresSourceProductSelection(hydrated);
    const normalizedSelectedItems = await this.selectBundleItemsForCartAdd(
      hydrated,
      selectableItems,
      selectedItems,
    );
    if (
      sourceProductRequired &&
      !normalizedSelectedItems.some(
        (item) => item.product?.uuid === hydrated.anchorProductUuid,
      )
    ) {
      throw new BadRequestException({
        error: this.buildBundleSelectionRequirementError(
          hydrated.minimumSelectionCount,
          sourceProductRequired,
        ),
      });
    }

    if (normalizedSelectedItems.length < hydrated.minimumSelectionCount) {
      throw new BadRequestException({
        error: this.buildBundleSelectionRequirementError(
          hydrated.minimumSelectionCount,
          sourceProductRequired,
        ),
      });
    }

    return {
      bundle: hydrated,
      selectedItems: normalizedSelectedItems,
      treatAsBundle: true,
      minimumSelectionCount: hydrated.minimumSelectionCount,
    };
  }

  async applyBundlesToCartItems(
    cartItems: Array<CartItem>,
    currency: CurrencyCode,
    countryCode?: string,
  ): Promise<Array<CartItem>> {
    if (!Array.isArray(cartItems) || cartItems.length === 0) {
      return [];
    }

    const now = new Date();
    const productIds = [
      ...new Set(
        cartItems
          .map((item) => item.product?.id)
          .filter((id): id is number => id !== undefined),
      ),
    ];
    if (productIds.length === 0) {
      return cartItems;
    }

    const bundles = await this.loadActiveBundles();
    const activeBundles = bundles.filter((bundle) =>
      this.isBundleActiveAt(bundle, now),
    );
    const candidateBundles = activeBundles.filter((bundle) =>
      bundle.items.some((item) => {
        const productId = item.product?.id;
        return productId !== undefined && productIds.includes(productId);
      }),
    );
    const activeBundleMap = new Map(
      activeBundles.map((bundle) => [bundle.uuid, bundle] as const),
    );
    const resolvedBundles = (
      await Promise.all(
        candidateBundles.map(async (bundle) => {
            const contextProduct = bundle.anchorProductUuid
              ? await this.loadContextProduct(bundle.anchorProductUuid)
              : null;
            return this.resolveBundleForContext(
              bundle,
              contextProduct,
              currency,
              countryCode,
              'cart',
            );
          }),
      )
    ).filter((bundle): bundle is Bundle => {
      if (!bundle) return false;
      return bundle.items.some((item) => {
        const productId = item.product?.id;
        return productId !== undefined && productIds.includes(productId);
      });
    });

    const exchangeRates = await this.exchangeRateRepository.find({
      order: { id: 'DESC' },
      take: 200,
    });

    type MutableState = {
      cartItem: CartItem;
      remainingQuantity: number;
      baseUnitMinor: number;
      normalUnitMinor: number;
      allocations: Array<BundleAllocationEntry>;
    };

    const states: Array<MutableState> = cartItems.map((cartItem) => {
      const baseUnitMinor =
        cartItem.variant?.price
          ? moneyToMinor(cartItem.variant.price)
          : cartItem.quantity > 0
            ? Math.ceil(moneyToMinor(cartItem.subTotal) / cartItem.quantity)
            : 0;
      const normalUnitMinor =
        cartItem.variant?.discountedPrice
          ? moneyToMinor(cartItem.variant.discountedPrice)
          : cartItem.quantity > 0
            ? Math.ceil(moneyToMinor(cartItem.subTotal) / cartItem.quantity)
            : 0;
      const normalSubTotalMinor =
        cartItem.quantity > 0
          ? normalUnitMinor * cartItem.quantity
          : 0;
      cartItem.subTotal = moneyFromMinor(normalSubTotalMinor, currency);
      cartItem.discountPrice = {
        amount: 0,
        minorAmount: 0,
        currencyCode: currency,
      };
      cartItem.total = {
        ...cartItem.subTotal,
        currencyCode: currency,
      };
      cartItem.bundleUuid = null;
      cartItem.bundleQuantity = 0;
      cartItem.bundleAllocations = null;
      return {
        cartItem,
        remainingQuantity: cartItem.quantity,
        baseUnitMinor,
        normalUnitMinor,
        allocations: [],
      };
    });

    const groupedSelectionStates = new Map<string, Array<MutableState>>();
    for (const state of states) {
      const sourceBundleUuid = state.cartItem.bundleSourceUuid;
      const selectionUuid = state.cartItem.bundleSelectionUuid;
      if (!sourceBundleUuid || !selectionUuid) {
        continue;
      }
      const groupKey = `${sourceBundleUuid}:${selectionUuid}`;
      const groupStates = groupedSelectionStates.get(groupKey) ?? [];
      groupStates.push(state);
      groupedSelectionStates.set(groupKey, groupStates);
    }

    for (const [groupKey, selectionStates] of groupedSelectionStates.entries()) {
      const [bundleSourceUuid] = groupKey.split(':');
      const bundle = activeBundleMap.get(bundleSourceUuid);
      if (!bundle) {
        continue;
      }

      const minimumSelectionCount = Math.max(
        2,
        selectionStates[0]?.cartItem.bundleMinimumSelectionCount ||
          bundle.minimumSelectionCount ||
          2,
      );
      if (selectionStates.length < minimumSelectionCount) {
        continue;
      }

      const bundleSubtotalMinor = selectionStates.reduce(
        (sum, state) => sum + state.cartItem.quantity * state.baseUnitMinor,
        0,
      );
      const targetTotalMinor = this.calculateBundleTargetTotalMinor(
        bundle,
        bundleSubtotalMinor,
        currency,
        exchangeRates,
      );
      const totalDiscountMinor = Math.max(
        0,
        bundleSubtotalMinor - targetTotalMinor,
      );

      let distributed = 0;
      for (let index = 0; index < selectionStates.length; index += 1) {
        const state = selectionStates[index];
        const lineSubtotalMinor = state.cartItem.quantity * state.baseUnitMinor;
        let lineDiscountMinor =
          index === selectionStates.length - 1
            ? totalDiscountMinor - distributed
            : Math.floor(
                (totalDiscountMinor * lineSubtotalMinor) / bundleSubtotalMinor,
              );
        if (lineDiscountMinor < 0) {
          lineDiscountMinor = 0;
        }
        distributed += lineDiscountMinor;
        if (lineDiscountMinor <= 0 && totalDiscountMinor > 0) {
          continue;
        }
        state.allocations.push({
          bundleUuid: bundle.uuid,
          bundleTitle: bundle.titleEn,
          quantity: state.cartItem.quantity,
          discountMinor: lineDiscountMinor,
          discountPercentage: this.getBundleDisplayDiscountPercentage(bundle),
        });
      }
    }

    const legacyStates = states.filter(
      (state) =>
        !state.cartItem.bundleSourceUuid && !state.cartItem.bundleSelectionUuid,
    );

    const scoredBundles = resolvedBundles
      .map((bundle) => ({
        bundle,
        estimatedSavings: this.estimateBundleSavings(
          bundle,
          legacyStates,
          currency,
          exchangeRates,
        ),
      }))
      .filter((entry) => entry.estimatedSavings > 0)
      .sort(
        (lhs, rhs) =>
          rhs.estimatedSavings - lhs.estimatedSavings ||
          lhs.bundle.id - rhs.bundle.id,
      );

    for (const { bundle } of scoredBundles) {
      while (true) {
        const match = this.tryAllocateBundle(bundle, legacyStates);
        if (match.length === 0) break;

        const bundleSubtotalMinor = match.reduce(
          (sum, row) => sum + row.quantity * row.unitMinor,
          0,
        );
        const targetTotalMinor = this.calculateBundleTargetTotalMinor(
          bundle,
          bundleSubtotalMinor,
          currency,
          exchangeRates,
        );
        const totalDiscountMinor = Math.max(
          0,
          bundleSubtotalMinor - targetTotalMinor,
        );
        if (totalDiscountMinor <= 0) {
          break;
        }

        let distributed = 0;
        for (let index = 0; index < match.length; index += 1) {
          const row = match[index];
          const lineSubtotalMinor = row.quantity * row.unitMinor;
          let lineDiscountMinor =
            index === match.length - 1
              ? totalDiscountMinor - distributed
              : Math.floor(
                  (totalDiscountMinor * lineSubtotalMinor) /
                    bundleSubtotalMinor,
                );
          if (lineDiscountMinor < 0) lineDiscountMinor = 0;
          distributed += lineDiscountMinor;
          (row.state.allocations ??= []).push({
            bundleUuid: bundle.uuid,
            bundleTitle: bundle.titleEn,
            quantity: row.quantity,
            discountMinor: lineDiscountMinor,
            discountPercentage: this.getBundleDisplayDiscountPercentage(bundle),
          });
        }
      }
    }

    for (const state of states) {
      const totalDiscountMinor = state.allocations.reduce(
        (sum, entry) => sum + entry.discountMinor,
        0,
      );
      const bundleQuantity = state.allocations.reduce(
        (sum, entry) => sum + entry.quantity,
        0,
      );
      const nonBundleQuantity = Math.max(
        0,
        state.cartItem.quantity - bundleQuantity,
      );
      const lineSubTotalMinor =
        bundleQuantity * state.baseUnitMinor +
        nonBundleQuantity * state.normalUnitMinor;
      state.cartItem.subTotal = moneyFromMinor(lineSubTotalMinor, currency);
      state.cartItem.discountPrice = moneyFromMinor(
        totalDiscountMinor,
        currency,
      );
      const lineTotalMinor = Math.max(
        0,
        lineSubTotalMinor - totalDiscountMinor,
      );
      state.cartItem.total = moneyFromMinor(lineTotalMinor, currency);
      if (state.cartItem.variant) {
        state.cartItem.variant.price = moneyFromMinor(
          state.baseUnitMinor,
          currency,
        );
        state.cartItem.variant.discountedPrice = moneyFromMinor(
          state.cartItem.quantity > 0
            ? Math.ceil(lineTotalMinor / state.cartItem.quantity)
            : lineTotalMinor,
          currency,
        );
      }
      state.cartItem.bundleQuantity = bundleQuantity;
      state.cartItem.bundleUuid = state.allocations[0]?.bundleUuid ?? null;
      state.cartItem.bundleAllocations =
        state.allocations.length > 0 ? state.allocations : null;
    }

    return states.map((state) => state.cartItem);
  }

  private getBundleDisplayDiscountPercentage(bundle: Bundle): number | null {
    if (
      bundle.discountType !== BundleDiscountType.PERCENTAGE_OFF ||
      bundle.discountPercentage === null ||
      bundle.discountPercentage === undefined
    ) {
      return null;
    }

    const discountPercentage = Number(bundle.discountPercentage);
    return Number.isFinite(discountPercentage) ? discountPercentage : null;
  }

  private async selectBundleItemsForCartAdd(
    bundle: Bundle,
    selectableItems: Array<BundleItem>,
    selectedItems?: Array<BundleSelectionInput>,
  ): Promise<Array<BundleItem>> {
    if (!Array.isArray(selectedItems) || selectedItems.length === 0) {
      return selectableItems;
    }

    const selectedKeys = new Set<string>();
    const normalizedItems: Array<BundleItem> = [];

    for (const selectedItem of selectedItems) {
      if (!selectedItem.productUuid && !selectedItem.variantUuid) {
        throw new BadRequestException({
          error: 'Each selected bundle item must include a product or variant.',
        });
      }

      const dedupeKey = `${selectedItem.productUuid ?? 'none'}:${selectedItem.variantUuid ?? 'none'}`;
      if (selectedKeys.has(dedupeKey)) {
        throw new BadRequestException({
          error: 'Duplicate selected bundle items are not allowed.',
        });
      }
      selectedKeys.add(dedupeKey);

      const matchedItem = await this.resolveSelectedBundleItem(
        selectableItems,
        selectedItem,
      );

      if (!matchedItem) {
        throw new BadRequestException({
          error:
            'One or more selected items do not belong to the resolved bundle.',
        });
      }

      normalizedItems.push(matchedItem);
    }

    return normalizedItems;
  }

  private async buildSelectableBundleItemsForCartAdd(
    bundle: Bundle,
  ): Promise<Array<BundleItem>> {
    const selectableItems = [...(bundle.items ?? [])];
    if (!this.requiresSourceProductSelection(bundle, selectableItems)) {
      return selectableItems;
    }

    const anchorItem = await this.buildAnchorBundleSelectionItem(bundle);
    if (anchorItem) {
      selectableItems.unshift(anchorItem);
    }

    return selectableItems;
  }

  private requiresSourceProductSelection(
    bundle: Bundle,
    selectableItems: Array<BundleItem> = bundle.items ?? [],
  ): boolean {
    if (!bundle.anchorProductUuid) {
      return false;
    }

    return !selectableItems.some(
      (item) => item.product?.uuid === bundle.anchorProductUuid,
    );
  }

  private buildBundleSelectionRequirementError(
    minimumSelectionCount: number,
    sourceProductRequired: boolean,
  ): string {
    if (sourceProductRequired) {
      return `Please include the source product and select at least ${minimumSelectionCount} bundle items to add this bundle to cart.`;
    }

    return `Please select at least ${minimumSelectionCount} bundle items to add this bundle to cart.`;
  }

  private async buildAnchorBundleSelectionItem(
    bundle: Bundle,
  ): Promise<BundleItem | null> {
    if (!bundle.anchorProductUuid) {
      return null;
    }

    const anchorProduct = await this.productRepository.findOne({
      where: {
        uuid: bundle.anchorProductUuid,
        status: ProductStatus.ACTIVE,
      },
      relations: {
        variants: {
          inventoryItem: {
            levels: true,
          },
        },
      },
    });
    const defaultVariant = anchorProduct?.variants?.[0];
    if (!anchorProduct || !defaultVariant) {
      return null;
    }

    const anchorItem = new BundleItem();
    anchorItem.bundle = bundle;
    anchorItem.product = this.buildBundleProductPreview(anchorProduct);
    anchorItem.variant = this.buildBundleVariantPreview(defaultVariant);
    anchorItem.quantity = 1;
    return anchorItem;
  }

  private async resolveSelectedBundleItem(
    items: Array<BundleItem>,
    selectedItem: BundleSelectionInput,
  ): Promise<BundleItem | null> {
    const itemsWithSelectionState = items as Array<BundleItemSelectionState>;

    if (selectedItem.productUuid && selectedItem.variantUuid) {
      const matchedByProduct =
        itemsWithSelectionState.find(
          (item) => item.product?.uuid === selectedItem.productUuid,
        ) ?? null;
      if (!matchedByProduct) {
        return null;
      }

      if (matchedByProduct.configuredVariantUuid) {
        return matchedByProduct.configuredVariantUuid === selectedItem.variantUuid
          ? matchedByProduct
          : null;
      }

      return this.resolveProductLevelBundleItemVariant(
        matchedByProduct,
        selectedItem.variantUuid,
      );
    }

    if (selectedItem.variantUuid) {
      const exactVariantItem =
        itemsWithSelectionState.find(
          (item) => item.variant?.uuid === selectedItem.variantUuid,
        ) ?? null;
      if (exactVariantItem && exactVariantItem.configuredVariantUuid) {
        return exactVariantItem;
      }

      const selectedVariant = await this.variantRepository.findOne({
        where: { uuid: selectedItem.variantUuid },
        relations: { product: true },
      });
      if (!selectedVariant?.product?.uuid) {
        return null;
      }

      const matchedProductLevelItem =
        itemsWithSelectionState.find(
          (item) =>
            item.product?.uuid === selectedVariant.product.uuid &&
            !item.configuredVariantUuid,
        ) ?? null;
      if (!matchedProductLevelItem) {
        return null;
      }

      return this.resolveProductLevelBundleItemVariant(
        matchedProductLevelItem,
        selectedItem.variantUuid,
      );
    }

    const matchedByProductOnly =
      itemsWithSelectionState.find(
        (item) => item.product?.uuid === selectedItem.productUuid,
      ) ?? null;
    return matchedByProductOnly;
  }

  private async resolveProductLevelBundleItemVariant(
    item: BundleItemSelectionState,
    variantUuid: string,
  ): Promise<BundleItem | null> {
    if (!item.product?.uuid) {
      return null;
    }

    const selectedVariant = await this.variantRepository.findOne({
      where: { uuid: variantUuid },
      relations: { product: true },
    });
    if (selectedVariant?.product?.uuid !== item.product.uuid) {
      return null;
    }

    const selectedItem = new BundleItem();
    selectedItem.bundle = item.bundle;
    selectedItem.product = item.product;
    selectedItem.variant = this.buildBundleVariantPreview(selectedVariant);
    selectedItem.quantity = item.quantity;
    return selectedItem;
  }

  private estimateBundleSavings(
    bundle: Bundle,
    states: Array<{
      remainingQuantity: number;
      cartItem: CartItem;
      baseUnitMinor: number;
      normalUnitMinor: number;
    }>,
    currency: CurrencyCode,
    exchangeRates: Array<ExchangeRate>,
  ): number {
    const clonedStates = states.map((state) => ({ ...state }));
    const match = this.tryAllocateBundle(bundle, clonedStates);
    if (match.length === 0) return 0;
    const subtotalMinor = match.reduce(
      (sum, row) => sum + row.quantity * row.unitMinor,
      0,
    );
    const targetTotalMinor = this.calculateBundleTargetTotalMinor(
      bundle,
      subtotalMinor,
      currency,
      exchangeRates,
    );
    return Math.max(0, subtotalMinor - targetTotalMinor);
  }

  private async loadActiveBundles(): Promise<Array<Bundle>> {
    return this.bundleRepository.find({
      where: {
        isActive: true,
      },
      relations: {
        items: {
          product: true,
          variant: {
            inventoryItem: {
              levels: true,
            },
          },
        },
      },
      order: { id: 'DESC' },
    });
  }

  private async resolveBundleForContext(
    bundle: Bundle,
    contextProduct: Product | null,
    currency: CurrencyCode,
    countryCode?: string,
    hydrationMode: BundleHydrationMode = 'storefront',
    hydrationCache?: BundleHydrationCache,
  ): Promise<Bundle | null> {
    const hydratedBundle = this.cloneBundle(bundle);
    hydratedBundle.items = await this.hydrateBundleItems(
      bundle.items ?? [],
      currency,
      hydrationMode,
      hydrationCache,
    );

    if (
      !hydratedBundle.items.every((item) =>
        this.isBundleItemEligible(item, countryCode, currency),
      )
    ) {
      return null;
    }

    if (hydrationMode === 'storefront') {
      await this.applyBundlePresentationPricing(hydratedBundle, currency);
    }

    return hydratedBundle.items.length > 0 ? hydratedBundle : null;
  }

  private async applyBundlePresentationPricing(
    bundle: Bundle,
    currency: CurrencyCode,
  ): Promise<void> {
    const pricedItems = (bundle.items ?? []).filter(
      (item) => item.variant?.price,
    );
    if (pricedItems.length === 0) {
      return;
    }

    const bundleSubtotalMinor = pricedItems.reduce(
      (sum, item) =>
        sum + moneyToMinor(item.variant!.price) * Math.max(1, item.quantity),
      0,
    );
    if (bundleSubtotalMinor <= 0) {
      return;
    }

    const exchangeRates = await this.exchangeRateRepository.find({
      order: { id: 'DESC' },
      take: 200,
    });
    const targetTotalMinor = this.calculateBundleTargetTotalMinor(
      bundle,
      bundleSubtotalMinor,
      currency,
      exchangeRates,
    );
    const totalDiscountMinor = Math.max(
      0,
      bundleSubtotalMinor - targetTotalMinor,
    );
    if (totalDiscountMinor <= 0) {
      return;
    }

    let distributedDiscountMinor = 0;
    pricedItems.forEach((item, index) => {
      const quantity = Math.max(1, item.quantity);
      const lineSubTotalMinor = moneyToMinor(item.variant!.price) * quantity;
      const lineDiscountMinor =
        index === pricedItems.length - 1
          ? totalDiscountMinor - distributedDiscountMinor
          : Math.floor(
              (totalDiscountMinor * lineSubTotalMinor) / bundleSubtotalMinor,
            );
      distributedDiscountMinor += lineDiscountMinor;
      const lineTotalMinor = Math.max(0, lineSubTotalMinor - lineDiscountMinor);
      item.variant!.discountedPrice = moneyFromMinor(
        Math.ceil(lineTotalMinor / quantity),
        currency,
      );
    });
  }

  private async hydrateBundleItems(
    items: Array<BundleItem>,
    currency: CurrencyCode,
    hydrationMode: BundleHydrationMode = 'storefront',
    hydrationCache?: BundleHydrationCache,
  ): Promise<Array<BundleItem>> {
    return Promise.all(
      items.map(async (item) => {
        const clonedItem = new BundleItem();
        clonedItem.bundle = item.bundle;
        clonedItem.quantity = item.quantity;
        (clonedItem as BundleItemSelectionState).configuredVariantUuid =
          item.variant?.uuid ?? null;

        const productUuid = item.product?.uuid;
        if (!productUuid) {
          clonedItem.product = item.product;
          clonedItem.variant = item.variant;
          return clonedItem;
        }

        const storefrontProduct =
          hydrationMode === 'storefront'
            ? await this.loadHydratedBundleProduct(
                productUuid,
                currency,
                hydrationMode,
                hydrationCache,
              )
            : await this.loadCartBundleProduct(productUuid, currency);
        if (hydrationMode === 'storefront') {
          await this.ensureBundleDiscoveryVariantPricing(
            storefrontProduct,
            currency,
            item.variant?.uuid,
          );
        }
        const selectedVariant = item.variant?.uuid
          ? storefrontProduct.variants.find(
              (variant) => variant.uuid === item.variant?.uuid,
            ) ?? storefrontProduct.variants[0]
          : storefrontProduct.variants[0];

        clonedItem.product = this.buildBundleProductPreview(storefrontProduct);
        clonedItem.variant = selectedVariant
          ? this.buildBundleVariantPreview(selectedVariant)
          : null;
        return clonedItem;
      }),
    );
  }

  private async loadHydratedBundleProduct(
    productUuid: string,
    currency: CurrencyCode,
    hydrationMode: BundleHydrationMode,
    hydrationCache?: BundleHydrationCache,
  ): Promise<Product> {
    const cacheKey = `${hydrationMode}:${currency}:${productUuid}`;
    if (!hydrationCache) {
      return this.loadStorefrontProduct(productUuid, currency);
    }

    const existing = hydrationCache.get(cacheKey);
    if (existing) {
      return existing;
    }

    const loader = this.loadStorefrontProduct(productUuid, currency);
    hydrationCache.set(cacheKey, loader);
    return loader;
  }

  private async generateAutomaticBundleItems(
    bundle: Bundle,
    contextProduct: Product | null,
    excludedProductUuids: Set<string>,
  ): Promise<Array<BundleItemInputDto> | null> {
    const requiredCount = bundle.autoFillCount ?? 0;
    if (requiredCount <= 0) {
      return [];
    }

    const anchorProduct =
      contextProduct ??
      (bundle.anchorProductUuid
        ? await this.loadContextProduct(bundle.anchorProductUuid)
        : null);
    if (!anchorProduct) {
      return null;
    }

    excludedProductUuids.add(anchorProduct.uuid);
    const categoryUuids =
      bundle.sourceCategoryUuids?.filter(Boolean) ??
      anchorProduct.productCategories
        ?.map((entry) => entry.category?.uuid)
        .filter((uuid): uuid is string => Boolean(uuid)) ??
      [];
    if (categoryUuids.length === 0) {
      return null;
    }

    const candidates = await this.productRepository.find({
      relationLoadStrategy: 'query',
      where: {
        status: ProductStatus.ACTIVE,
      },
      relations: {
        productCategories: {
          category: true,
        },
      },
      order: {
        salesCount: 'DESC',
        viewsCount: 'DESC',
        id: 'DESC',
      },
      take: 100,
    });

    const categorySet = new Set(categoryUuids);
    const matchedCandidates = candidates.filter((candidate) => {
      if (excludedProductUuids.has(candidate.uuid)) {
        return false;
      }
      return (candidate.productCategories ?? []).some((entry) =>
        categorySet.has(entry.category?.uuid ?? ''),
      );
    });

    const generatedItems: Array<BundleItemInputDto> = [];
    for (const candidate of matchedCandidates) {
      if (generatedItems.length >= requiredCount) {
        break;
      }
      generatedItems.push({
        productUuid: candidate.uuid,
        quantity: 1,
      });
      excludedProductUuids.add(candidate.uuid);
    }

    if (generatedItems.length !== requiredCount) {
      return null;
    }

    return generatedItems;
  }

  private async loadContextProduct(productUuid: string): Promise<Product | null> {
    return this.productRepository.findOne({
      where: {
        uuid: productUuid,
        status: ProductStatus.ACTIVE,
      },
      relations: {
        productCategories: {
          category: true,
        },
      },
    });
  }

  private cloneBundle(bundle: Bundle): Bundle {
    const clonedBundle = new Bundle();
    Object.assign(clonedBundle, bundle);
    clonedBundle.sourceCategoryUuids = Array.isArray(bundle.sourceCategoryUuids)
      ? [...bundle.sourceCategoryUuids]
      : bundle.sourceCategoryUuids;
    clonedBundle.items = [...(bundle.items ?? [])];
    return clonedBundle;
  }

  private isBundleActiveAt(bundle: Bundle, now: Date): boolean {
    if (bundle.startsAt && bundle.startsAt.getTime() > now.getTime()) {
      return false;
    }
    if (bundle.finishesAt && bundle.finishesAt.getTime() < now.getTime()) {
      return false;
    }
    return true;
  }

  private matchesBundleContext(bundle: Bundle, productUUID: string): boolean {
    if (bundle.anchorProductUuid === productUUID) {
      return true;
    }
    return bundle.items.some((item) => item.product?.uuid === productUUID);
  }

  private async loadStorefrontProduct(
    productUuid: string,
    currency: CurrencyCode,
  ): Promise<Product> {
    const product = await this.productRepository.findOne({
      where: {
        uuid: productUuid,
        status: ProductStatus.ACTIVE,
      },
      relations: {
        attachments: true,
        options: {
          values: true,
        },
        variants: {
          optionValues: {
            optionValue: {
              option: true,
            },
          },
          inventoryItem: {
            levels: true,
          },
          images: true,
        },
        productCategories: {
          category: {
            campaignCategories: {
              campaign: true,
            },
          },
        },
      },
    });

    if (!product) {
      throw new NotFoundException({
        error: 'Failed to find the product. Please check and try again.',
      });
    }

    const campaign = getBestCampaign(product);
    if (campaign) {
      product.campaign = campaign;
    }

    return product;
  }

  private async primeStorefrontBundleHydrationCache(
    productUuids: string[],
    currency: CurrencyCode,
    hydrationCache: BundleHydrationCache,
  ): Promise<void> {
    if (productUuids.length === 0) {
      return;
    }

    const uncachedProductUuids = productUuids.filter(
      (productUuid) =>
        !hydrationCache.has(`storefront:${currency}:${productUuid}`),
    );
    if (uncachedProductUuids.length === 0) {
      return;
    }

    const products = await this.productRepository.find({
      relationLoadStrategy: 'query',
      where: {
        uuid: In(uncachedProductUuids),
        status: ProductStatus.ACTIVE,
      },
      relations: {
        attachments: true,
        options: {
          values: true,
        },
        variants: {
          optionValues: {
            optionValue: {
              option: true,
            },
          },
          inventoryItem: {
            levels: true,
          },
          images: true,
        },
        productCategories: {
          category: {
            campaignCategories: {
              campaign: true,
            },
          },
        },
      },
    });

    await Promise.all(
      products.map(async (product) => {
        const campaign = getBestCampaign(product);
        if (campaign) {
          product.campaign = campaign;
        }

        hydrationCache.set(
          `storefront:${currency}:${product.uuid}`,
          Promise.resolve(product),
        );
      }),
    );
  }

  private async ensureBundleDiscoveryVariantPricing(
    product: Product,
    currency: CurrencyCode,
    preferredVariantUuid?: string,
  ): Promise<void> {
    if (!Array.isArray(product.variants) || product.variants.length === 0) {
      return;
    }

    const campaign = product.campaign ?? getBestCampaign(product);
    if (campaign) {
      product.campaign = campaign;
    }

    const targetVariant =
      (preferredVariantUuid
        ? product.variants.find((variant) => variant.uuid === preferredVariantUuid)
        : null) ?? product.variants[0];
    if (!targetVariant) {
      return;
    }

    if (!targetVariant.price || targetVariant.price.currencyCode !== currency) {
      targetVariant.price = await this.pricingService.applyPriceOnProductVariant(
        product,
        targetVariant,
        campaign,
        currency,
        false,
      );
    }

    if (
      !targetVariant.discountedPrice ||
      targetVariant.discountedPrice.currencyCode !== currency
    ) {
      targetVariant.discountedPrice =
        await this.pricingService.applyPriceOnProductVariant(
          product,
          targetVariant,
          campaign,
          currency,
          true,
        );
    }
  }

  private async loadCartBundleProduct(
    productUuid: string,
    currency: CurrencyCode,
  ): Promise<Product> {
    const product = await this.productRepository.findOne({
      where: {
        uuid: productUuid,
        status: ProductStatus.ACTIVE,
      },
      relations: {
        variants: {
          inventoryItem: {
            levels: true,
          },
        },
        productCategories: {
          category: {
            campaignCategories: {
              campaign: true,
            },
          },
        },
      },
    });

    if (!product) {
      throw new NotFoundException({
        error: 'Failed to find the product. Please check and try again.',
      });
    }

    const campaign = getBestCampaign(product);
    if (campaign) {
      product.campaign = campaign;
    }

    product.variants = await Promise.all(
      product.variants.map(async (variant) => {
        variant.price = await this.pricingService.applyPriceOnProductVariant(
          product,
          variant,
          campaign,
          currency,
          false,
        );
        variant.discountedPrice =
          await this.pricingService.applyPriceOnProductVariant(
            product,
            variant,
            campaign,
            currency,
            true,
          );
        return variant;
      }),
    );

    product.variants.sort((lhs, rhs) => {
      const lhsPrice =
        lhs.discountedPrice?.minorAmount ?? lhs.price?.minorAmount ?? 0;
      const rhsPrice =
        rhs.discountedPrice?.minorAmount ?? rhs.price?.minorAmount ?? 0;
      return lhsPrice - rhsPrice;
    });

    return product;
  }

  private buildBundleProductPreview(product: Product): Product {
    return {
      ...product,
      variants: [],
      bundleItems: [],
      cartItems: [],
      wishlistItems: [],
      orderItems: [],
      reviews: [],
      views: [],
    } as Product;
  }

  private buildBundleVariantPreview(variant: ProductVariant): ProductVariant {
    const preview = {
      ...variant,
      product: undefined,
      cartItems: [],
      wishlistItems: [],
      orderItems: [],
    } as unknown as ProductVariant;
    return preview;
  }

  private tryAllocateBundle(
    bundle: Bundle,
    states: Array<{
      cartItem: CartItem;
      remainingQuantity: number;
      baseUnitMinor: number;
      normalUnitMinor: number;
      allocations?: Array<BundleAllocationEntry>;
    }>,
  ): Array<{
    state: {
      cartItem: CartItem;
      remainingQuantity: number;
      baseUnitMinor: number;
      normalUnitMinor: number;
      allocations?: Array<BundleAllocationEntry>;
    };
    quantity: number;
    unitMinor: number;
  }> {
    const allocations: Array<{
      state: {
        cartItem: CartItem;
        remainingQuantity: number;
        baseUnitMinor: number;
        normalUnitMinor: number;
        allocations?: Array<BundleAllocationEntry>;
      };
      quantity: number;
      unitMinor: number;
    }> = [];

    for (const item of bundle.items) {
      let needed = item.quantity;
      const candidates = states.filter((state) => {
        if (state.remainingQuantity <= 0) return false;
        if (item.variant?.uuid) {
          return state.cartItem.variant?.uuid === item.variant.uuid;
        }
        if (item.product?.uuid) {
          return state.cartItem.product?.uuid === item.product.uuid;
        }
        return false;
      });

      for (const state of candidates) {
        if (needed <= 0) break;
        const takeQuantity = Math.min(needed, state.remainingQuantity);
        if (takeQuantity <= 0) continue;
        state.remainingQuantity -= takeQuantity;
        allocations.push({
          state,
          quantity: takeQuantity,
          unitMinor: state.baseUnitMinor,
        });
        needed -= takeQuantity;
      }

      if (needed > 0) {
        for (const allocation of allocations) {
          allocation.state.remainingQuantity += allocation.quantity;
        }
        return [];
      }
    }

    return allocations;
  }

  private calculateBundleTargetTotalMinor(
    bundle: Bundle,
    subtotalMinor: number,
    currency: CurrencyCode,
    exchangeRates: Array<ExchangeRate>,
  ): number {
    switch (bundle.discountType) {
      case BundleDiscountType.PERCENTAGE_OFF:
        return Math.max(
          0,
          Math.ceil(
            subtotalMinor * (1 - (bundle.discountPercentage ?? 0) / 100),
          ),
        );
      case BundleDiscountType.FIXED_AMOUNT_OFF: {
        const convertedMinor = this.convertNumericAmountToMinor(
          bundle.discountAmountValue ?? 0,
          bundle.amountCurrencyCode ?? currency,
          currency,
          exchangeRates,
        );
        return Math.max(0, subtotalMinor - convertedMinor);
      }
      case BundleDiscountType.FLAT_TOTAL: {
        const convertedMinor = this.convertNumericAmountToMinor(
          bundle.flatPriceValue ?? 0,
          bundle.amountCurrencyCode ?? currency,
          currency,
          exchangeRates,
        );
        return Math.min(subtotalMinor, Math.max(0, convertedMinor));
      }
      default:
        return subtotalMinor;
    }
  }

  private convertNumericAmountToMinor(
    value: number,
    sourceCurrency: CurrencyCode,
    targetCurrency: CurrencyCode,
    exchangeRates: Array<ExchangeRate>,
  ): number {
    const normalizedValue = parseFloat(String(value ?? 0));
    if (!Number.isFinite(normalizedValue) || normalizedValue <= 0) return 0;
    const sourceMoney = moneyFromFloat(normalizedValue, sourceCurrency);
    if (sourceCurrency === targetCurrency) {
      return moneyToMinor(sourceMoney);
    }

    const exchangeFactor = this.getExchangeFactor(
      sourceCurrency,
      targetCurrency,
      exchangeRates,
    );
    return moneyToMinor(
      getExchangedPrice(sourceMoney, targetCurrency, exchangeFactor),
    );
  }

  private getExchangeFactor(
    sourceCurrency: CurrencyCode,
    targetCurrency: CurrencyCode,
    exchangeRates: Array<ExchangeRate>,
  ): number {
    if (sourceCurrency === targetCurrency) return 1;
    const direct = exchangeRates.find(
      (rate) =>
        rate.srcCurrencyCode === sourceCurrency &&
        rate.targetCurrencyCode === targetCurrency,
    );
    if (direct) {
      return parseFloat(String(direct.factor));
    }

    const cnyToSource =
      sourceCurrency === CurrencyCode.CNY
        ? 1
        : parseFloat(
            String(
              exchangeRates.find(
                (rate) =>
                  rate.srcCurrencyCode === CurrencyCode.CNY &&
                  rate.targetCurrencyCode === sourceCurrency,
              )?.factor ?? 0,
            ),
          );
    const cnyToTarget =
      targetCurrency === CurrencyCode.CNY
        ? 1
        : parseFloat(
            String(
              exchangeRates.find(
                (rate) =>
                  rate.srcCurrencyCode === CurrencyCode.CNY &&
                  rate.targetCurrencyCode === targetCurrency,
              )?.factor ?? 0,
            ),
          );
    if (cnyToSource > 0 && cnyToTarget > 0) {
      return cnyToTarget / cnyToSource;
    }

    return 1;
  }

  private async syncBundleItems(
    bundle: Bundle,
    inputs: Array<BundleItemInputDto>,
  ): Promise<void> {
    await this.bundleItemRepository.delete({
      bundle: {
        id: bundle.id,
      },
    });

    for (const input of inputs ?? []) {
      const product = input.productUuid
        ? await this.productRepository.findOneBy({ uuid: input.productUuid })
        : null;
      const variant = input.variantUuid
        ? await this.variantRepository.findOne({
            where: { uuid: input.variantUuid },
            relations: { product: true },
          })
        : null;

      const bundleItem = new BundleItem();
      bundleItem.bundle = bundle;
      bundleItem.product = variant?.product ?? product;
      bundleItem.variant = variant;
      bundleItem.quantity = input.quantity;
      await this.bundleItemRepository.save(bundleItem);
    }
  }

  private async materializeBundleItemsForMode(
    bundle: Bundle,
    body: CreateBundleDto | UpdateBundleDto,
  ): Promise<void> {
    const mode = body.mode ?? BundleMode.FIXED;
    const manualItems = Array.isArray(body.items) ? [...body.items] : [];
    if (mode === BundleMode.FIXED) {
      await this.syncBundleItems(bundle, manualItems);
      return;
    }

    const materializedItems: Array<BundleItemInputDto> = [];
    if (mode === BundleMode.HYBRID) {
      materializedItems.push(...manualItems);
    }
    if (mode === BundleMode.AUTO && body.anchorProductUuid) {
      materializedItems.push({
        productUuid: body.anchorProductUuid,
        quantity: 1,
      });
    }

    const excludedProductUuids = await this.buildExcludedBundleProductUuidSet(
      manualItems,
      body.anchorProductUuid,
    );
    const generatedItems = await this.generateAutomaticBundleItems(
      bundle,
      body.anchorProductUuid
        ? await this.loadContextProduct(body.anchorProductUuid)
        : null,
      excludedProductUuids,
    );
    if (!generatedItems) {
      throw new BadRequestException({
        errors: {
          autoFillCount:
            mode === BundleMode.AUTO
              ? 'Failed to materialize the requested auto-generated bundle items.'
              : 'Failed to materialize the requested hybrid auto-filled bundle items.',
        },
      });
    }

    materializedItems.push(...generatedItems);
    await this.syncBundleItems(bundle, materializedItems);
  }

  private async assignBundleFields(
    bundle: Bundle,
    body: CreateBundleDto | UpdateBundleDto,
  ): Promise<void> {
    bundle.titleEn = body.title.en.trim();
    bundle.titleAr = body.title.ar.trim();
    bundle.briefEn = body.brief?.en?.trim() || null;
    bundle.briefAr = body.brief?.ar?.trim() || null;
    bundle.slug = generateSlug(body.slug);
    bundle.discountType = body.discountType;
    bundle.mode = body.mode ?? BundleMode.FIXED;
    bundle.flatPriceValue = body.flatPriceValue ?? null;
    bundle.discountPercentage = body.discountPercentage ?? null;
    bundle.discountAmountValue = body.discountAmountValue ?? null;
    bundle.amountCurrencyCode = body.amountCurrencyCode ?? null;
    bundle.isActive = body.isActive;
    bundle.anchorProductUuid = body.anchorProductUuid ?? null;
    bundle.sourceCategoryUuids = body.sourceCategoryUuids?.length
      ? body.sourceCategoryUuids
      : null;
    bundle.autoFillCount = body.autoFillCount ?? null;
    bundle.minimumSelectionCount = body.minimumSelectionCount ?? 2;
    bundle.startsAt = new Date(body.startsAt);
    bundle.finishesAt = new Date(body.finishesAt);
  }

  private async validateBundlePayload(
    body: CreateBundleDto | UpdateBundleDto,
    bundleUUID?: string,
  ): Promise<void> {
    const mode = body.mode ?? BundleMode.FIXED;
    const items = Array.isArray(body.items) ? body.items : [];
    const autoFillCount = body.autoFillCount ?? 0;
    const resolvedSelectableCount =
      mode === BundleMode.AUTO
        ? autoFillCount + 1
        : mode === BundleMode.HYBRID
          ? items.length + autoFillCount
          : items.length;
    const minimumSelectionCount = body.minimumSelectionCount ?? 2;

    if (
      new Date(body.startsAt).getTime() >= new Date(body.finishesAt).getTime()
    ) {
      throw new BadRequestException({
        errors: {
          finishesAt:
            'Please make sure that the bundle finishes after it starts.',
        },
      });
    }

    const duplicateKeys = new Set<string>();
    for (const item of items) {
      if (!item.productUuid && !item.variantUuid) {
        throw new BadRequestException({
          errors: {
            items: 'Each bundle item must include a product or variant.',
          },
        });
      }
      const dedupeKey = `${item.productUuid ?? 'none'}:${item.variantUuid ?? 'none'}`;
      if (duplicateKeys.has(dedupeKey)) {
        throw new BadRequestException({
          errors: {
            items: 'Duplicate bundle items are not allowed.',
          },
        });
      }
      duplicateKeys.add(dedupeKey);
    }

    if (mode === BundleMode.FIXED && items.length < 2) {
      throw new BadRequestException({
        errors: {
          items: 'A fixed bundle must contain at least 2 items.',
        },
      });
    }

    if (mode === BundleMode.HYBRID) {
      if (items.length < 1) {
        throw new BadRequestException({
          errors: {
            items: 'A hybrid bundle must contain at least 1 manual item.',
          },
        });
      }
      if (!body.anchorProductUuid) {
        throw new BadRequestException({
          errors: {
            anchorProductUuid:
              'Hybrid bundles must target a specific anchor product.',
          },
        });
      }
      if (!body.autoFillCount || body.autoFillCount < 1) {
        throw new BadRequestException({
          errors: {
            autoFillCount:
              'Hybrid bundles must define at least 1 auto-filled product.',
          },
        });
      }
    }

    if (mode === BundleMode.AUTO) {
      if (!body.anchorProductUuid) {
        throw new BadRequestException({
          errors: {
            anchorProductUuid:
              'Automatic bundles must target a specific anchor product.',
          },
        });
      }
      if (!body.autoFillCount || body.autoFillCount < 1) {
        throw new BadRequestException({
          errors: {
            autoFillCount:
              'Automatic bundles must define at least 1 generated product.',
          },
        });
      }
    }

    if (minimumSelectionCount > resolvedSelectableCount) {
      throw new BadRequestException({
        errors: {
          minimumSelectionCount:
            'Minimum selection count cannot exceed the total selectable bundle items.',
        },
      });
    }

    if (body.anchorProductUuid) {
      const anchorProduct = await this.productRepository.findOneBy({
        uuid: body.anchorProductUuid,
      });
      if (!anchorProduct) {
        throw new BadRequestException({
          errors: {
            anchorProductUuid:
              'Failed to find the anchor product. Please check and try again.',
          },
        });
      }
    }

    if (mode === BundleMode.HYBRID || mode === BundleMode.AUTO) {
      await this.validateAutoFillAvailability(body, items, mode);
    }

    switch (body.discountType) {
      case BundleDiscountType.FLAT_TOTAL:
        if (
          !body.amountCurrencyCode ||
          body.flatPriceValue === undefined ||
          body.flatPriceValue === null
        ) {
          throw new BadRequestException({
            errors: {
              flatPriceValue: 'Flat bundles require a flat total and currency.',
            },
          });
        }
        break;
      case BundleDiscountType.FIXED_AMOUNT_OFF:
        if (
          !body.amountCurrencyCode ||
          body.discountAmountValue === undefined ||
          body.discountAmountValue === null
        ) {
          throw new BadRequestException({
            errors: {
              discountAmountValue:
                'Fixed-amount bundles require an amount and currency.',
            },
          });
        }
        break;
      case BundleDiscountType.PERCENTAGE_OFF:
        if (
          body.discountPercentage === undefined ||
          body.discountPercentage === null
        ) {
          throw new BadRequestException({
            errors: {
              discountPercentage:
                'Percentage bundles require a discount percentage.',
            },
          });
        }
        break;
      default:
        break;
    }

    if (bundleUUID) {
      const existing = await this.bundleRepository.findOneBy({
        slug: body.slug.trim().toLowerCase(),
      });
      if (existing && existing.uuid !== bundleUUID) {
        throw new BadRequestException({
          errors: {
            slug: 'A bundle using the same slug already exists. Please use a different slug.',
          },
        });
      }
    }
  }

  private async validateAutoFillAvailability(
    body: CreateBundleDto | UpdateBundleDto,
    items: Array<BundleItemInputDto>,
    mode: BundleMode,
  ): Promise<void> {
    const autoFillCount = body.autoFillCount ?? 0;
    if (!body.anchorProductUuid || autoFillCount <= 0) {
      return;
    }

    const anchorProduct = await this.loadContextProduct(body.anchorProductUuid);
    if (!anchorProduct) {
      return;
    }

    const categoryUuids =
      body.sourceCategoryUuids?.filter(Boolean) ??
      anchorProduct.productCategories
        ?.map((entry) => entry.category?.uuid)
        .filter((uuid): uuid is string => Boolean(uuid)) ??
      [];

    if (categoryUuids.length === 0) {
      throw new BadRequestException({
        errors: {
          sourceCategoryUuids:
            'No source categories are available to resolve auto-filled bundle items.',
        },
      });
    }

    const excludedProductUuids = await this.buildExcludedBundleProductUuidSet(
      items,
      anchorProduct.uuid,
    );

    const candidateRows = await this.productRepository
      .createQueryBuilder('product')
      .innerJoin('product.productCategories', 'productCategory')
      .innerJoin('productCategory.category', 'category')
      .where('product.status = :status', { status: ProductStatus.ACTIVE })
      .andWhere('category.uuid IN (:...categoryUuids)', { categoryUuids })
      .andWhere('product.uuid NOT IN (:...excludedProductUuids)', {
        excludedProductUuids: [...excludedProductUuids],
      })
      .select('DISTINCT product.uuid', 'uuid')
      .getRawMany<{ uuid: string }>();

    const availableGeneratedCount = candidateRows.length;
    if (availableGeneratedCount < autoFillCount) {
      throw new BadRequestException({
        errors: {
          autoFillCount:
            mode === BundleMode.AUTO
              ? `Only ${availableGeneratedCount} auto-generated product(s) are available for this bundle, but ${autoFillCount} were requested.`
              : `Only ${availableGeneratedCount} auto-filled product(s) are available for this hybrid bundle, but ${autoFillCount} were requested.`,
        },
      });
    }
  }

  private async buildExcludedBundleProductUuidSet(
    items: Array<BundleItemInputDto>,
    anchorProductUuid?: string | null,
  ): Promise<Set<string>> {
    const excludedProductUuids = new Set<string>();
    if (anchorProductUuid) {
      excludedProductUuids.add(anchorProductUuid);
    }

    for (const item of items) {
      if (item.productUuid) {
        excludedProductUuids.add(item.productUuid);
        continue;
      }

      if (!item.variantUuid) {
        continue;
      }

      const variant = await this.variantRepository.findOne({
        where: { uuid: item.variantUuid },
        relations: { product: true },
      });
      if (variant?.product?.uuid) {
        excludedProductUuids.add(variant.product.uuid);
      }
    }

    return excludedProductUuids;
  }

  private isBundleItemEligible(
    item: BundleItem,
    countryCode?: string,
    currency?: CurrencyCode,
  ): boolean {
    const variant = item.variant;
    const product = variant?.product ?? item.product;
    if (!product || product.status !== ProductStatus.ACTIVE) {
      return false;
    }
    if (variant) {
      const stock = calculateStock(variant);
      if (stock < item.quantity) {
        return false;
      }
      if (countryCode && variant.weight && currency) {
        try {
          getShippingRate(countryCode, variant.weight.amount);
        } catch {
          return false;
        }
      }
    }
    return true;
  }
}

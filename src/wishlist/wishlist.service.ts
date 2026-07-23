import * as crypto from "node:crypto";

import {
    BadRequestException,
    ConflictException,
    Inject,
    Injectable,
    Logger,
    NotFoundException
} from '@nestjs/common';

import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { getSkipAndTake } from "../common/pagination";

import { CreateWishlistDto } from './dtos/CreateWishListDto';

import { ProductStatus } from "../inventory/enums/ProductStatus.enum";
import { CurrencyCode } from "../inventory/enums/CurrencyCode.enum";

import { Customer } from '../customers/entities/customer.entity';
import { WishlistItem } from './entities/wishlist.entity';
import { Product } from '../inventory/entities/product.entity';

import { getBestCampaign } from "../common/bestCampaign";

import { PricingService } from "../pricing/pricing.service";

@Injectable()
export class WishlistService {
    private readonly logger = new Logger(WishlistService.name);

    constructor(
        @Inject(PricingService) private readonly pricingService: PricingService,
        @InjectRepository(Product) private readonly productRepository: Repository<Product>,
        @InjectRepository(WishlistItem) private readonly wishlistRepository: Repository<WishlistItem>,
    ) { }

    /**
     * Creates a new wish list item
     *
     * @param customer
     * @param body
     * @returns
     */
    async addToWishlist(customer: Customer, body: CreateWishlistDto): Promise<WishlistItem> {
        this.logger.log(`Adding ${body.productUUID} to customer: ${customer.uuid} cart`);

        // check if product exits
        const existing = await this.wishlistRepository.findOne({
            where: {
                customer: { uuid: customer.uuid },
                product: { uuid: body.productUUID },
            },
        });

        if (existing) {
            throw new ConflictException({
                error: "A product already exists in wish list",
            });
        }

        // find the prodcut to add to wish list
        const product = await this.productRepository.findOne({
            where: { uuid: body.productUUID },
            relations: {
                variants: true
            },
        });

        // Check if the product exists
        if (product === null) {
            throw new NotFoundException({
                error: "Failed to find the product. Please check and try again.",
            });
        }

        // Make sure the product is available
        if (product.status !== ProductStatus.ACTIVE) {
            throw new BadRequestException({
                error: "The product you selected is not available anymore. Please add another product to your cart.",
            });
        }

        // Check if the variant exists
        const variant = product.variants.find((variant) => variant.uuid === body.variantUUID);
        if (variant === undefined || variant === null) {
            throw new NotFoundException({
                error: "Failed to find the variant. Please check and try again.",
            });
        }

        // Reset the variants on the wishlist
        product.variants = [];

        // Create a new wishlist item.
        const wishlistItem = new WishlistItem();
        wishlistItem.uuid = crypto.randomUUID();
        wishlistItem.customer = customer;
        wishlistItem.product = product;
        wishlistItem.variant = variant;
        const wishedItem = await this.wishlistRepository.save(wishlistItem);

        await this.productRepository.increment(
            { id: product.id },
            'likesCount',
            1
        );

        return wishedItem;
    }

    /**
     * Fetch wish list
     *
     * @param customer
     * @param filters
     * @param sort
     * @param pageNumber
     * @param itemsPerPage
     * @param currency
     * @returns
     */
    async getWishlist(customer: Customer, filters: string, sort: string, pageNumber: number = 1, itemsPerPage: number = 100, currency: CurrencyCode = CurrencyCode.QAR): Promise<Array<WishlistItem>> {
        // Get pagination params
        const { skip, take } = getSkipAndTake(pageNumber, itemsPerPage);

        const wishListItems = await this.wishlistRepository.find({
            // cache: true,
            relationLoadStrategy: "query",
            where: {
                product: {
                    status: ProductStatus.ACTIVE,
                },
                customer: {
                    id: customer.id,
                },
            },
            relations: {
                product: {
                    productCategories: {
                        category: {
                            campaignCategories: {
                                campaign: true,
                            },
                        },
                    },
                },
                variant: {
                    images: true,
                },
            },
            order: { id: 'DESC' },
            skip: skip,
            take: take,
        });

        // Set price and discounted price on each wishlist item
        const res: Array<WishlistItem | null> = await Promise.all(
            wishListItems.map(async wishlistItem => {
                if (!wishlistItem.product || !wishlistItem.variant || wishlistItem.product.status !== ProductStatus.ACTIVE) {
                    return null;
                }

                // Find the best campaign for the product in the wishlist
                const campaign = getBestCampaign(wishlistItem.product);
                if (campaign !== null) {
                    wishlistItem.product.campaign = campaign;
                }

                // Calculate base price on the variant
                wishlistItem.variant.price = await this.pricingService.applyPriceOnProductVariant(
                    wishlistItem.product,
                    wishlistItem.variant,
                    campaign,
                    currency,
                    false,
                );

                // Calculate discounted price on the variant
                wishlistItem.variant.discountedPrice = await this.pricingService.applyPriceOnProductVariant(
                    wishlistItem.product,
                    wishlistItem.variant,
                    campaign,
                    currency,
                    true,
                );

                return wishlistItem;
            })
        );

        return res.filter(r => r !== null);
    }

    /**
     * Fetch wish list
     *
     * @param customer
     * @param wishlistItemUUID
     * @returns
     */
    async getWishlistItem(customer: Customer, wishlistItemUUID: string): Promise<WishlistItem> {
        const wishlistItem = await this.wishlistRepository.findOne({
            // cache: true,
            relationLoadStrategy: "query",
            where: {
                uuid: wishlistItemUUID,
            },
            relations: {
                product: true,
                variant: {
                    images: true,
                },
            },
        });

        if (wishlistItem === null) {
            throw new NotFoundException({
                error: "Wishlist item not found. Please check and try again.",
            });
        }

        return wishlistItem;
    }

    /**
     * Fetch wish list count
     *
     * @param customer
     * @returns
     */
    async getWishlistCount(customer: Customer): Promise<number> {
        const count = await this.wishlistRepository.count({
            // cache: true,
            relationLoadStrategy: "query",
            where: {
                customer: { uuid: customer.uuid, },
            },
        });
        return count;
    }

    /**
     * Remove from wish list
     * @param customer
     * @param wishlistItemUUID
     * @returns
     */
    async removeFromWishlist(customer: Customer, wishlistItemUUID: string): Promise<void> {
        const item = await this.wishlistRepository.findOneBy({
            uuid: wishlistItemUUID,
        });

        if (!item) {
            throw new NotFoundException({
                error: "Wishlist item not found. Please check and try again.",
            });
        };

        await this.wishlistRepository.remove(item);
    }

    /**
     * Clear the wish list
     * @param customer
     * @returns
     */
    async clearWishList(customer: Customer): Promise<void> {
        await this.wishlistRepository.delete({
            customer: { id: customer.id }
        });
    }
}

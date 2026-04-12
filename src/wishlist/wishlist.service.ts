import * as crypto from "node:crypto";

import {
    BadRequestException,
    Injectable,
    InternalServerErrorException,
    Logger,
    NotFoundException
} from '@nestjs/common';

import { InjectRepository } from '@nestjs/typeorm';

import { Repository } from 'typeorm';

import { CreateWishlistDto } from './dtos/CreateWishListDto';

import { Customer } from 'src/customers/entities/customer.entity';
import { WishlistItem } from './entities/wishlist.entity';
import { Product } from 'src/inventory/entities/product.entity';

@Injectable()
export class WishlistService {
    private readonly logger = new Logger(WishlistService.name);
    constructor(
        @InjectRepository(WishlistItem) private readonly wishlistRepo: Repository<WishlistItem>,
        @InjectRepository(Product) private readonly productRepository: Repository<Product>,
    ) { }

    /**
     * Creates a new wish list item
     *
     * @param customer
     * @param dto
     * @returns
     */
    async addToWishlist(customer: Customer, dto: CreateWishlistDto): Promise<WishlistItem> {
        try {
            // check if product exits
            const existing = await this.wishlistRepo.findOne({
                where: {
                    customer: { uuid: customer.uuid },
                    product: { uuid: dto.productUuid },
                },
            });

            if (existing) {
                throw new BadRequestException({
                    status: "fail",
                    errors: {
                        message: "A product already exists in wish list",
                    },
                });
            }

            // find the prodcut to add to wish list
            const product = await this.productRepository.findOne({
                where: { uuid: dto.productUuid },
                relations: {
                    variants: true
                }
            });

            if (!product || product.status !== 'ACTIVE') {
                throw new BadRequestException('Product not available');
            }

            const wishlistItem = new WishlistItem();
            wishlistItem.uuid = crypto.randomUUID();
            wishlistItem.customer = customer;
            wishlistItem.product = product;

            return await this.wishlistRepo.save(wishlistItem);

        } catch (error: any) {
            this.logger.error(`Error adding to wish list: ${error?.message}`);
            throw new InternalServerErrorException({
                error: 'Failed to add to wish list',
                details: error.response?.data || error.message,
            });
        }
    }

    /**
     * Fetch wish list
     *
     * @param customer
     * @returns
     */
    async getWishlist(customer: Customer): Promise<Array<WishlistItem>> {
        try {
            const items = await this.wishlistRepo.find({
                where: { customer: { uuid: customer.uuid } },
                relations: {
                    product: true
                },
                order: { createdAt: 'DESC' },
            });

            return items;

        } catch (error: any) {
            this.logger.error(`Error getting wish list: ${error?.message}`);
            throw new InternalServerErrorException({
                error: 'Failed to get wish list',
                details: error.response?.data || error.message,
            });
        }
    }

    /**
     * Fetch wish list
     *
     * @param customer
     * @param uuid
     * @returns
     */
    async getWishlistItem(customer: Customer, uuid: string): Promise<WishlistItem> {
        try {
            const item = await this.wishlistRepo.findOne({
                where: {
                    uuid: uuid,
                    customer: { uuid: customer.uuid }
                },
                relations: {
                    product: true
                },
            });

            if (!item) {
                throw new BadRequestException({
                    status: "fail",
                    errors: {
                        message: "wish list item not found",
                    },
                });
            }

            return item;

        } catch (error: any) {
            this.logger.error(`Error getting wish list item: ${error?.message}`);
            throw new InternalServerErrorException({
                error: 'Failed to get wish list item',
                details: error.response?.data || error.message,
            });
        }
    }

    /**
     * Remove from wish list
     * @param customer
     * @param productUuid
     * @returns
     */
    async removeFromWishlist(customer: Customer, productUuid: string): Promise<void> {
        try {
            const item = await this.wishlistRepo.findOne({
                where: {
                    customer: { uuid: customer.uuid },
                    product: { uuid: productUuid },
                }
            });

            if (!item) throw new NotFoundException("Cart item not found");

            await this.wishlistRepo.remove(item);


        } catch (error: any) {
            this.logger.error(`Error removing from wish list: ${error?.message}`);
            throw new InternalServerErrorException({
                error: 'Failed to remove from wish list',
                details: error.response?.data || error.message,
            });
        }
    }

    /**
     * Clear the wish list
     * @param customer
     * @returns
     */
    async clearWishList(customer: Customer): Promise<void> {
        try {
            await this.wishlistRepo.delete({
                customer: { id: customer.id }
            });
        } catch (error: any) {
            this.logger.error(`Error clearing wish list: ${error?.message}`);
            throw new InternalServerErrorException({
                error: 'Failed to clear wish list',
                details: error.response?.data || error.message,
            });
        }
    }
}

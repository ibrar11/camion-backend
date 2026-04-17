import crypto from "node:crypto";

import {
    Injectable,
    BadRequestException,
    NotFoundException,
    Logger,
    InternalServerErrorException,
} from "@nestjs/common";

import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";

import { calculateStock } from "../common/calculateStock";
import { getSkipAndTake } from "../common/pagination";

import { CreateCartItemDto } from "./dtos/CreateCartItemDto";
import { UpdateCartItemDto } from "./dtos/UpdateCartItemDto";

import { CartItem } from "./entities/cart-items.entity";

import { Product } from "../inventory/entities/product.entity";

import { ProductVariant } from "../inventory/entities/product-variant.entity";

import { Customer } from "../customers/entities/customer.entity";

import {
    UpdateCartResponse,
    ValidatedCartItem
} from "./types";

@Injectable()
export class CartItemsService {
    private readonly logger = new Logger(CartItemsService.name);

    constructor(
        @InjectRepository(CartItem) private readonly cartRepo: Repository<CartItem>,
        @InjectRepository(Product) private readonly productRepository: Repository<Product>,
        @InjectRepository(ProductVariant) private readonly variantRepository: Repository<ProductVariant>,
        @InjectRepository(Customer) private readonly customerRepository: Repository<Customer>,
    ) { }

    /**
     * Add the product to cart
     * @param dto
     * @param customer
     * @returns
     */
    async create(dto: CreateCartItemDto, customer: Customer): Promise<CartItem> {
        try {
            const { productUuid, variantUuid, quantity } = dto;

            this.logger.log(`Attempting to add to cart for product: ${productUuid}`);

            if (!productUuid) {
                throw new BadRequestException('productUuid is required');
            }

            // find the product needs to be added
            const product = await this.productRepository.findOne({
                where: { uuid: productUuid },
                relations: {
                    variants: {
                        inventoryItem: {
                            levels: true
                        }
                    }
                }
            });

            if (!product || product.status !== 'ACTIVE') {
                throw new BadRequestException('Product not available');
            }

            // find the specific variant from the product
            const variant = product?.variants?.find((item) => (item.uuid === variantUuid));

            if (!variant) {
                throw new NotFoundException('Variant not found');
            }

            // check the variant stock availability
            const availableStock = calculateStock(variant);

            if (availableStock <= 0) {
                throw new BadRequestException('Product is out of stock');
            }

            if (availableStock < quantity) {
                throw new BadRequestException('Insufficient stock');
            }

            const price = variant?.price?.amount || 0.0;

            // check if the variant alreadu exists
            const existing = await this.cartRepo.findOne({
                where: {
                    product: { uuid: productUuid },
                    variant: { uuid: variantUuid },
                    customer: { uuid: customer.uuid }
                }
            })

            // handles add to cart
            if (existing) {
                const updatedQuantity = existing.quantity + quantity;

                if (availableStock < updatedQuantity) {
                    throw new BadRequestException('Not enough stock available');
                }

                const updatedPrice = price * updatedQuantity;
                existing.quantity = updatedQuantity;
                existing.subTotal = {
                    amount: updatedPrice,
                    currencyCode: variant.price.currencyCode
                };
                return this.cartRepo.save(existing);
            } else {
                const cartItem = new CartItem();
                cartItem.uuid = crypto.randomUUID();
                cartItem.customer = customer;
                cartItem.product = product;
                cartItem.variant = variant;
                cartItem.quantity = quantity;
                cartItem.subTotal = {
                    amount: price * quantity,
                    currencyCode: variant.price.currencyCode
                };
                return this.cartRepo.save(cartItem);
            }

        } catch (err) {
            this.logger.error("Error while adding item in cart: ", err);
            throw err;
        }
    }

    /**
     * Find the cart items for a customer
     * @param customer
     * @param filters
     * @param sort
     * @param pageNumber
     * @param itemsPerPage
     * @returns
     */
    async findCart(customer: Customer, filters: string, sort: string, pageNumber: number = 1, itemsPerPage: number = 100): Promise<Array<ValidatedCartItem>> {
        try {

            // Get pagination params
            const { skip, take } = getSkipAndTake(pageNumber, itemsPerPage);

            const where = { customer: { uuid: customer.uuid } };

            const items = await this.cartRepo.find({
                where,
                relations: {
                    product: true,
                    variant: true,
                    customer: true
                },
                order: { id: 'DESC' },
                skip: skip,
                take: take,
            });

            const validatedItems: ValidatedCartItem[] = [];

            for (const item of items) {

                const product = await this.productRepository.findOne({
                    where: { uuid: item.product.uuid },
                    relations: {
                        variants: {
                            inventoryItem: {
                                levels: true
                            },
                            images: true
                        }
                    }
                });

                if (!product || product.status !== 'ACTIVE') continue;

                const variant = product.variants.find(v => v.uuid === item.variant.uuid);

                if (!variant) continue;

                const stock = calculateStock(variant);

                validatedItems.push(
                    {
                        ...item,
                        availableStock: stock,
                        isAvailable: stock > 0,
                    }
                );
            }

            return validatedItems;
        } catch (err) {
            this.logger.error("Error while fetching cart: ", err);
            throw err;
        }
    }

    /**
     * Fetch cart count
     *
     * @param customer
     * @returns
     */
    async getCartCount(customer: Customer): Promise<number> {
        try {
            const count = await this.cartRepo.count({
                where: {
                    customer: { uuid: customer.uuid },
                },
            });

            return count;

        } catch (error: any) {
            this.logger.error(`Error getting cart count: ${error?.message}`);
            throw new InternalServerErrorException({
                error: 'Failed to get cart count',
                details: error.response?.data || error.message,
            });
        }
    }

    /**
     * Update the cart item
     * @param uuid
     * @param dto
     * @param customer
     * @returns
     */
    async update(uuid: string, dto: UpdateCartItemDto, customer: Customer): Promise<UpdateCartResponse> {
        try {
            const { productUuid, variantUuid, quantity } = dto;

            // find the cart item to update
            const cartItem = await this.cartRepo.findOne({
                where: {
                    product: { uuid: productUuid },
                    uuid: uuid
                },
                relations: {
                    product: true,
                    variant: true,
                    customer: true
                }
            });

            if (!cartItem) {
                throw new NotFoundException("Cart item not found");
            }

            const finalVariantUuid = variantUuid ?? cartItem.variant.uuid;
            const finalQuantity = quantity ?? cartItem.quantity;

            // find the cart item product
            const product = await this.productRepository.findOne({
                where: { id: cartItem.product.id },
            });

            if (!product || product.status !== 'ACTIVE') {
                throw new BadRequestException('Product not available');
            }

            // find the cart item product's variant
            const variant = await this.variantRepository.findOne({
                where: {
                    uuid: finalVariantUuid,
                    product: {
                        id: cartItem.product.id
                    }
                },
                relations: {
                    inventoryItem: {
                        levels: true
                    }
                }
            });

            if (!variant) {
                throw new NotFoundException('Variant not found');
            }

            // check the variant stock availability
            const availableStock = calculateStock(variant);

            if (availableStock <= 0) {
                throw new BadRequestException('Product is out of stock');
            }

            //Check if a cart item with the target variant already exists
            const existingItem = await this.cartRepo.findOne({
                where: {
                    customer: { id: customer.id },
                    product: { id: product.id },
                    variant: { id: variant.id }
                },
                relations: {
                    product: true,
                    variant: true,
                    customer: true
                }
            })

            const pricePerUnit = variant?.price?.amount || 0.0;

            // merge the dupliate variant and remove the old one
            if (existingItem && existingItem.uuid !== cartItem.uuid) {

                const mergedQuantity = existingItem.quantity + finalQuantity;

                if (availableStock < mergedQuantity) {
                    throw new BadRequestException('Insufficient stock after merge');
                }

                existingItem.quantity = mergedQuantity;
                existingItem.subTotal = {
                    amount: pricePerUnit * mergedQuantity,
                    currencyCode: existingItem.subTotal.currencyCode
                };
                existingItem.variant = variant;

                const savedItem = await this.cartRepo.save(existingItem);

                // remove duplicate item
                await this.cartRepo.remove(cartItem);

                return {
                    uuid: savedItem.uuid,
                    product: savedItem.product,
                    variant: savedItem.variant,
                    quantity: savedItem.quantity,
                    subTotal: savedItem.subTotal
                };
            }

            if (availableStock < finalQuantity) {
                throw new BadRequestException('Insufficient stock');
            }


            cartItem.variant = variant;
            cartItem.quantity = finalQuantity;
            cartItem.subTotal = {
                amount: pricePerUnit * finalQuantity,
                currencyCode: variant.price.currencyCode
            };

            const savedItem = await this.cartRepo.save(cartItem);
            return {
                uuid: savedItem.uuid,
                product: savedItem.product,
                variant: savedItem.variant,
                quantity: savedItem.quantity,
                subTotal: savedItem.subTotal
            };
        } catch (err) {
            this.logger.error("Error while updating cart item: ", err);
            throw err;
        }
    }

    /**
     * Remove the cart item
     *
     * @param uuid
     * @returns
     */
    async removeItem(uuid: string): Promise<void> {
        try {
            const cartItem = await this.cartRepo.findOne({
                where: {
                    uuid: uuid
                }
            });

            if (!cartItem) throw new NotFoundException("Cart item not found");

            await this.cartRepo.remove(cartItem);
        } catch (err) {
            this.logger.error("Error while removing cart item: ", err);
            throw err;
        }
    }

    /**
     * Clear the cart
     * @param customer
     * @returns
     */
    async clearCart(customer: Customer): Promise<void> {
        try {
            await this.cartRepo.delete({
                customer: { id: customer.id }
            });
        } catch (err) {
            this.logger.error("Error while clearing cart: ", err);
            throw err;
        }
    }
}

import crypto from "node:crypto";

import {
    Injectable,
    BadRequestException,
    NotFoundException,
    Logger,
    InternalServerErrorException,
    Inject,
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

import { PricingService } from "../pricing/pricing.service";

import {
    UpdateCartResponse,
    ValidatedCartItem
} from "./types";

import { ProductStatus } from "src/inventory/enums/ProductStatus.enum";
import { CurrencyCode } from "src/inventory/enums/CurrencyCode.enum";

@Injectable()
export class CartItemsService {
    private readonly logger = new Logger(CartItemsService.name);

    constructor(
        @InjectRepository(CartItem) private readonly cartRepository: Repository<CartItem>,
        @InjectRepository(Product) private readonly productRepository: Repository<Product>,
        @InjectRepository(ProductVariant) private readonly variantRepository: Repository<ProductVariant>,
        @Inject(PricingService) private readonly pricingService: PricingService,
    ) { }

    /**
     * Add the product to cart
     * @param dto
     * @param customer
     * @returns
     */
    async create(dto: CreateCartItemDto, customer: Customer, currency: CurrencyCode = CurrencyCode.QAR): Promise<CartItem> {
        try {
            const { productUuid, variantUuid, quantity } = dto;

            this.logger.log(`Attempting to add to cart for product: ${productUuid}`);

            if (!productUuid) {
                throw new BadRequestException({
                    error: 'productUuid is required',
                });
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

            if (!product || product.status !== ProductStatus.ACTIVE) {
                throw new BadRequestException({
                    error: 'Product not available',
                });
            }

            // find the specific variant from the product
            const variant = product?.variants?.find((item) => (item.uuid === variantUuid));

            if (!variant) {
                throw new NotFoundException({
                    error: 'Variant not found',
                });
            }

            // check the variant stock availability
            const availableStock = calculateStock(variant);

            if (availableStock <= 0) {
                throw new BadRequestException({
                    error: 'Product is out of stock',
                });
            }

            if (availableStock < quantity) {
                throw new BadRequestException({
                    error: 'Insufficient stock',
                });
            }

            const price = await this.pricingService.applyPriceOnProductVariant(product, variant, currency, false);
            const discountedPrice = await this.pricingService.applyPriceOnProductVariant(product, variant, currency, true);

            // check if the variant alreadu exists
            const existing = await this.cartRepository.findOne({
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
                    throw new BadRequestException({
                        error: `Not enough stock available, Stock:${availableStock}`,
                    });
                }

                existing.quantity = updatedQuantity;
                existing.subTotal = {
                    ...price,
                    amount: price.amount * updatedQuantity,
                };
                existing.discountedSubTotal = {
                    ...discountedPrice,
                    amount: discountedPrice.amount * updatedQuantity,
                };
                return this.cartRepository.save(existing);
            } else {
                const cartItem = new CartItem();
                cartItem.uuid = crypto.randomUUID();
                cartItem.customer = customer;
                cartItem.product = product;
                cartItem.variant = variant;
                cartItem.quantity = quantity;
                cartItem.subTotal = {
                    ...price,
                    amount: price.amount * quantity
                };
                cartItem.discountedSubTotal = {
                    ...discountedPrice,
                    amount: discountedPrice.amount * quantity
                };
                return this.cartRepository.save(cartItem);
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

            const items = await this.cartRepository.find({
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

                if (!product || product.status !== ProductStatus.ACTIVE) continue;

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
            const count = await this.cartRepository.count({
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
    async update(uuid: string, dto: UpdateCartItemDto, customer: Customer, currency: CurrencyCode = CurrencyCode.QAR): Promise<UpdateCartResponse> {
        try {
            const { productUuid, variantUuid, quantity } = dto;

            // find the cart item to update
            const cartItem = await this.cartRepository.findOne({
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
                throw new NotFoundException({
                    error: "Cart item not found",
                });
            }

            const finalVariantUuid = variantUuid ?? cartItem.variant.uuid;
            const finalQuantity = quantity ?? cartItem.quantity;

            // find the cart item product
            const product = await this.productRepository.findOne({
                where: { id: cartItem.product.id },
            });

            if (!product || product.status !== ProductStatus.ACTIVE) {
                throw new BadRequestException({
                    error: 'Product not available',
                });
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
                throw new NotFoundException({
                    error: 'Variant not found',
                });
            }

            // check the variant stock availability
            const availableStock = calculateStock(variant);

            if (availableStock <= 0) {
                throw new BadRequestException({
                    error: 'Product is out of stock',
                });
            }

            //Check if a cart item with the target variant already exists
            const existingItem = await this.cartRepository.findOne({
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

            const pricePerUnit = variant?.cost?.amount || 0.0;
            const price = await this.pricingService.applyPriceOnProductVariant(product, variant, currency, false);
            const discountedPrice = await this.pricingService.applyPriceOnProductVariant(product, variant, currency, true);

            // merge the dupliate variant and remove the old one
            if (existingItem && existingItem.uuid !== cartItem.uuid) {

                const mergedQuantity = existingItem.quantity + finalQuantity;

                if (availableStock < mergedQuantity) {
                    throw new BadRequestException({
                        error: `Insufficient stock after merge. Item already exists with quantity ${existingItem.quantity}`,
                    });
                }

                existingItem.quantity = mergedQuantity;
                existingItem.subTotal = {
                    ...price,
                    amount: price.amount * mergedQuantity,
                };
                existingItem.discountedSubTotal = {
                    ...discountedPrice,
                    amount: discountedPrice.amount * mergedQuantity,
                };
                existingItem.variant = variant;

                const savedItem = await this.cartRepository.save(existingItem);

                // remove duplicate item
                await this.cartRepository.remove(cartItem);

                return {
                    uuid: savedItem.uuid,
                    product: savedItem.product,
                    variant: savedItem.variant,
                    quantity: savedItem.quantity,
                    subTotal: savedItem.subTotal
                };
            }

            if (availableStock < finalQuantity) {
                throw new BadRequestException({
                    error: 'Insufficient stock',
                });
            }


            cartItem.variant = variant;
            cartItem.quantity = finalQuantity;
            cartItem.subTotal = {
                ...price,
                amount: price.amount * finalQuantity,
            };
            cartItem.discountedSubTotal = {
                ...discountedPrice,
                amount: discountedPrice.amount * finalQuantity,
            };

            const savedItem = await this.cartRepository.save(cartItem);
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
            const cartItem = await this.cartRepository.findOne({
                where: {
                    uuid: uuid
                }
            });

            if (!cartItem) {
                throw new NotFoundException({
                    error: "Cart item not found",
                });
            }

            await this.cartRepository.remove(cartItem);
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
            await this.cartRepository.delete({
                customer: { id: customer.id }
            });
        } catch (err) {
            this.logger.error("Error while clearing cart: ", err);
            throw err;
        }
    }
}

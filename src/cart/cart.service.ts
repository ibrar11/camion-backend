import crypto from "node:crypto";

import {
    Injectable,
    BadRequestException, 
    NotFoundException ,
    Logger,
} from "@nestjs/common";

import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";

import { calculateStock } from "src/common/calculateStock";

import { CreateCartItemDto } from "./dtos/CreateCartItemDto";
import { UpdateCartItemDto } from "./dtos/UpdateCartItemDto";

import { CartItem } from "./entities/cart-items.entity";

import { Product } from "src/inventory/entities/product.entity";

import { ProductVariant } from "src/inventory/entities/product-variant.entity";

import { Customer } from "src/customers/entities/customer.entity";

import { 
    FindCartResponse, 
    UpdateCartResponse, 
    ValidatedCartItem
} from "./types";

@Injectable()
export class CartService {
    private readonly logger = new Logger(CartService.name);

    constructor(
        @InjectRepository(CartItem) private readonly cartRepo: Repository<CartItem>,
        @InjectRepository(Product) private readonly productRepository: Repository<Product>,
        @InjectRepository(ProductVariant) private readonly variantRepository: Repository<ProductVariant>,
        @InjectRepository(Customer) private readonly customerRepository: Repository<Customer>,
    ) {}

    /**
	 * Add the product to cart
	 * @param dto
	 * @param customer
	 * @returns
	 */
    async create(dto: CreateCartItemDto, customer: Customer): Promise<CartItem> {
        try {
            const { productUuid, variantUuid, quantity} = dto;

            this.logger.log(`Attempting to add to cart for product: ${productUuid}`);

            if (!productUuid) {
                throw new BadRequestException('productUuid is required');
            }

            // find the product needs to be added
            const product = await this.productRepository.findOne({
                where: {uuid: productUuid},
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
                    product: {uuid: productUuid},
                    variant: {uuid: variantUuid},
                    customer: {uuid: customer.uuid}
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
                existing.subTotal = updatedPrice;
                return this.cartRepo.save(existing);
            } else {
                const cartItem = new CartItem();
                cartItem.uuid = crypto.randomUUID();
                cartItem.customer = customer;
                cartItem.product = product;
                cartItem.variant = variant;
                cartItem.quantity = quantity;
                cartItem.subTotal = price * quantity;
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
	 * @returns
	 */
    async findCart(customer: Customer): Promise<FindCartResponse> {
        try{

            const where = { customer: {uuid: customer.uuid} };
            
            const items = await this.cartRepo.find({ 
                where,
                relations: {
                    product: true,
                    variant: true,
                    customer: true
                }
            });
            
            const validatedItems: ValidatedCartItem[] = [];

            for (const item of items) {

                const product = await this.productRepository.findOne({
                    where: {uuid: item.product.uuid},
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
                        uuid: item.uuid,
                        customerUuid: item.customer.uuid,
                        product: item.product,
                        quantity: item.quantity,
                        variation: variant,
                        title: product.title,
                        image: variant.images,
                        subTotal: item.subTotal,
                        availableStock: stock,
                        isAvailable: stock > 0,
                        createdAt: item.createdAt,
                        updatedAt: item.updatedAt
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
                    product: {uuid: productUuid},
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
                where: {id: cartItem.product.id},
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
                    customer: {id: customer.id},
                    product: {id: product.id},
                    variant: {id: variant.id}
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
                existingItem.subTotal = pricePerUnit * mergedQuantity;
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
            cartItem.subTotal = pricePerUnit * finalQuantity;

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

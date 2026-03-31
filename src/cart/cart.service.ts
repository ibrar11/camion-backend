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

import { 
    AddToCartResponse, 
    FindCartResponse, 
    RemoveCartItemResponse, 
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
    ) {}

    async create(dto: CreateCartItemDto, userId?: string, guestId?: string): Promise<AddToCartResponse> {
        try {
            if (!userId && !guestId) {
                throw new BadRequestException('Identifier is required');
            }

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

            const where = userId ? { customerUuid: userId } : { guestId: guestId };
            // check if the variant alreadu exists
            const existing = await this.cartRepo.findOne({
                where: {
                    productUuid: productUuid,
                    variantUuid: variantUuid,
                    ...where
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
                existing.price = updatedPrice;
                this.cartRepo.save(existing);
            } else {
                const cartItem = new CartItem();
                cartItem.uuid = crypto.randomUUID();
                cartItem.customerUuid = userId;
                cartItem.guestId = guestId;
                cartItem.productUuid = productUuid;
                cartItem.variantUuid = variantUuid;
                cartItem.quantity = quantity;
                cartItem.price = price;
                this.cartRepo.save(cartItem);
            }

            // find the cart count
            const cartItems = await this.cartRepo.find({
                where: {
                    ...where
                }
            });

            const cartCount = cartItems.reduce((sum, item) => sum + item.quantity, 0);

            return {
                "success": true,
                "message": "Added to cart",
                "data": {
                    "cartCount": cartCount
                }
            }

        } catch (err) {
            this.logger.error("Error while adding item in cart: ", err)
            throw err;
        }
    }

    async findCart(userId?: string, guestId?: string): Promise<FindCartResponse> {
        try{

            const where = guestId ? { guestId: guestId } : { customerUuid: userId };
            
            const items = await this.cartRepo.find({ where });
            
            const validatedItems: ValidatedCartItem[] = [];

            for (const item of items) {

                const product = await this.productRepository.findOne({
                    where: {uuid: item.productUuid},
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

                const variant = product.variants.find(v => v.uuid === item.variantUuid);

                if (!variant) continue;

                const stock = calculateStock(variant);

                validatedItems.push(
                    {
                        uuid: item.uuid,
                        userId: userId ? userId : '',
                        productId: item.productUuid,
                        quantity: item.quantity,
                        variation: variant,
                        title: product.title,
                        image: variant.images,
                        totalPrice: item.price,
                        availableStock: stock,
                        isAvailable: stock > 0,
                        createdAt: item.createdAt,
                        updatedAt: item.updatedAt
                    }
                );
            }

            const cartTotal = (await validatedItems).reduce((total, item) => {
                return item.isAvailable ? total + Number(item.totalPrice) : total + 0;
            }, 0);
            
            return {
                success: true,
                message: "Cart fetched",
                data: {
                    cartItems: validatedItems,
                    cartTotal: cartTotal
                }
            };
        } catch (err) {
            this.logger.error("Error while fetching cart: ", err)
            throw err
        }
    }

    async update(dto: UpdateCartItemDto, userId?: string, guestId?: string): Promise<UpdateCartResponse> {
        try {
            if (!userId && !guestId) {
                throw new BadRequestException('Identifier is required');
            }

            const { productUuid, variantUuid, quantity } = dto;

            const where = guestId
                ? { guestId: guestId }
                : { customerUuid: userId };

            const cartItem = await this.cartRepo.findOne({ 
                where: {
                    productUuid:productUuid,
                    ...where
                } 
            });

            if (!cartItem) {
                throw new NotFoundException("Cart item not found");
            }

            const finalVariantUuid = variantUuid ?? cartItem.variantUuid;
            const finalQuantity = quantity ?? cartItem.quantity;

            const product = await this.productRepository.findOne({
                where: {uuid: cartItem.productUuid},
            });

            if (!product || product.status !== 'ACTIVE') {
                throw new BadRequestException('Product not available');
            }

            const variant = await this.variantRepository.findOne({
                where: {
                    uuid: finalVariantUuid,
                    product: {
                        uuid: cartItem.productUuid
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

            if (availableStock < finalQuantity) {
                throw new BadRequestException('Insufficient stock');
            }

            const pricePerUnit = variant?.price?.amount || 0.0;

            cartItem.variantUuid = finalVariantUuid;
            cartItem.quantity = finalQuantity;
            cartItem.price = pricePerUnit * finalQuantity;

            const savedItem = await this.cartRepo.save(cartItem);
            return {
                success: true,
                message: "Cart updated",
                data: {
                    uuid: savedItem.uuid,
                    productUuId: savedItem.productUuid,
                    quantity: savedItem.quantity,
                    totalPrice: savedItem.price
                }
            }
        } catch (err) {
            this.logger.error("Error while updating cart item: ", err);
            throw err;
        }
    }

    async removeItem(productUuid: string, userId?: string, guestId?: string): Promise<RemoveCartItemResponse> {
        try {
            if (!userId && !guestId) {
                throw new BadRequestException('Identifier is required');
            }

            if (!productUuid) {
                throw new BadRequestException('productUuid is required');
            }
            const where = guestId ? { guestId: guestId } : { customerUuid: userId };
            const cartItem = await this.cartRepo.findOne({ 
                where: {
                    productUuid:productUuid,
                    ...where
                }
            });
            
            if (!cartItem) throw new NotFoundException("Cart item not found");
            
            await this.cartRepo.remove(cartItem);
            return {
                "success": true,
                "message": "Item removed",
                "data": {
                    "removed": true
                }
            }
        } catch (err) {
            this.logger.error("Error while removing cart item: ", err);
            throw err;
        }
    }

    async clearCart(userId?: string, guestId?: string): Promise<{success: boolean, message: string}> {
        try {
            if (!userId && !guestId) {
                throw new BadRequestException('Identifier is required');
            }
            
            await this.cartRepo.delete([
                { customerUuid: userId },
                { guestId: guestId }
            ]);

            return {
                "success": true,
                "message": "Item removed",
            }
        } catch (err) {
            this.logger.error("Error while clearing cart: ", err);
            throw err;
        }
    }
}

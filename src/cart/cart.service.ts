import crypto from "node:crypto";

import { 
    Inject,
    Injectable,
    BadRequestException, 
    NotFoundException ,
    Logger,
} from "@nestjs/common";

import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";

import { CreateCartItemDto } from "./dtos/CreateCartItemDto";
import { UpdateCartItemDto } from "./dtos/UpdateCartItemDto";

import { CartItem } from "./entities/cart-items.entity";

import { ProductsService } from "src/products/products.service";

@Injectable()
export class CartService {
    private readonly logger = new Logger(CartService.name);

    constructor(
        @InjectRepository(CartItem) private readonly cartRepo: Repository<CartItem>,
        @Inject(ProductsService) private readonly productsService: ProductsService,
    ) {}

    async create(identifier: string, dto: CreateCartItemDto, isGuest = false): Promise<CartItem> {
        try {
            const { productUuid, variantUuid, quantity} = dto;

            if (!productUuid) {
                throw new BadRequestException('productUuid is required');
            }

            const product = await this.productsService.findOne(productUuid);

            if (!product || product.status !== 'ACTIVE') {
                throw new BadRequestException('Product not available');
            }

            const variant = product?.variants?.find((item) => (item.uuid === variantUuid));

            if (!variant) {
                throw new NotFoundException('Variant not found');
            }

            const price = variant?.price?.amount || 0.0;

            const existing = await this.cartRepo.findOne({
                where: {
                    customerUuid: !isGuest ? identifier : '',
                    guestId: isGuest ? identifier : '',
                    productUuid: productUuid,
                    variantUuid: variantUuid
                }
            })

            if (existing) {
                const updatedQuantity = existing.quantity + quantity;
                const updatedPrice = price * updatedQuantity;
                existing.quantity = updatedQuantity;
                existing.price = updatedPrice;
                return this.cartRepo.save(existing);
            } else {
                const cartItem = new CartItem();
                cartItem.uuid = crypto.randomUUID();
                cartItem.customerUuid = !isGuest ? identifier : '';
                cartItem.guestId = isGuest ? identifier : '';
                cartItem.productUuid = productUuid;
                cartItem.variantUuid = variantUuid;
                cartItem.quantity = quantity;
                cartItem.price = price;
                return this.cartRepo.save(cartItem);
            }
        } catch (err) {
            this.logger.error("Error while adding item in cart: ", err)
            throw err;
        }
    }

    async findCart(identifier: string, isGuest = false): Promise<{cartItems: CartItem[], cartTotal: number}> {
        try{

            const where = isGuest ? { guestId: identifier } : { customerUuid: identifier };
            
            const items = await this.cartRepo.find({ where });
            
            const cartTotal = (await items).reduce((total, item) => {
                return total + Number(item.price);
            }, 0);
            
            return {
                cartItems: items,
                cartTotal: cartTotal
            };
        } catch (err) {
            this.logger.error("Error while fetching cart: ", err)
            throw err
        }
    }

    async update(identifier: string, uuid: string, dto: UpdateCartItemDto, isGuest = false): Promise<CartItem> {
        try {
            const where = isGuest
                ? { uuid, guestId: identifier }
                : { uuid, customerUuid: identifier };

            const cartItem = await this.cartRepo.findOne({ where });

            if (!cartItem) {
                throw new NotFoundException("Cart item not found");
            }

            const { variantUuid, quantity } = dto;

            const finalVariantUuid = variantUuid ?? cartItem.variantUuid;
            const finalQuantity = quantity ?? cartItem.quantity;

            const product = await this.productsService.findOne(cartItem.productUuid);

            if (!product || product.status !== 'ACTIVE') {
                throw new BadRequestException('Product not available');
            }

            const variant = product?.variants?.find(
                (item) => item.uuid === finalVariantUuid
            );

            if (!variant) {
                throw new NotFoundException('Variant not found');
            }

            const pricePerUnit = variant?.price?.amount || 0.0;

            cartItem.variantUuid = finalVariantUuid;
            cartItem.quantity = finalQuantity;
            cartItem.price = pricePerUnit * finalQuantity;

            return await this.cartRepo.save(cartItem);
        } catch (err) {
            this.logger.error("Error while updating cart item: ", err);
            throw err;
        }
    }

    async removeItem(identifier: string, uuid: string, isGuest = false): Promise<void> {
        try {

            const where = isGuest ? { uuid, guestId: identifier } : { uuid, customerUuid: identifier };
            const cartItem = await this.cartRepo.findOne({ where });
            
            if (!cartItem) throw new NotFoundException("Cart item not found");
            
            await this.cartRepo.remove(cartItem);
        } catch (err) {
            this.logger.error("Error while removing cart item: ", err);
            throw err;
        }
    }

    async clearCart(identifier: string): Promise<void> {
        try {
            if (identifier) {
                throw new BadRequestException('Either customerUuid or guestId must be provided');
            }
            
            await this.cartRepo.delete([
                { customerUuid: identifier },
                { guestId: identifier }
            ]);
        } catch (err) {
            this.logger.error("Error while clearing cart: ", err);
            throw err;
        }
    }
}

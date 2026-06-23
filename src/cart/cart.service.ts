import crypto from "node:crypto";

import {
    Injectable,
    BadRequestException,
    NotFoundException,
    Logger,
    Inject,
} from "@nestjs/common";

import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";

import { calculateStock } from "../common/calculateStock";
import { getSkipAndTake } from "../common/pagination";

import { CreateCartItemDto } from "./dtos/CreateCartItemDto";
import { UpdateCartItemDto } from "./dtos/UpdateCartItemDto";

import { ProductStatus } from "src/inventory/enums/ProductStatus.enum";

import { CartItem } from "./entities/cart-items.entity";
import { Product } from "../inventory/entities/product.entity";
import { ProductVariant } from "../inventory/entities/product-variant.entity";
import { Customer } from "../customers/entities/customer.entity";

import { PricingService } from "../pricing/pricing.service";

import { ExchangeRate } from "../pricing/entities/exchange-rate.entity";

import { CurrencyCode } from "../inventory/enums/CurrencyCode.enum";

import { getBestCampaign } from "../common/bestCampaign";

@Injectable()
export class CartItemsService {
    private readonly logger = new Logger(CartItemsService.name);

    constructor(
        @InjectRepository(CartItem) private readonly cartRepository: Repository<CartItem>,
        @InjectRepository(Product) private readonly productRepository: Repository<Product>,
        @InjectRepository(ProductVariant) private readonly variantRepository: Repository<ProductVariant>,
        @InjectRepository(Customer) private readonly customerRepository: Repository<Customer>,
        @InjectRepository(ExchangeRate) private readonly exchangeRateRepository: Repository<ExchangeRate>,
        @Inject(PricingService) private readonly pricingService: PricingService,
    ) { }

    /**
     * Add the product to cart
     * @param customer
     * @param body
     * @returns
     */
    async create(customer: Customer, body: CreateCartItemDto): Promise<CartItem> {
        this.logger.log(`Attempting to add to cart for product: ${body.productUuid}`);

        if (customer?.cartItemsCount >= 100) {
            throw new BadRequestException({
                error: 'Cart is full. To add the item first remove an item from cart.',
            });
        }

        // find the product needs to be added
        const product = await this.productRepository.findOne({
            where: { uuid: body.productUuid, },
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

        // Make sure the product exists and is available for sale.
        if (!product || product.status !== ProductStatus.ACTIVE) {
            throw new BadRequestException({
                error: 'Product not available',
            });
        }

        if (!product.variants || !Array.isArray(product.variants)) {
            throw new BadRequestException({
                error: "Failed to find any variant of the product. Please check and try again.",
            });
        }

        // find the specific variant from the product
        const variant = product.variants.find((variant) => (variant.uuid === body.variantUuid));
        if (!variant) {
            throw new NotFoundException({
                error: "Failed to find the requested variant. Please check and try again.",
            });
        }

        // check the variant stock availability
        const availableStock = calculateStock(variant);
        if (availableStock <= 0) {
            throw new BadRequestException({
                error: 'Product is out of stock',
            });
        }

        // Make sure the product is in sufficient quantity
        if (availableStock < body.quantity) {
            throw new BadRequestException({
                error: 'Insufficient stock',
            });
        }

        const campaign = getBestCampaign(product);

        // Calculate the price of the product/variant
        // const price = await this.pricingService.applyPriceOnProductVariant(product, variant, null, body.currency, false);
        const price = await this.pricingService.applyPriceOnProductVariant(product, variant, campaign, body.currency, true);

        // check if the variant already exists
        const existingCartItem = await this.cartRepository.findOne({
            where: {
                customer: { uuid: customer.uuid },
                product: { uuid: body.productUuid, },
                variant: { uuid: body.variantUuid, },
            },
        })

        // Update the existing cart item if it exists
        if (existingCartItem) {
            const updatedQuantity = existingCartItem.quantity + body.quantity;

            if (availableStock < updatedQuantity) {
                throw new BadRequestException({
                    error: 'Not enough stock available',
                });
            }

            const updatedPrice = price.amount * updatedQuantity;
            existingCartItem.quantity = updatedQuantity;
            existingCartItem.subTotal = {
                amount: updatedPrice,
                currencyCode: price.currencyCode,
            };
            existingCartItem.discountPrice = {
                amount: 0,
                currencyCode: price.currencyCode
            }
            existingCartItem.total = {
                amount: updatedPrice,
                currencyCode: price.currencyCode,
            }
            return this.cartRepository.save(existingCartItem);
        }

        // Reset prodcut variants
        product.variants = [];
        product.productCategories = [];

        // Create a new cart item
        const cartItem = new CartItem();
        cartItem.uuid = crypto.randomUUID();
        cartItem.customer = customer;
        cartItem.product = product;
        cartItem.variant = variant;
        cartItem.quantity = body.quantity;
        cartItem.subTotal = {
            amount: price.amount * body.quantity,
            currencyCode: price.currencyCode,
        };
        cartItem.discountPrice = {
            amount: 0,
            currencyCode: price.currencyCode
        }
        cartItem.total = {
            amount: price.amount * body.quantity,
            currencyCode: price.currencyCode
        }
        const savedCartItem = await this.cartRepository.save(cartItem);

        customer.cartItemsCount++;
        await this.customerRepository.save(customer);

        return savedCartItem;
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
    async findCart(customer: Customer, filters: string, sort: string, pageNumber: number = 1, itemsPerPage: number = 100, currency: CurrencyCode = CurrencyCode.QAR): Promise<Array<CartItem>> {
        this.logger.log(`Retrieving cart items for customer: ${customer.uuid}`);

        // Get pagination params
        const { skip, take } = getSkipAndTake(pageNumber, itemsPerPage);

        // Find the items in the customer cart
        const cartItems = await this.cartRepository.find({
            // cache: true,
            relationLoadStrategy: "query",
            where: {
                product: {
                    status: ProductStatus.ACTIVE,
                },
                customer: {
                    uuid: customer.uuid,
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
                    inventoryItem: {
                        levels: true,
                    },
                    images: true,
                    optionValues: {
                        optionValue: {
                            option: true
                        }
                    }
                },
            },
            order: { id: 'DESC' }
        });

        const result: CartItem[] = [];

        for (const cartItem of cartItems) {
            if (!cartItem.product || cartItem.product.status !== ProductStatus.ACTIVE) {
                continue;
            }

            if (!cartItem.variant) {
                continue;
            }

            const stock = calculateStock(cartItem.variant);
            cartItem.product.variants = [];
            cartItem.availableStock = stock;
            cartItem.isAvailable = stock > 0;

            const campaign = getBestCampaign(cartItem.product);            

            const price = await this.pricingService.applyPriceOnProductVariant(
                cartItem.product,
                cartItem.variant,
                campaign,
                currency,
                true,
            );

            cartItem.subTotal = {
                amount: price.amount * cartItem.quantity,
                currencyCode: price.currencyCode,
            };
            cartItem.discountPrice = {
                amount: 0,
                currencyCode: price.currencyCode,
            };
            cartItem.total = {
                amount: price.amount * cartItem.quantity,
                currencyCode: price.currencyCode,
            };

            result.push(cartItem);
        }

        return result;
    }

    /**
     * Fetch cart count
     *
     * @param customer
     * @returns
     */
    async getCartCount(customer: Customer): Promise<number> {
        this.logger.log(`Retrieving the cart item count for customer: ${customer.uuid}`);

        return this.cartRepository.count({
            // cache: true,
            relationLoadStrategy: "query",
            where: {
                customer: { uuid: customer.uuid },
                product: { status: ProductStatus.ACTIVE }
            },
        });
    }

    /**
     * Update the cart item
     * @param customer
     * @param cartItemUUID
     * @param body
     * @returns
     */
    async update(customer: Customer, cartItemUUID: string, body: UpdateCartItemDto): Promise<CartItem> {
        this.logger.log(`Updating the cart item: ${cartItemUUID}`);

        // find the cart item to update
        const cartItem = await this.cartRepository.findOne({
            where: {
                uuid: cartItemUUID,
            },
            relations: {
                product: {
                    productCategories: {
                        category: true,
                    },
                },
                variant: {
                    inventoryItem: {
                        levels: true,
                    },
                },
                customer: true,
            },
        });

        // Make sure the cart item exists
        if (!cartItem) {
            throw new NotFoundException({
                error: "Cart item not found. Please check and try again.",
            });
        }

        // Make sure the product exists and is available for sale.
        if (!cartItem.product || cartItem.product.status !== ProductStatus.ACTIVE) {
            throw new BadRequestException({
                error: 'Product not available. Please check and try again.',
            });
        }

        // Make sure the variant exists
        if (!cartItem.variant) {
            throw new NotFoundException({
                error: 'Variant not found. Please check and try again.',
            });
        }

        const product = await this.productRepository.findOne({
            where: { uuid: body.productUuid, },
            relations: {
                variants: {
                    inventoryItem: {
                        levels: true,
                    },
                },
                productCategories: {
                    category: true,
                },
            },
        });

        // Make sure the product exists and is available for sale.
        if (!product || product.status !== ProductStatus.ACTIVE) {
            throw new BadRequestException({
                error: 'Product not available',
            });
        }

        if (!product.variants || !Array.isArray(product.variants)) {
            throw new BadRequestException({
                error: "Failed to find any variant of the product. Please check and try again.",
            });
        }

        // find the specific variant from the product
        const variant = product.variants.find((variant) => (variant.uuid === body.variantUuid));
        if (!variant) {
            throw new NotFoundException({
                error: "Faild to find the requested variant. Please check and try again.",
            });
        }

        // check the variant stock availability
        const availableStock = calculateStock(variant);
        if (availableStock <= 0) {
            throw new BadRequestException({
                error: 'Product is out of stock. Please try again later.',
            });
        }

        // Make sure the product is in sufficient quantity
        if (availableStock < body.quantity) {
            throw new BadRequestException({
                error: 'Insufficient stock. Please try again later.',
            });
        }

        // Calculate the price of the product/variant
        // const price = await this.pricingService.applyPriceOnProductVariant(cartItem.product, cartItem.variant, null, body.currency, false);
        const price = await this.pricingService.applyPriceOnProductVariant(cartItem.product, cartItem.variant, null, body.currency, true);

        //Check if a cart item with the target variant already exists
        const existingItem = await this.cartRepository.findOne({
            where: {
                customer: { id: customer.id },
                product: { uuid: body.productUuid },
                variant: { uuid: body.variantUuid }
            },
            relations: {
                product: {
                    productCategories: {
                        category: true,
                    },
                },
                variant: {
                    inventoryItem: {
                        levels: true,
                    },
                },
                customer: true,
            },
        })

        // merge the dupliate variant and remove the old one
        if (existingItem && existingItem.uuid !== cartItem.uuid) {

            const mergedQuantity = existingItem.quantity + body.quantity;

            if (availableStock < mergedQuantity) {
                throw new BadRequestException('Insufficient stock after merge');
            }

            existingItem.product.variants = [];
            existingItem.quantity = mergedQuantity;
            existingItem.subTotal = {
                amount: price.amount * mergedQuantity,
                currencyCode: body.currency,
            };
            existingItem.discountPrice = {
                amount: 0,
                currencyCode: body.currency,
            };
            existingItem.total = {
                amount: price.amount * mergedQuantity,
                currencyCode: body.currency,
            };

            await this.cartRepository.remove(cartItem);
            return this.cartRepository.save(existingItem);

        }

        // Update the cart item
        cartItem.product.variants = [];
        cartItem.variant = variant;
        cartItem.quantity = body.quantity;
        cartItem.subTotal = {
            amount: price.amount * body.quantity,
            currencyCode: body.currency,
        };
        cartItem.discountPrice = {
            amount: (price.amount * body.quantity) - (price.amount * body.quantity),
            currencyCode: body.currency,
        };
        cartItem.total = {
            amount: (price.amount * body.quantity) - ((price.amount * body.quantity) - (price.amount * body.quantity)),
            currencyCode: body.currency,
        };

        return this.cartRepository.save(cartItem);
    }

    /**
     * Remove the cart item
     *
     * @param cartItemUUID
     * @returns
     */
    async removeItem(cartItemUUID: string): Promise<void> {
        this.logger.log(`Removing item ${cartItemUUID} from cart.`);

        const cartItem = await this.cartRepository.findOne({
            where: {
                uuid: cartItemUUID,
            },
            relations: {
                customer: true,
            }
        });

        if (!cartItem) {
            throw new NotFoundException({
                error: "Cart item not found",
            });
        }

        await this.cartRepository.remove(cartItem);

        cartItem.customer.cartItemsCount--;
        if (cartItem.customer.cartItemsCount < 0) {
            cartItem.customer.cartItemsCount = 0;
        }
        await this.customerRepository.save(cartItem.customer);
    }

    /**
     * Clear the cart
     * @param customer
     * @returns
     */
    async clearCart(customer: Customer): Promise<void> {
        this.logger.log(`Clearing the customer cart: ${customer.uuid}`);

        await this.cartRepository.delete({
            customer: { id: customer.id, }
        });

        customer.cartItemsCount = 0;
        await this.customerRepository.save(customer);
    }
}

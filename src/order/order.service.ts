import * as crypto from "node:crypto";

import {
    Injectable,
    BadRequestException,
    NotFoundException,
    Logger,
    InternalServerErrorException,
    Inject,
} from '@nestjs/common';

import { InjectRepository } from '@nestjs/typeorm';
import {
    DataSource,
    In,
    Repository
} from 'typeorm';

import { OrderStatus } from "./enums/OrderStatus";
import { PaymentProvider } from "../payments/enums/PaymentProvider";
import { CurrencyCode } from "../inventory/enums/CurrencyCode.enum";

import { CreateOrderDto } from './dtos/CreateOrderDto';

import { Order } from './entities/order.entity';
import { OrderItem } from './entities/order-item.entity';

import { Customer } from '../customers/entities/customer.entity';

import { InventoryItem } from '../inventory/entities/inventory-item.entity';

import { InventoryLevel } from "../inventory/entities/inventory-level.entity";

import { CartItem } from "../cart/entities/cart-items.entity";

import { CustomerAddress } from "../customers/entities/customer-address.entity";

import { PaymentsService } from "../payments/payments.service";

import { ExchangeRateService } from "../pricing/exchange-rate.service";

import { calculateStock } from "../common/calculateStock";

import { Coupon } from "../referral/entities/coupon.entity";

import { Wallet } from "../referral/entities/wallet.entity";

import { Transaction, TransactionMoney } from "../referral/entities/transaction.entity";

import { PricingService } from "../pricing/pricing.service";

import { KeyValuePair } from "../key-value-pairs/entities/key-value-pair.entity";

import {
    calculateCartShipping,
    ShippingCalculationResult
} from "../common/calculateShipping";

import { getSkipAndTake } from "../common/pagination";

import {
    calculateAffiliateCommission,
    calculateCouponDiscount
} from "../common/calculateCouponDiscount";

import { smartRoundInt } from "../common/smartRound";

import {
    OrderFilters,
    OrderPreviewResponse,
} from "./types";

import { ConfigService } from "@nestjs/config";

@Injectable()
export class OrderService {
    private readonly logger = new Logger(OrderService.name);

    constructor(
        private readonly configService: ConfigService,
        private readonly dataSource: DataSource,
        @InjectRepository(Order) private orderRepository: Repository<Order>,
        @InjectRepository(InventoryItem) private inventoryRepository: Repository<InventoryItem>,
        @InjectRepository(InventoryLevel) private inventoryLevelRepository: Repository<InventoryLevel>,
        @InjectRepository(CartItem) private cartRepository: Repository<CartItem>,
        @InjectRepository(CustomerAddress) private readonly addressRepository: Repository<CustomerAddress>,
        @InjectRepository(Coupon) private readonly couponRepository: Repository<Coupon>,
        @InjectRepository(KeyValuePair) private readonly keyValuePairRepository: Repository<KeyValuePair>,
        @Inject(PaymentsService) private readonly paymentService: PaymentsService,
        @Inject(ExchangeRateService) private readonly exchangeRateService: ExchangeRateService,
        @Inject(PricingService) private readonly pricingService: PricingService,
    ) { }

    /**
     * Creates a new order
     *
     * @param customer
     * @param dto
     * @returns
     */
    async create(customer: Customer, dto: CreateOrderDto,): Promise<Order> {
        const queryRunner = this.dataSource.createQueryRunner();
        await queryRunner.connect();
        await queryRunner.startTransaction();

        try {
            this.logger.log(`Attempting to create order for customer: ${customer.fullName}`);
            const address = await this.addressRepository.findOne({
                where: {
                    customer: { id: customer.id },
                    isDefault: true,
                },
            });

            if (!address) {
                throw new BadRequestException({
                    error: 'User address cannot be found.'
                });
            }
            // get cart items
            const cartItems = await this.cartRepository.find({
                where: {
                    uuid: In(dto.cartItemUuids),
                    customer: { id: customer.id }
                },
                relations: {
                    product: true,
                    variant: true,
                    customer: true
                }
            });

            if (cartItems.length !== dto.cartItemUuids.length) {
                throw new BadRequestException({
                    error: "Invalid cart items",
                });
            }

            let subTotal = 0;
            const orderItems: OrderItem[] = [];
            const currency = dto.currency ?? "qar";

            for (const cart of cartItems) {
                const variant = cart.variant;

                // get inventory item of the product variant
                const inventoryItem = await this.inventoryRepository.findOne({
                    where: { variant: { id: variant.id } },
                    relations: {
                        levels: {
                            warehouse: true
                        }
                    }
                });

                if (!inventoryItem || !inventoryItem.levels.length) {
                    throw new BadRequestException({
                        error: `No inventory found for ${variant.sku}`,
                    });
                }

                // Find a warehouse with enough stock
                const level = inventoryItem.levels.find(
                    l => l.quantity >= cart.quantity
                );

                if (!level) {
                    throw new BadRequestException({
                        error: `Insufficient stock for ${variant.sku}`
                    });
                }

                // Deduct inventory within transaction
                level.quantity -= cart.quantity;
                await queryRunner.manager.save(level);

                const priceAmount = await this.pricingService.applyPriceOnProductVariant(cart.product, cart.variant, currency, false);
                const discountedPriceAmount = await this.pricingService.applyPriceOnProductVariant(cart.product, cart.variant, currency, true);
                const totalAmount = discountedPriceAmount.amount * cart.quantity;

                subTotal += totalAmount;

                // create order items within transaction
                const orderItem = new OrderItem()
                orderItem.uuid = crypto.randomUUID();
                orderItem.product = cart.product;
                orderItem.variant = variant;
                orderItem.warehouse = level.warehouse;
                orderItem.price = {
                    ...priceAmount,
                    amount: priceAmount.amount,
                };
                orderItem.discountedPrice = {
                    ...discountedPriceAmount,
                    amount: discountedPriceAmount.amount,
                };
                orderItem.quantity = cart.quantity;
                orderItem.total = {
                    amount: totalAmount,
                    currencyCode: variant.cost.currencyCode,
                };

                await queryRunner.manager.save(orderItem);

                orderItems.push(orderItem)
            }

            const exchangeRates = await this.exchangeRateService.findAll("", "");

            // shipping and discount needs to be updated after the implementation of shippping and discounts
            let shippingCost = 0;
            let eta = "";

            // Fetch free shipping threshold once
            const freeShippingValue = Number(
                (await this.keyValuePairRepository.findOne({
                    where: { name: "free_shipping_above" }
                }))?.integerValue
            ) || 0;

            // Decide if we should charge shipping
            const shouldApplyShipping = freeShippingValue === null || subTotal < freeShippingValue;

            if (shouldApplyShipping) {
                const shippingCartItems = cartItems.map(item => ({
                    weight: {
                        amount: item.variant.weight.amount,
                        unit: item.variant.weight.unit,
                    },
                    quantity: item.quantity,
                }));

                // Calculate shipping fee using utility function
                const shippingCalculation = calculateCartShipping(
                    shippingCartItems,
                    address.country,
                    currency, // Todo make currency dynamic
                    exchangeRates,
                    subTotal
                );
                shippingCost = Math.floor(shippingCalculation.totalShippingCost);
                eta = shippingCalculation.transitTime.estimatedRange
            }

            // COUPON VALIDATION & DISCOUNT
            let discount = 0;
            let coupon: Coupon | null = null;
            if (dto.couponCode) {
                coupon = await this.couponRepository.findOne({
                    where: { code: dto.couponCode?.toLowerCase().trim() },
                    relations: {
                        affiliate: {
                            customer: true,
                            wallet: true,
                        },
                    },
                });

                if (coupon) {
                    discount = calculateCouponDiscount(coupon, subTotal, customer.uuid);
                    discount = smartRoundInt(discount);
                }
            }
            const total = subTotal + shippingCost - discount;

            // create a order within transaction
            const order = new Order();
            order.uuid = crypto.randomUUID();
            order.customer = customer;
            order.status = OrderStatus.PAYMENT_PENDING;
            order.subTotal = {
                amount: subTotal,
                currencyCode: currency,
            };
            order.shippingCost = {
                amount: shippingCost,
                currencyCode: currency,
            };
            order.discount = {
                amount: discount,
                currencyCode: currency,
            };
            order.total = {
                amount: total,
                currencyCode: currency,
            };
            order.eta = eta;
            order.orderItems = orderItems;
            order.shippingAddress = address;

            await queryRunner.manager.save(order);

            // RECORD AFFILIATE COMMISSION
            if (coupon?.affiliate && coupon.code && discount >= 0) {
                const commissionAmount = calculateAffiliateCommission(
                    coupon.affiliate,
                    total,
                    discount
                );

                if (commissionAmount > 0 && coupon.affiliate.wallet?.id) {
                    const walletId = coupon.affiliate.wallet.id;
                    const wallet = await queryRunner.manager.findOne(Wallet, {
                        where: { id: walletId },
                        relations: { affiliate: true },
                    });

                    if (!wallet) {
                        throw new BadRequestException({
                            error: `Wallet not found: ${walletId}`
                        });
                    }

                    // Create affiliate commission transaction record within the same transaction
                    const referralTx = new Transaction();
                    referralTx.uuid = crypto.randomUUID();
                    referralTx.wallet = wallet;
                    referralTx.amount = new TransactionMoney();
                    referralTx.amount.amount = commissionAmount;
                    referralTx.amount.currencyCode = currency as CurrencyCode;
                    referralTx.description = `Commission from order #${order.uuid} using coupon ${coupon.code}`;
                    await queryRunner.manager.save(referralTx);

                    // Update wallet balance
                    wallet.amount.amount += commissionAmount;
                    wallet.amountAvailable.amount += commissionAmount;
                    await queryRunner.manager.save(wallet);

                    // Update affiliate's total commission and remaining balance
                    const affiliate = wallet.affiliate;
                    affiliate.totalCommission.amount += commissionAmount;
                    affiliate.remainingBalance.amount += commissionAmount;
                    affiliate.couponsUsed += 1;
                    await queryRunner.manager.save(affiliate);

                    await queryRunner.manager.increment(Coupon, { id: coupon.id }, 'ordersCount', 1);
                }
            }

            const customerName: Array<string> = customer.fullName.split(" ");
            const provider = dto.paymentMethod === "default" ? PaymentProvider.SKIPCASH : PaymentProvider[dto.paymentMethod]
            // payment service needs to integrated here
            const paymentPayload = {
                provider: provider,
                amount: total,
                currency: currency,
                orderUUID: order.uuid,
                firstName: customerName[0],
                lastName: customerName[1] ?? customerName[0],
                emailAddress: customer.emailAddress,
                phoneNumber: address.phoneNumber.replace(/\s+/g, ""),
                street: address.streetAddress,
                city: address.city,
                state: address.state,
                country: address.country,
                postalCode: address.zipCode,
            }

            // External payment call — if this throws, the entire DB transaction rolls back
            const payment = await this.paymentService.createPayment(paymentPayload);
            order.paymentTransaction = payment;
            await queryRunner.manager.save(order);

            // Clear the cart within transaction
            await queryRunner.manager.delete(CartItem, { uuid: In(dto.cartItemUuids) });

            await queryRunner.commitTransaction();

            return order;
        } catch (error: any) {
            await queryRunner.rollbackTransaction();
            this.logger.error(`Error placing order: ${error}`);
            throw new InternalServerErrorException({
                error: 'Failed to place order',
                details: error?.response?.error || error?.message || error,
            });
        } finally {
            await queryRunner.release();
        }
    }

    /**
     * fetch all orders
     *
     * @returns
     */
    async findAll(filters: string, sort: string, pageNumber: number = 1, itemsPerPage: number = 100, status?: OrderStatus): Promise<Array<Order>> {
        try {
            // Get pagination params
            const { skip, take } = getSkipAndTake(pageNumber, itemsPerPage);
            const filter: OrderFilters = {}

            if (status) {
                filter.status = status;
            }

            const orders = await this.orderRepository.find({
                relationLoadStrategy: "query",
                where: {
                    ...filter
                },
                relations: {
                    orderItems: {
                        product: true,
                        variant: {
                            images: true,
                        },
                    },
                    shippingAddress: true
                },
                order: {
                    id: "DESC",
                },
                skip: skip,
                take: take,
            });
            return orders.map((order) => {
                order.orderPlacementDate = order.createdAt;
                return order;
            })
        } catch (error: any) {
            this.logger.error(`Error fetching orders: ${error}`);
            throw new InternalServerErrorException({
                error: 'Failed to fetch orders',
                details: error,
            });
        }
    }

    /**
     * fetch all orders of a customer
     * @param customerUuid
     * @returns
     */
    async findAllByCustomer(customerUuid: string, filters: string, sort: string, pageNumber: number = 1, itemsPerPage: number = 100, status?: OrderStatus): Promise<Array<Order>> {
        try {

            // Get pagination params
            const { skip, take } = getSkipAndTake(pageNumber, itemsPerPage);
            const filter: OrderFilters = {}

            if (status) {
                filter.status = status
            }

            const orders = await this.orderRepository.find({
                relationLoadStrategy: "query",
                where: {
                    customer: { uuid: customerUuid },
                    ...filter,
                },
                relations: {
                    orderItems: {
                        product: true,
                        variant: {
                            images: true,
                        },
                    },
                    shippingAddress: true
                },
                order: {
                    id: "DESC",
                },
                skip: skip,
                take: take,
            });
            return orders.map((order) => {
                order.orderPlacementDate = order.createdAt;
                return order;
            })
        } catch (error: any) {
            this.logger.error(`Error fetching my orders: ${error}`);
            throw new InternalServerErrorException({
                error: 'Failed to fetch customer orders',
                details: error,
            });
        }
    }

    /**
     * fetch a single order
     * @param uuid
     * @returns
     */
    async findOne(uuid: string): Promise<Order> {
        try {
            const order = await this.orderRepository.findOne({
                relationLoadStrategy: "query",
                where: { uuid },
                relations: {
                    orderItems: {
                        product: {
                            productCategories: {
                                category: true
                            }
                        },
                        variant: {
                            images: true,
                            optionValues: {
                                optionValue: {
                                    option: true
                                }
                            }
                        },
                    },
                    shippingAddress: true
                },
            });

            if (!order) throw new NotFoundException({
                error: 'Order not found',
            });

            order.orderPlacementDate = order.createdAt;

            return order;
        } catch (error: any) {
            this.logger.error(`Error fetching order: ${error}`);
            throw new InternalServerErrorException({
                error: 'Failed to fetch order',
                details: error,
            });
        }
    }

    /**
     * update order
     * @param uuid
     * @param status
     * @returns
     */
    async updateStatus(uuid: string, status: OrderStatus): Promise<Order> {
        try {
            const order = await this.findOne(uuid);

            order.status = status;

            return this.orderRepository.save(order);
        } catch (error: any) {
            this.logger.error(`Error updating order status: ${error}`);
            throw new InternalServerErrorException({
                error: 'Failed to update order status',
                details: error,
            });
        }
    }

    /**
     * update order
     * @param uuid
     * @returns
     */
    async cancel(uuid: string): Promise<void> {
        try {
            // find the order to cancel
            const order = await this.orderRepository.findOne({
                where: { uuid },
                relations: {
                    orderItems: {
                        variant: true,
                        warehouse: true
                    },
                },
            });

            if (!order) {
                throw new NotFoundException({
                    error: 'Order not found',
                });
            }

            if (order.status === OrderStatus.CANCELLED) {
                throw new BadRequestException({
                    error: 'Already cancelled',
                });
            }

            // Restore inventory
            for (const item of order.orderItems) {
                const inventoryItem = await this.inventoryRepository.findOne({
                    where: {
                        variant: { id: item.variant.id }
                    }
                });

                if (!inventoryItem) continue;

                const level = await this.inventoryLevelRepository.findOne({
                    where: {
                        inventoryItem: { id: inventoryItem.id },
                        warehouse: { id: item.warehouse.id },
                    },
                    relations: {
                        inventoryItem: true,
                        warehouse: true
                    },
                });

                if (!level) continue;

                // Restore stock
                level.quantity += item.quantity;

                await this.inventoryLevelRepository.save(level);
            }

            order.status = OrderStatus.CANCELLED;

            await this.orderRepository.save(order);

        } catch (error: any) {
            this.logger.error(`Error canceling order: ${error}`);
            throw new InternalServerErrorException({
                error: 'Failed to cancel order',
                details: error,
            });
        }
    }

    /**
    * order preview
    * @param customer
    * @returns
    */
    async orderPreview(customer: Customer, couponCode?: string): Promise<OrderPreviewResponse> {
        try {
            // Get cart items with relations
            const cartItems = await this.cartRepository.find({
                where: { customer: { id: customer.id } },
                relations: {
                    product: true,
                    variant: {
                        inventoryItem: {
                            levels: true
                        },
                        images: true,
                        optionValues: {
                            optionValue: {
                                option: true
                            }
                        }
                    }
                }
            });

            if (!cartItems || cartItems.length === 0) {
                throw new BadRequestException({
                    error: 'Cart is empty'
                });
            }

            const address = await this.addressRepository.findOne({
                where: {
                    customer: { id: customer.id },
                    isDefault: true,
                },
            });

            if (!address) {
                throw new BadRequestException({
                    error: 'User address cannot be found.'
                });
            }

            // Validate cart items and prepare for shipping calculation
            const validatedItems: CartItem[] = [];
            let subTotal = 0;

            for (const item of cartItems) {
                // Check stock availability
                const stock = calculateStock(item.variant);

                if (stock < item.quantity) {
                    throw new BadRequestException({
                        error: `Insufficient stock for ${item.product.titleEn} - ${item.variant.titleEn}`
                    });
                }

                const priceAmount = await this.pricingService.applyPriceOnProductVariant(item.product, item.variant, item.subTotal.currencyCode, false);

                const itemTotal = priceAmount.amount * item.quantity;
                subTotal += itemTotal;

                validatedItems.push({
                    ...item
                });
            }

            let shippingCost = 0;
            let eta = "";
            let shippingCalculation: ShippingCalculationResult | null = null;

            // Fetch free shipping threshold once
            const freeShippingValue = Number(
                (await this.keyValuePairRepository.findOne({
                    where: { name: "free_shipping_above" }
                }))?.integerValue
            ) || 0;

            // Decide if we should charge shipping
            const shouldApplyShipping = freeShippingValue === null || subTotal < freeShippingValue;

            if (shouldApplyShipping) {
                const shippingCartItems = cartItems.map(item => ({
                    weight: item.variant.weight,
                    quantity: item.quantity,
                }));

                const [exchangeRates] = await Promise.all([
                    this.exchangeRateService.findAll("", "")
                ]);

                const currency = cartItems[0]?.subTotal.currencyCode;

                shippingCalculation = calculateCartShipping(
                    shippingCartItems,
                    address.country,
                    currency,
                    exchangeRates,
                    subTotal
                );

                shippingCost = Math.floor(shippingCalculation.totalShippingCost);
                eta = shippingCalculation.transitTime.estimatedRange;
            }

            // COUPON VALIDATION & DISCOUNT
            let discount = 0;
            if (couponCode) {
                const coupon = await this.couponRepository.findOne({
                    where: { code: couponCode?.toLowerCase().trim() },
                    relations: {
                        affiliate: {
                            customer: true,
                            wallet: true,
                        },
                    },
                });

                if (coupon) {
                    discount = calculateCouponDiscount(coupon, subTotal, customer.uuid);
                }
            }

            // Calculate total order amount
            const totalAmount = subTotal + shippingCost - discount;

            // Return complete order preview
            const orderPreview = {
                items: validatedItems,
                shippingAddress: address,
                cart_total: subTotal,
                discount: discount,
                shipping: shippingCalculation,
                shippingTotal: shippingCost,
                grand_total: totalAmount,
                eta: eta,
            };

            return orderPreview;
        } catch (error: any) {
            this.logger.error(`Error getting order preview: ${error}`);
            throw new InternalServerErrorException({
                error: 'Failed to get order preview',
                details: error,
            });
        }
    }
}

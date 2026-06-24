import * as crypto from "node:crypto";

import {
    Injectable,
    BadRequestException,
    NotFoundException,
    Logger,
    InternalServerErrorException,
    Inject,
    HttpException,
} from '@nestjs/common';

import { InjectRepository } from '@nestjs/typeorm';
import {
    DataSource,
    In,
    Repository
} from 'typeorm';

import { OrderStatus } from "./enums/OrderStatus";
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';

import { PaymentProvider } from "../payments/enums/PaymentProvider";
import { PaymentStatus } from "../payments/enums/PaymentStatus";
import { QueueName } from '../queue/enums/QueueTypes.enum';
import { PaymentTimeoutJobData } from '../queue/types';
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
import { GlobalCoupon } from "../referral/entities/global-coupon.entity";

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
    calculateCouponDiscount
} from "../common/calculateCouponDiscount";

import { smartRoundInt } from "../common/smartRound";

import {
    NotificationPayload,
    OrderFilters,
    OrderPreviewResponse,
    OrderTracking,
    OrderTrackingSteps,
} from "./types";

import { JopWmsOrder, JopWmsInboundStatus, JopWmsOrderType, JopWmsOutboundStatus } from '../jop-wms/entities/jop-wms-order.entity';

import { ConfigService } from "@nestjs/config";

import { JopWmsOrderLink } from '../jop-wms/entities/jop-wms-order-link.entity';

import { NotificationsService } from "../notifications/notifications.service";
import { NotificationType } from "../notifications/enums/notification-type.enum";
import { NotificationPriority } from "../notifications/enums/notification-priority.enum";
import { EmailService } from "../email/email.service";

import { KeyValuePairType } from "../key-value-pairs/enums/KeyValuePairType.enum";

import { PushNotificationService } from "../notifications/push-notification.service";

import { ProductStatus } from "../inventory/enums/ProductStatus.enum";

import { Product } from "../inventory/entities/product.entity";

import { getBestCampaign } from "../common/bestCampaign";

import { Campaign } from "../campaigns/entities/campaign.entity";

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
        @InjectRepository(GlobalCoupon) private readonly globalCouponRepository: Repository<GlobalCoupon>,
        @InjectRepository(KeyValuePair) private readonly keyValuePairRepository: Repository<KeyValuePair>,
        @InjectRepository(Product) private readonly productRepository: Repository<Product>,
        @Inject(PaymentsService) private readonly paymentService: PaymentsService,
        @Inject(ExchangeRateService) private readonly exchangeRateService: ExchangeRateService,
        @Inject(PricingService) private readonly pricingService: PricingService,
        @Inject(PushNotificationService) private readonly pushNotificationService: PushNotificationService,
        @InjectRepository(JopWmsOrderLink) private readonly wmsOrderLinkRepository: Repository<JopWmsOrderLink>,
        @InjectRepository(Customer) private readonly customerRepository: Repository<Customer>,
        private readonly notificationsService: NotificationsService,
        private readonly emailService: EmailService,
        @InjectQueue(QueueName.ORDER_PAYMENT_TIMEOUT)
        private readonly paymentTimeoutQueue: Queue<PaymentTimeoutJobData>,
    ) { }

    private static readonly INBOUND_TRACKING_STATUS: Record<string, string> = {
        pending: 'Procurement in Progress',
        '10': 'Procurement in Progress',
        '11': 'Goods Being Sourced',
        '12': 'Goods Arrived at Warehouse',
        '13': 'Goods Being Processed',
        '14': 'Ready to Ship',
        '15': 'Processing Complete',
        '16': 'Order Issue — Contact Support',
    };

    private static readonly OUTBOUND_TRACKING_STATUS: Record<string, string> = {
        pending: 'Preparing Your Shipment',
        '10': 'Preparing Your Shipment',
        '11': 'Shipment in Progress',
        '12': 'Shipment Delayed',
        '13': 'Shipment Ready',
        '14': 'Shipped',
        '15': 'Shipment Cancelled',
    };

    private async attachTracking(orders: Order[]): Promise<void> {
        if (!orders.length) return;

        const uuids = orders.map(o => o.uuid);

        const links = await this.wmsOrderLinkRepository.find({
            where: { orderUuid: In(uuids) },
            relations: ['wmsOrder'],
        });

        const wmsOrdersByUuid = new Map<string, { inbound?: JopWmsOrder; outbound?: JopWmsOrder }>();
        for (const link of links) {
            if (!link.wmsOrder) continue;
            const entry = wmsOrdersByUuid.get(link.orderUuid) ?? {};
            if (link.wmsOrder.type === JopWmsOrderType.INBOUND) entry.inbound = link.wmsOrder;
            if (link.wmsOrder.type === JopWmsOrderType.OUTBOUND) entry.outbound = link.wmsOrder;
            wmsOrdersByUuid.set(link.orderUuid, entry);
        }

        for (const order of orders) {
            const { inbound = null, outbound = null } = wmsOrdersByUuid.get(order.uuid) ?? {};
            const stage: OrderTracking['stage'] = outbound ? 'outbound' : inbound ? 'inbound' : 'order';

            const status = outbound
                ? (OrderService.OUTBOUND_TRACKING_STATUS[outbound.status] ?? 'Shipment in Progress')
                : inbound
                    ? (OrderService.INBOUND_TRACKING_STATUS[inbound.status] ?? 'Procurement in Progress')
                    : 'Order Confirmed';

            order.tracking = {
                stage,
                status,
                waybillNo: outbound?.waybillNo ?? null,
                canRetryOutbound:
                    (stage === 'inbound' && inbound?.status === JopWmsInboundStatus.STORED) ||
                    (stage === 'outbound' && outbound?.status === JopWmsOutboundStatus.PROCESSING_FAILED),
            };
        }
    }

    private buildTrackingSteps(order: Order, inbound?: JopWmsOrder, outbound?: JopWmsOrder): OrderTrackingSteps {
        const status = order.status;
        const payment = order.paymentTransaction;

        const paymentConfirmed =
            status === OrderStatus.PAYMENT_SUCCESSFUL ||
            status === OrderStatus.CONFIRMED ||
            status === OrderStatus.DELIVERED ||
            payment?.status === PaymentStatus.PAID;

        const paymentRejected =
            status === OrderStatus.PAYMENT_REJECTED ||
            payment?.status === PaymentStatus.REJECTED ||
            payment?.status === PaymentStatus.FAILED;

        const paymentPending =
            !paymentConfirmed &&
            !paymentRejected &&
            (status === OrderStatus.PAYMENT_PENDING || payment?.status === PaymentStatus.PENDING);

        const isCancelled = status === OrderStatus.CANCELLED;

        return {
            orderPlaced: true,
            paymentPending,
            paymentConfirmed,
            paymentRejected,
            orderConfirmed: status === OrderStatus.CONFIRMED || status === OrderStatus.DELIVERED,
            orderCancelled: isCancelled,
            cancellationReason: isCancelled ? (order.cancellationReason ?? null) : null,
            processing: !!(order.gulltransOrderSns?.length),
            packing: inbound?.status === JopWmsInboundStatus.STORED,
            dispatching: !!outbound,
            shipped: outbound?.status === JopWmsOutboundStatus.SHIPPED,
            trackingId: outbound?.waybillNo ?? null,
            orderDelivered: status === OrderStatus.DELIVERED,
            orderReview: order.orderReview ?? null,
        };
    }

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
                })
            }
            // get cart items
            const cartItems = await this.cartRepository.find({
                where: {
                    uuid: In(dto.cartItemUuids),
                    customer: { id: customer.id },
                    product: { status: ProductStatus.ACTIVE, }
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
                    variant: true,
                    customer: true
                }
            });

            if (cartItems.length !== dto.cartItemUuids.length) {
                throw new BadRequestException({
                    error: "Invalid cart items",
                });
            }

            // await Promise.all(
            //     cartItems.map(async (item) => {
            //         const checkProduct = await this.productRepository.findOne({
            //             where: {
            //                 id: item.product.id,
            //             },
            //         });

            //         if (!checkProduct) {
            //             throw new BadRequestException({
            //                 error: `Product not found`,
            //             });
            //         }

            //         if (checkProduct.status !== ProductStatus.ACTIVE) {
            //             throw new BadRequestException({
            //                 error: `Cannot create order for the non-active product ${checkProduct.slug}`,
            //             });
            //         }
            //     })
            // );

            let subTotal = 0;
            const orderItems: OrderItem[] = [];
            const currency = dto.currency ?? "qar";
            let campaign: Campaign | null = null;

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

                campaign = getBestCampaign(cart.product);

                // const priceAmount = await this.pricingService.applyPriceOnProductVariant(cart.product, cart.variant, null, currency, false);
                const priceAmount = await this.pricingService.applyPriceOnProductVariant(cart.product, cart.variant, campaign, currency, true);
                const totalAmount = priceAmount.amount * cart.quantity;

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
                    ...priceAmount,
                    amount: 0,
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

            // shipping and discount needs to be updated after the implementation of shipping and discounts
            let shippingCost = 0;
            let eta = "";

            // Fetch free shipping threshold once
            const freeShippingValue = Number(
                (await this.keyValuePairRepository.findOne({
                    where: { name: "free_shipping_above" }
                }))?.integerValue
            ) || 0;

            const freeShippingEnabled = Boolean(
                (await this.keyValuePairRepository.findOne({
                    where: {
                        name: "free_shipping_enabled",
                        type: KeyValuePairType.Boolean
                    }
                }))?.booleanValue
            ) || false;

            const freeShippingExchangeRate = 1 / (exchangeRates.find((rate) => rate.srcCurrencyCode === currency && rate.targetCurrencyCode === 'qar')?.factor || 1);

            // Decide if we should charge shipping
            const shouldApplyShipping = !freeShippingEnabled || freeShippingValue === null || subTotal < (freeShippingValue * freeShippingExchangeRate);

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
                shippingCost = Math.ceil(shippingCalculation.totalShippingCost);
                eta = shippingCalculation.transitTime.estimatedRange
            }

            // COUPON VALIDATION & DISCOUNT
            let discount = 0;
            let affiliateCoupon: Coupon | null = null;
            let globalCoupon: GlobalCoupon | null = null;
            if (dto.couponCode) {
                affiliateCoupon = await this.couponRepository.findOne({
                    where: { code: dto.couponCode?.toLowerCase().trim() },
                    relations: {
                        affiliate: {
                            customer: true,
                            wallet: true,
                        },
                    },
                });

                if (campaign && affiliateCoupon) {
                    throw new BadRequestException(
                        "Coupon cannot be applied. Campaign products exists."
                    )
                }

                if (!affiliateCoupon) {
                    globalCoupon = await this.globalCouponRepository.findOne({
                        where: { code: dto.couponCode.toLowerCase().trim() },
                    });
                    if (!globalCoupon) {
                        throw new BadRequestException({
                            error: "Coupon does not exists. Please try again with valid coupon."
                        })
                    }
                    if (globalCoupon.timesUsed === globalCoupon.usageLimit) {
                        throw new BadRequestException({
                            error: "Coupon usage limit exceeded. Please try again with valid coupon."
                        })
                    }
                }
                const coupon = affiliateCoupon ? affiliateCoupon : globalCoupon;
                if (coupon) {
                    discount = calculateCouponDiscount(coupon, subTotal, customer.uuid);
                    // discount = Math.ceil(discount);
                }
            }

            const min_order_amount = Number(
                (await this.keyValuePairRepository.findOne({
                    where: {
                        name: `min_order_amount_${dto.currency}`,
                        type: KeyValuePairType.Integer
                    }
                }))?.integerValue
            ) || 0;

            if (subTotal < min_order_amount) {
                throw new BadRequestException({
                    error: `Order value should not be less than ${min_order_amount} ${dto.currency}`
                });
            }

            const total = subTotal + shippingCost - discount;

            // create a order within transaction
            const order = new Order();
            order.uuid = crypto.randomUUID();
            order.customer = customer;
            order.coupon = affiliateCoupon;
            order.globalCoupon = globalCoupon;
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

            // Clear the cart within transaction
            await queryRunner.manager.delete(CartItem, { uuid: In(dto.cartItemUuids) });

            // RECORD AFFILIATE COMMISSION
            if (affiliateCoupon?.affiliate && affiliateCoupon.code && discount >= 0) {
                const commissionAmount = discount;

                if (commissionAmount > 0 && affiliateCoupon.affiliate.wallet?.id) {
                    const walletId = affiliateCoupon.affiliate.wallet.id;
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
                    referralTx.description = `Commission from order #${order.uuid} using coupon ${affiliateCoupon.code}`;
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

                    // Update the statistics on the coupon
                    affiliateCoupon.ordersCount += 1;
                    affiliateCoupon.totalSales.amount += subTotal;
                    affiliateCoupon.totalSales.currencyCode = currency;
                    affiliateCoupon.totalCommission.amount += commissionAmount;
                    affiliateCoupon.totalCommission.currencyCode = currency;
                    await queryRunner.manager.save(affiliateCoupon);
                }
            } else if (globalCoupon && globalCoupon.code && discount >= 0) {
                const commissionAmount = discount;

                globalCoupon.ordersCount += 1;
                globalCoupon.totalSales.amount += subTotal;
                globalCoupon.totalSales.currencyCode = currency;
                globalCoupon.totalCommission.amount += commissionAmount;
                globalCoupon.totalCommission.currencyCode = currency;
                globalCoupon.timesUsed++;
                await queryRunner.manager.save(globalCoupon);
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
            if (total === 0) {
                order.status = OrderStatus.PAYMENT_SUCCESSFUL;
            }
            await queryRunner.manager.save(order);

            await queryRunner.commitTransaction();

            customer.ordersCount++;
            customer.cartItemsCount = 0;
            await this.customerRepository.save(customer);

            const notification = await this.notificationsService.create({
                customerUUID: customer.uuid,
                type: NotificationType.ORDER_PLACED,
                title: 'Order Placed',
                brief: 'Your order has been placed successfully.',
                message: `Your order #${order.uuid} has been placed. We'll notify you once it's confirmed.`,
                priority: NotificationPriority.HIGH,
                payload: {
                    type: NotificationType.ORDER_PLACED,
                    priority: NotificationPriority.HIGH,
                    isRead: String(false),
                },
            }).catch(err => this.logger.warn(`Failed to send ORDER_PLACED notification: ${err?.message}`));


            if (notification?.uuid) {
                this.logger.log(`Attempting to create push notification for order placement: ${JSON.stringify(order.uuid)}`);
                await this.pushNotificationService.sendToToken(notification?.uuid)
            }

            this.emailService.sendAdminNewOrderEmail({
                orderId: order.uuid,
                customerName: customer.fullName,
                customerEmail: customer.emailAddress ?? '',
                orderTotal: `${order.total.amount} ${order.total.currencyCode}`,
            }).catch(err => this.logger.error(`[Email] Failed to send admin new-order notification for order ${order.uuid}: ${err?.message}`));

            await this.paymentTimeoutQueue.add(
                'payment-timeout',
                { orderUuid: order.uuid },
                { delay: 30 * 60 * 1000, jobId: `payment-timeout-${order.uuid}` },
            ).catch(err => this.logger.error(`[Queue] Failed to enqueue payment timeout for order ${order.uuid}: ${err?.message}`));

            return order;
        } catch (error: any) {
            this.logger.error(`Error placing order: ${error?.response?.error || error}`);
            await queryRunner.rollbackTransaction();
            if (error instanceof HttpException) {
                throw error;
            } else {
                throw new InternalServerErrorException({
                    error: 'Failed to place order',
                    details: error?.response?.error || error?.message || error,
                });
            }
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

            let filtersObject: {
                customerUUID?: string,
            } = {};
            try {
                filtersObject = JSON.parse(filters);
            } catch {
                this.logger.warn("Unable to parse filters. Please check the documentation and try again.");
            }            
            const filter: OrderFilters = {}

            if (status || filtersObject) {
                filter.status = status;
                filter.customer = { uuid: filtersObject?.customerUUID };
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
                    shippingAddress: true,
                    customer: true,
                },
                order: {
                    id: "DESC",
                },
                skip: skip,
                take: take,
            });
            const result = orders.map((order) => {
                order.orderPlacementDate = order.createdAt;
                return order;
            });
            await this.attachTracking(result);
            return result;
        } catch (error: any) {
            this.logger.error(`Error fetching orders: ${error}`);
            throw new InternalServerErrorException({
                error: 'Failed to fetch orders',
                details: error,
            });
        }
    }

    /**
     * Returns the estimated count of orders
     *
     * @returns
     */
    countAll(): Promise<number> {
        return this.orderRepository.count({
            cache: true,
        });
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
            const result = orders.map((order) => {
                order.orderPlacementDate = order.createdAt;
                return order;
            });
            await this.attachTracking(result);
            return result;
        } catch (error: any) {
            this.logger.error(`Error fetching my orders: ${error}`);
            throw new InternalServerErrorException({
                error: 'Failed to fetch customer orders',
                details: error,
            });
        }
    }

    /**
     * Finds all orders made using a coupon
     *
     * @param coupon
     * @param filters
     * @param sort
     * @param pageNumber
     * @param itemsPerPage
     */
    findAllByCoupon(coupon: Coupon, filters: string = "", sort: string = "", pageNumber: number = 1, itemsPerPage: number = 24): Promise<Array<Order>> {
        this.logger.log(`Retrieving orders by coupon`);

        // Get pagination params
        const { skip, take } = getSkipAndTake(pageNumber, itemsPerPage);

        return this.orderRepository.find({
            cache: true,
            where: {
                coupon: {
                    id: coupon.id,
                },
            },
            skip: skip,
            take: take,
        });
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
                    shippingAddress: true,
                    customer: true,
                },
            });

            if (!order) throw new NotFoundException({
                error: 'Order not found',
            });

            order.orderPlacementDate = order.createdAt;

            const wmsLinks = await this.wmsOrderLinkRepository.find({
                where: { orderUuid: uuid },
                relations: ['wmsOrder'],
            });
            (order as any).wmsOrders = wmsLinks.map(l => l.wmsOrder);
            await this.attachTracking([order]);

            return order;
        } catch (error: any) {
            this.logger.error(`Error fetching order: ${error}`);
            throw new InternalServerErrorException({
                error: 'Failed to fetch order',
                details: error,
            });
        }
    }

    async getOrderTracking(orderUuid: string, customerUuid?: string): Promise<OrderTrackingSteps> {
        const whereClause: any = { uuid: orderUuid };
        if (customerUuid) whereClause.customer = { uuid: customerUuid };

        const order = await this.orderRepository.findOne({
            where: whereClause,
            relations: { paymentTransaction: true },
        });
        if (!order) throw new NotFoundException({ error: 'Order not found' });

        const links = await this.wmsOrderLinkRepository.find({
            where: { orderUuid },
            relations: ['wmsOrder'],
        });

        let inbound: JopWmsOrder | undefined;
        let outbound: JopWmsOrder | undefined;
        for (const link of links) {
            if (!link.wmsOrder) continue;
            if (link.wmsOrder.type === JopWmsOrderType.INBOUND) inbound = link.wmsOrder;
            if (link.wmsOrder.type === JopWmsOrderType.OUTBOUND) outbound = link.wmsOrder;
        }

        return this.buildTrackingSteps(order, inbound, outbound);
    }

    /**
     * update order
     * @param uuid
     * @param status
     * @returns
     */
    async updateStatus(uuid: string, status: OrderStatus, cancellationReason?: string): Promise<Order> {
        try {
            const order = await this.findOne(uuid);

            order.status = status;
            if (status === OrderStatus.CANCELLED) {
                order.cancellationReason = cancellationReason ?? null;
            }

            const saved = await this.orderRepository.save(order);

            const notificationMap: Partial<Record<OrderStatus, { type: NotificationType; title: string; brief: string; message: string, payload: NotificationPayload }>> = {
                [OrderStatus.CONFIRMED]: {
                    type: NotificationType.ORDER_CONFIRMED,
                    title: 'Order Confirmed',
                    brief: 'Your order has been confirmed.',
                    message: `Your order #${order.uuid} has been confirmed and is being prepared.`,
                    payload: {
                        type: NotificationType.ORDER_PLACED,
                        priority: NotificationPriority.HIGH,
                        isRead: String(false),
                    },
                },
                [OrderStatus.DELIVERED]: {
                    type: NotificationType.ORDER_DELIVERED,
                    title: 'Order Delivered',
                    brief: 'Your order has been delivered.',
                    message: `Your order #${order.uuid} has been delivered. Enjoy your purchase!`,
                    payload: {
                        type: NotificationType.ORDER_PLACED,
                        priority: NotificationPriority.HIGH,
                        isRead: String(false),
                    },
                },
                [OrderStatus.CANCELLED]: {
                    type: NotificationType.ORDER_CANCELLED,
                    title: 'Order Cancelled',
                    brief: 'Your order has been cancelled.',
                    message: `Your order #${order.uuid} has been cancelled.`,
                    payload: {
                        type: NotificationType.ORDER_PLACED,
                        priority: NotificationPriority.HIGH,
                        isRead: String(false),
                    },
                },
                [OrderStatus.PAYMENT_SUCCESSFUL]: {
                    type: NotificationType.PAYMENT_SUCCESSFUL,
                    title: 'Payment Successful',
                    brief: 'Your payment was processed successfully.',
                    message: `Payment for order #${order.uuid} was successful.`,
                    payload: {
                        type: NotificationType.ORDER_PLACED,
                        priority: NotificationPriority.HIGH,
                        isRead: String(false),
                    },
                },
                [OrderStatus.PAYMENT_REJECTED]: {
                    type: NotificationType.PAYMENT_FAILED,
                    title: 'Payment Failed',
                    brief: 'Your payment could not be processed.',
                    message: `Payment for order #${order.uuid} failed. Please try again or use a different payment method.`,
                    payload: {
                        type: NotificationType.ORDER_PLACED,
                        priority: NotificationPriority.HIGH,
                        isRead: String(false),
                    },
                },
            };

            const notif = notificationMap[status];
            if (notif && order.customer) {
                this.logger.log(`Attempting to create notification for order status update: ${JSON.stringify(order.uuid)}`);
                const notification = await this.notificationsService.create({
                    customerUUID: order.customer.uuid,
                    ...notif,
                    priority: NotificationPriority.HIGH,
                }).catch(err => this.logger.warn(`Failed to send ${notif.type} notification: ${err?.message}`));

                if (notification?.uuid) {
                    this.logger.log(`Attempting to create push notification for order status update: ${JSON.stringify(order.uuid)}`);
                    await this.pushNotificationService.sendToToken(notification?.uuid)
                }
            }

            const customerEmail = order.customer?.emailAddress;
            if (customerEmail) {
                const customerName = order.customer.fullName;
                if (status === OrderStatus.CONFIRMED) {
                    this.logger.log(`[Email] Sending order-confirmed email to ${customerEmail} for order ${order.uuid}`);
                    this.emailService.sendOrderConfirmedEmail(customerEmail, {
                        customerName,
                        orderId: order.uuid,
                        orderTotal: `${order.total.amount} ${order.total.currencyCode}`,
                    }).catch(err => this.logger.error(`[Email] Failed to send order-confirmed email for order ${order.uuid}: ${err?.message}`));
                } else if (status === OrderStatus.DELIVERED) {
                    this.logger.log(`[Email] Sending order-delivered email to ${customerEmail} for order ${order.uuid}`);
                    this.emailService.sendOrderDeliveredEmail(customerEmail, { customerName, orderId: order.uuid })
                        .catch(err => this.logger.error(`[Email] Failed to send order-delivered email for order ${order.uuid}: ${err?.message}`));
                } else if (status === OrderStatus.CANCELLED) {
                    this.logger.log(`[Email] Sending order-cancelled email to ${customerEmail} for order ${order.uuid}`);
                    this.emailService.sendOrderCancelledEmail(customerEmail, { customerName, orderId: order.uuid })
                        .catch(err => this.logger.error(`[Email] Failed to send order-cancelled email for order ${order.uuid}: ${err?.message}`));
                }
            } else {
                this.logger.warn(`[Email] Skipping email for order ${order.uuid} status=${status} — customer has no email address`);
            }

            return saved;
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
                    customer: true,
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

            if (order.customer) {
                this.notificationsService.create({
                    customerUUID: order.customer.uuid,
                    type: NotificationType.ORDER_CANCELLED,
                    title: 'Order Cancelled',
                    brief: 'Your order has been cancelled.',
                    message: `Your order #${order.uuid} has been cancelled and your stock has been restored.`,
                    priority: NotificationPriority.HIGH,
                }).catch(err => this.logger.warn(`Failed to send ORDER_CANCELLED notification: ${err?.message}`));

                if (order.customer.emailAddress) {
                    this.logger.log(`[Email] Sending order-cancelled email to ${order.customer.emailAddress} for order ${order.uuid}`);
                    this.emailService.sendOrderCancelledEmail(order.customer.emailAddress, {
                        customerName: order.customer.fullName,
                        orderId: order.uuid,
                    }).catch(err => this.logger.error(`[Email] Failed to send order-cancelled email for order ${order.uuid}: ${err?.message}`));
                } else {
                    this.logger.warn(`[Email] Skipping order-cancelled email for order ${order.uuid} — customer has no email address`);
                }
            }

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
    async orderPreview(customer: Customer, currencyCode: CurrencyCode = CurrencyCode.QAR, couponCode?: string): Promise<OrderPreviewResponse> {
        try {
            // Get cart items with relations
            const cartItems = await this.cartRepository.find({
                where: {
                    customer: { id: customer.id },
                    product: {
                        status: ProductStatus.ACTIVE,
                    }
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
                throw new BadRequestException(
                    'Cart is empty'
                );
            }

            // await Promise.all(
            //     cartItems.map(async (item) => {
            //         const checkProduct = await this.productRepository.findOne({
            //             where: {
            //                 id: item.product.id,
            //             },
            //         });

            //         if (!checkProduct) {
            //             throw new BadRequestException(
            //                 `Product not found`,
            //             );
            //         }

            //         if (checkProduct.status !== ProductStatus.ACTIVE) {
            //             throw new BadRequestException(
            //                 `Cannot create order for the non-active product ${checkProduct.slug}`,
            //             );
            //         }
            //     })
            // );

            const address = await this.addressRepository.findOne({
                where: {
                    customer: { id: customer.id },
                    isDefault: true,
                },
            });

            if (!address) {
                throw new BadRequestException(
                    'User address cannot be found.'
                );
            }

            // Validate cart items and prepare for shipping calculation
            const validatedItems: CartItem[] = [];
            let subTotal = 0;

            let campaign: Campaign | null = null;

            for (const item of cartItems) {
                // Check stock availability
                const stock = calculateStock(item.variant);

                if (stock < item.quantity) {
                    throw new BadRequestException(
                        `Insufficient stock for ${item.product.titleEn} - ${item.variant.titleEn}`
                    );
                }

                campaign = getBestCampaign(item.product);

                // const priceAmount = await this.pricingService.applyPriceOnProductVariant(item.product, item.variant, null, item.subTotal.currencyCode, false);
                const priceDiscount = await this.pricingService.applyPriceOnProductVariant(item.product, item.variant, campaign, currencyCode, true);

                const itemTotal = priceDiscount.amount * item.quantity;
                subTotal += itemTotal;

                validatedItems.push({
                    ...item
                });
            }

            const [exchangeRates] = await Promise.all([
                this.exchangeRateService.findAll("", "")
            ]);
            const currency = cartItems[0]?.subTotal.currencyCode;

            const freeShippingExchangeRate = 1 / (exchangeRates.find((rate) => rate.srcCurrencyCode === currency && rate.targetCurrencyCode === 'qar')?.factor || 1);

            let shippingCost = 0;
            let eta = "";
            let shippingCalculation: ShippingCalculationResult | null = null;

            // Fetch free shipping threshold once
            const freeShippingValue = Number(
                (await this.keyValuePairRepository.findOne({
                    where: { name: "free_shipping_above" }
                }))?.integerValue
            ) || 0;

            const freeShippingEnabled = Boolean(
                (await this.keyValuePairRepository.findOne({
                    where: {
                        name: "free_shipping_enabled",
                        type: KeyValuePairType.Boolean
                    }
                }))?.booleanValue
            ) || false;

            // Decide if we should charge shipping
            const shouldApplyShipping = !freeShippingEnabled || freeShippingValue === null || subTotal < (freeShippingValue * freeShippingExchangeRate);


            if (shouldApplyShipping) {
                const shippingCartItems = cartItems.map(item => ({
                    weight: item.variant.weight,
                    quantity: item.quantity,
                }));

                shippingCalculation = calculateCartShipping(
                    shippingCartItems,
                    address.country,
                    currencyCode,
                    exchangeRates,
                    subTotal
                );

                shippingCost = Math.ceil(shippingCalculation.totalShippingCost);
                eta = shippingCalculation.transitTime.estimatedRange;
            }

            // COUPON VALIDATION & DISCOUNT
            let discount = 0;
            if (couponCode) {
                let coupon: Coupon | GlobalCoupon | null = null;
                const affiliateCoupon = await this.couponRepository.findOne({
                    where: { code: couponCode?.toLowerCase().trim() },
                    relations: {
                        affiliate: {
                            customer: true,
                            wallet: true,
                        },
                    },
                });

                if(campaign && affiliateCoupon) {
                    throw new BadRequestException(
                        "Coupon cannot be applied. Campaign products exists."
                    )
                }

                coupon = affiliateCoupon;

                if (!affiliateCoupon) {
                    const globalCoupon = await this.globalCouponRepository.findOne({
                        where: { code: couponCode?.toLowerCase().trim() },
                    });
                    if (!globalCoupon) {
                        throw new BadRequestException(
                            "Coupon does not exists. Please try again with valid coupon."
                        )
                    }
                    if (globalCoupon.timesUsed === globalCoupon.usageLimit) {
                        throw new BadRequestException(
                            "Coupon usage limit exceeded. Please try again with valid coupon."
                        )
                    }
                    coupon = globalCoupon;
                }
                if (coupon) {
                    discount = calculateCouponDiscount(coupon, subTotal, customer.uuid);
                    // discount = Math.ceil(discount);
                }
            }

            // let subTotalInQar = subTotal;
            // if (currency.toLowerCase().trim() !== "qar") {

            //     const exchangeRate = exchangeRates
            //         .filter(exchangeRate => exchangeRate.srcCurrencyCode.toLowerCase().trim() === currency.toLowerCase().trim() && exchangeRate.targetCurrencyCode.toLowerCase().trim() === 'qar')
            //         .at(0) ?? null;

            //     if (!exchangeRate) {
            //         throw new NotFoundException({
            //             error: `Exchange Rate for ${currency} to qar not found`
            //         });
            //     }

            //     subTotalInQar = subTotal * exchangeRate.factor;
            // }

            // Calculate total order amount
            const totalAmount = subTotal + shippingCost - discount;

            // Return complete order preview
            const orderPreview: OrderPreviewResponse = {
                items: validatedItems,
                shippingAddress: address,
                cart_total: subTotal,
                discount: discount,
                shipping: shippingCalculation,
                shippingTotal: shippingCost,
                grand_total: totalAmount,
                eta: eta,
            };

            const min_order_amount = Number(
                (await this.keyValuePairRepository.findOne({
                    where: {
                        name: `min_order_amount_${currency}`,
                        type: KeyValuePairType.Integer
                    }
                }))?.integerValue
            ) || 0;

            if (subTotal < min_order_amount) {
                orderPreview.orderTotalWarning = "Order value should not be less than 250 QAR"
            }

            return orderPreview;
        } catch (error: any) {
            this.logger.error(`Error getting order preview: ${error?.response?.error || error}`);
            if (error instanceof HttpException) {
                throw error;
            } else {
                throw new InternalServerErrorException({
                    error: 'Failed to get order preview',
                    details: error?.response?.error || error,
                });
            }
        }
    }
}

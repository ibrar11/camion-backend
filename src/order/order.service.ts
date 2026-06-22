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
import { OrderSkuMetaJobData } from '../queue/types';
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

import { Affiliate } from "../referral/entities/affiliate.entity";

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
    OrderTrackingItem,
    OrderTrackingMetadata,
    OrderTrackingResponse,
} from "./types";

import { OrderTrackingEvent } from './entities/order-tracking-event.entity';
import { OrderTrackingStage } from './enums/OrderTrackingStage';

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
        @InjectRepository(Wallet) private readonly walletRepository: Repository<Wallet>,
        @InjectRepository(Affiliate) private readonly affiliateRepository: Repository<Affiliate>,
        @InjectRepository(KeyValuePair) private readonly keyValuePairRepository: Repository<KeyValuePair>,
        @InjectRepository(Product) private readonly productRepository: Repository<Product>,
        @Inject(PaymentsService) private readonly paymentService: PaymentsService,
        @Inject(ExchangeRateService) private readonly exchangeRateService: ExchangeRateService,
        @Inject(PricingService) private readonly pricingService: PricingService,
        @Inject(PushNotificationService) private readonly pushNotificationService: PushNotificationService,
        @InjectRepository(JopWmsOrderLink) private readonly wmsOrderLinkRepository: Repository<JopWmsOrderLink>,
        @InjectRepository(Customer) private readonly customerRepository: Repository<Customer>,
        @InjectRepository(OrderTrackingEvent) private readonly trackingEventRepository: Repository<OrderTrackingEvent>,
        private readonly notificationsService: NotificationsService,
        private readonly emailService: EmailService,
        @InjectQueue(QueueName.ORDER_SKUMETA_VALIDATION) private readonly orderSkuMetaQueue: Queue<OrderSkuMetaJobData>,
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

            const waybillNo = outbound?.waybillNo ?? null;
            order.tracking = {
                stage,
                status,
                waybillNo,
                trackingUrl: waybillNo ? `https://track.4px.com/#/result/0/${waybillNo}` : null,
                canRetryOutbound:
                    (stage === 'inbound' && inbound?.status === JopWmsInboundStatus.STORED) ||
                    (stage === 'outbound' && outbound?.status === JopWmsOutboundStatus.PROCESSING_FAILED),
            };
        }
    }

    private static readonly TRACKING_STAGES: { id: number; stage: OrderTrackingStage; name: string; nameAr: string }[] = [
        { id: 1, stage: OrderTrackingStage.ORDER_PLACED,      name: 'Order Placed',      nameAr: 'تم تقديم الطلب' },
        { id: 2, stage: OrderTrackingStage.PAYMENT_CONFIRMED, name: 'Payment Confirmed', nameAr: 'تم تأكيد الدفع' },
        { id: 3, stage: OrderTrackingStage.ORDER_CONFIRMED,   name: 'Order Confirmed',   nameAr: 'تم تأكيد الطلب' },
        { id: 4, stage: OrderTrackingStage.PROCESSING,        name: 'Processing',        nameAr: 'قيد المعالجة' },
        { id: 5, stage: OrderTrackingStage.PACKING,           name: 'Packing',           nameAr: 'قيد التغليف' },
        { id: 6, stage: OrderTrackingStage.DISPATCHING,       name: 'Dispatching',       nameAr: 'قيد الشحن' },
        { id: 7, stage: OrderTrackingStage.ORDER_DELIVERED,   name: 'Order Delivered',   nameAr: 'تم التسليم' },
        { id: 8, stage: OrderTrackingStage.ORDER_REVIEW,      name: 'Order Review',      nameAr: 'تقييم الطلب' },
    ];

    private static readonly CANCELLED_STAGE = { id: 9, name: 'Order Cancelled', nameAr: 'تم إلغاء الطلب' };

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

                // FIXME: Fix this
                orderItem.price = {
                    ...priceAmount,
                    amount: priceAmount.amount,
                };

                // FIXME: Fix this
                orderItem.discountedPrice = {
                    ...priceAmount,
                    amount: 0,
                };
                orderItem.quantity = cart.quantity;

                // FIXME: Fix this
                orderItem.total = {
                    amount: totalAmount,
                    minorAmount: 0,
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
                    where: { name: `free_shipping_above_${dto.currency}`.toLowerCase().trim() }
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

            // FIXME: Fix this
            order.subTotal = {
                amount: subTotal,
                minorAmount: 0,
                currencyCode: currency,
            };

            // FIXME: Fix this
            order.shippingCost = {
                amount: shippingCost,
                minorAmount: 0,
                currencyCode: currency,
            };

            // FIXME: Fix this
            order.discount = {
                amount: discount,
                minorAmount: 0,
                currencyCode: currency,
            };

            // FIXME: Fix this
            order.total = {
                amount: total,
                minorAmount: 0,
                currencyCode: currency,
            };
            order.eta = eta;
            order.orderItems = orderItems;
            order.shippingAddress = address;

            await queryRunner.manager.save(order);

            await queryRunner.manager.save(
                queryRunner.manager.create(OrderTrackingEvent, {
                    orderUuid: order.uuid,
                    stage: OrderTrackingStage.ORDER_PLACED,
                    date: new Date(),
                    trackingId: null,
                }),
            );

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

            if (order.status === OrderStatus.PAYMENT_SUCCESSFUL) {
                // Zero-cost orders (e.g. fully covered by a coupon) never hit the
                // payment gateway webhook, so send the order-confirmed notification
                // and email here instead of waiting for a webhook that won't come.
                await this.sendOrderConfirmation(order, customer);
            }

            this.emailService.sendAdminNewOrderEmail({
                orderId: order.uuid,
                customerName: customer.fullName,
                customerEmail: customer.emailAddress ?? '',
                orderTotal: `${order.total.amount} ${order.total.currencyCode}`,
            }).catch(err => this.logger.error(`[Email] Failed to send admin new-order notification for order ${order.uuid}: ${err?.message}`));

            await this.orderSkuMetaQueue.add(
                'order-skumeta-check',
                { orderUuid: order.uuid },
                { jobId: `order-skumeta-check-${order.uuid}` },
            ).catch(err => this.logger.error(`[Queue] Failed to enqueue order sku meta sync check for order ${order.uuid}: ${err?.message}`));

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
     * Sends the combined "payment successful / order placed" push notification
     * and email once payment is confirmed successful. Order status at this
     * point is PAYMENT_SUCCESSFUL, not admin-CONFIRMED, so this deliberately
     * does not reuse the ORDER_CONFIRMED notification/sendOrderConfirmedEmail
     * used by the separate admin manual-confirm flow in updateStatus(). Called
     * from the zero-total path in create() (no gateway webhook fires for those)
     * and mirrored in PaymentsWebhookService for the normal paid-order path.
     */
    private async sendOrderConfirmation(order: Order, customer: Customer): Promise<void> {
        const orderTotal = `${order.total.amount} ${order.total.currencyCode}`;

        const notification = await this.notificationsService.create({
            customerUUID: customer.uuid,
            type: NotificationType.PAYMENT_SUCCESSFUL,
            title: 'Payment Successful',
            brief: 'Your order has been placed and payment confirmed.',
            message: `Your order #${order.uuid} has been placed and payment of ${orderTotal} was received successfully. Your order is now being processed.`,
            priority: NotificationPriority.HIGH,
            payload: {
                type: NotificationType.PAYMENT_SUCCESSFUL,
                priority: NotificationPriority.HIGH,
                isRead: String(false),
            },
        }).catch(err => this.logger.warn(`Failed to send payment-success notification: ${err?.message}`));

        if (notification?.uuid) {
            this.logger.log(`Attempting to create push notification for payment success: ${JSON.stringify(order.uuid)}`);
            await this.pushNotificationService.sendToToken(notification.uuid);
        }

        if (!customer.emailAddress) {
            this.logger.warn(`[Email] Skipping payment-success email for order ${order.uuid} — customer has no email address`);
            return;
        }

        this.emailService.sendPaymentSuccessEmail(customer.emailAddress, {
            customerName: customer.fullName,
            orderId: order.uuid,
            orderTotal,
            paymentConfirmation: `Payment of ${orderTotal} received successfully.`,
            ...this.buildPaymentSuccessEmailExtras(order),
            nextSteps: "We're now preparing your order for shipment. You'll receive another email with tracking details once it ships.",
        }).catch(err => this.logger.error(`[Email] Failed to send payment-success email for order ${order.uuid}: ${err?.message}`));
    }

    /**
     * Builds the line-items and delivery-details portions of the
     * payment-success email payload — shared with PaymentsWebhookService's
     * mirrored logic for the normal (non-zero-total) paid-order path.
     */
    private buildPaymentSuccessEmailExtras(order: Order): { items: Array<{ name: string; quantity: number; unitPrice: string; lineTotal: string }>; deliveryDetails: { fullName: string; streetAddress: string; apartment?: string; city: string; state: string; country: string; zipCode: string; phoneNumber: string } } {
        const items = order.orderItems.map(item => ({
            name: item.variant?.titleEn || item.product?.titleEn,
            quantity: item.quantity,
            unitPrice: `${item.price.amount} ${item.price.currencyCode}`,
            lineTotal: `${item.total.amount} ${item.total.currencyCode}`,
        }));

        const deliveryDetails = {
            fullName: order.shippingAddress.fullName,
            streetAddress: order.shippingAddress.streetAddress,
            apartment: order.shippingAddress.apartment,
            city: order.shippingAddress.city,
            state: order.shippingAddress.state,
            country: order.shippingAddress.country,
            zipCode: order.shippingAddress.zipCode,
            phoneNumber: order.shippingAddress.phoneNumber,
        };

        return { items, deliveryDetails };
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
                invalidOrder?: boolean,
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
                filter.invalidOrder = filtersObject?.invalidOrder;
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

    async getOrderTracking(orderUuid: string, customerUuid?: string, language: string = 'en'): Promise<OrderTrackingResponse> {
        const whereClause: any = { uuid: orderUuid };
        if (customerUuid) whereClause.customer = { uuid: customerUuid };

        const order = await this.orderRepository.findOne({ where: whereClause });
        if (!order) throw new NotFoundException({ error: 'Order not found' });

        const events = await this.trackingEventRepository.find({
            where: { orderUuid, active: true },
            order: { createdAt: 'ASC' },
        });

        const eventMap = new Map(events.map(e => [e.stage, e]));

        const stages: OrderTrackingItem[] = OrderService.TRACKING_STAGES.map(({ id, stage, name, nameAr }) => {
            const event = eventMap.get(stage);
            return {
                id,
                name: language === 'ar' ? nameAr : name,
                checked: !!event,
                date: event?.date ?? null,
                metadata: {
                    trackingId: event?.trackingId ?? null,
                    cancellationReason: event?.cancellationReason ?? null,
                    reviewText: event?.reviewText ?? null,
                    reviewRating: event?.reviewRating ?? null,
                },
            };
        });

        const cancelledEvent = eventMap.get(OrderTrackingStage.ORDER_CANCELLED);
        const { id, name, nameAr } = OrderService.CANCELLED_STAGE;
        const cancelled: OrderTrackingItem | null = cancelledEvent ? {
            id,
            name: language === 'ar' ? nameAr : name,
            checked: true,
            date: cancelledEvent.date,
            metadata: {
                trackingId: null,
                cancellationReason: cancelledEvent.cancellationReason ?? null,
                reviewText: null,
                reviewRating: null,
            },
        } : null;

        return { stages, cancelled };
    }

    async backfillTrackingEvents(): Promise<{ processed: number; stamped: number; errors: string[] }> {
        const orders = await this.orderRepository.find({
            relations: { paymentTransaction: true },
            order: { createdAt: 'ASC' },
        });

        let stamped = 0;
        const errors: string[] = [];

        const confirmedImplied = new Set([
            OrderStatus.CONFIRMED,
            OrderStatus.DELIVERED,
            OrderStatus.RETURN_REQUESTED,
            OrderStatus.RETURNED,
        ]);
        const deliveredImplied = new Set([
            OrderStatus.DELIVERED,
            OrderStatus.RETURN_REQUESTED,
            OrderStatus.RETURNED,
        ]);

        for (const order of orders) {
            try {
                const existing = await this.trackingEventRepository.find({
                    where: { orderUuid: order.uuid },
                    select: ['stage'],
                });
                const alreadyStamped = new Set(existing.map(e => e.stage));

                const toStamp: Array<Partial<OrderTrackingEvent>> = [];

                const maybe = (stage: OrderTrackingStage, event: Partial<OrderTrackingEvent>) => {
                    if (!alreadyStamped.has(stage)) toStamp.push({ stage, active: true, trackingId: null, cancellationReason: null, ...event });
                };

                maybe(OrderTrackingStage.ORDER_PLACED, { date: new Date(order.createdAt) });

                if (order.paymentTransaction?.status === PaymentStatus.PAID) {
                    maybe(OrderTrackingStage.PAYMENT_CONFIRMED, { date: order.paymentTransaction.updatedAt });
                }

                if (confirmedImplied.has(order.status)) {
                    maybe(OrderTrackingStage.ORDER_CONFIRMED, { date: order.updatedAt });
                }

                if (deliveredImplied.has(order.status)) {
                    maybe(OrderTrackingStage.ORDER_DELIVERED, { date: order.updatedAt });
                }

                if (order.status === OrderStatus.CANCELLED) {
                    maybe(OrderTrackingStage.ORDER_CANCELLED, {
                        date: order.updatedAt,
                        cancellationReason: order.cancellationReason ?? null,
                    });
                }

                // WMS stages via linked orders
                const links = await this.wmsOrderLinkRepository.find({
                    where: { orderUuid: order.uuid },
                    relations: ['wmsOrder'],
                });

                const inbounds = links
                    .filter(l => l.wmsOrder?.type === JopWmsOrderType.INBOUND)
                    .map(l => l.wmsOrder)
                    .sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime());

                const outbounds = links
                    .filter(l => l.wmsOrder?.type === JopWmsOrderType.OUTBOUND)
                    .map(l => l.wmsOrder);

                if (inbounds.length > 0) {
                    maybe(OrderTrackingStage.PROCESSING, { date: inbounds[0].createdAt });
                }

                const storedInbound = inbounds.find(i => i.status === JopWmsInboundStatus.STORED);
                if (storedInbound) {
                    maybe(OrderTrackingStage.PACKING, { date: storedInbound.updatedAt });
                }

                const shippedOutbound = outbounds.find(o => !!o.waybillNo);
                if (shippedOutbound) {
                    maybe(OrderTrackingStage.DISPATCHING, {
                        date: shippedOutbound.updatedAt,
                        trackingId: shippedOutbound.waybillNo,
                    });
                }

                if (toStamp.length > 0) {
                    await this.trackingEventRepository.save(
                        toStamp.map(event => this.trackingEventRepository.create({ orderUuid: order.uuid, ...event }))
                    );
                    stamped += toStamp.length;
                }
            } catch (err: any) {
                this.logger.warn(`backfillTrackingEvents: failed for order ${order.uuid}: ${err?.message}`);
                errors.push(`${order.uuid}: ${err?.message}`);
            }
        }

        this.logger.log(`backfillTrackingEvents: processed=${orders.length} stamped=${stamped} errors=${errors.length}`);
        return { processed: orders.length, stamped, errors };
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

            if (status === OrderStatus.CONFIRMED && order.status !== OrderStatus.PAYMENT_SUCCESSFUL) {
                throw new BadRequestException({
                    error: `Cannot confirm order — payment has not succeeded yet (current status: ${order.status})`,
                });
            }

            order.status = status;
            if (status === OrderStatus.CANCELLED) {
                order.cancellationReason = cancellationReason ?? null;
            }

            const saved = await this.orderRepository.save(order);

            const trackingEventMap: Partial<Record<OrderStatus, () => Promise<void>>> = {
                [OrderStatus.PAYMENT_SUCCESSFUL]: async () => {
                    const exists = await this.trackingEventRepository.findOne({
                        where: { orderUuid: order.uuid, stage: OrderTrackingStage.PAYMENT_CONFIRMED },
                    });
                    if (!exists) {
                        await this.trackingEventRepository.save(
                            this.trackingEventRepository.create({
                                orderUuid: order.uuid,
                                stage: OrderTrackingStage.PAYMENT_CONFIRMED,
                                date: new Date(),
                                trackingId: null,
                            }),
                        );
                    }
                },
                [OrderStatus.CONFIRMED]: async () => {
                    const exists = await this.trackingEventRepository.findOne({
                        where: { orderUuid: order.uuid, stage: OrderTrackingStage.ORDER_CONFIRMED },
                    });
                    if (!exists) {
                        await this.trackingEventRepository.save(
                            this.trackingEventRepository.create({
                                orderUuid: order.uuid,
                                stage: OrderTrackingStage.ORDER_CONFIRMED,
                                date: new Date(),
                                trackingId: null,
                            }),
                        );
                    }
                },
                [OrderStatus.DELIVERED]: async () => {
                    const exists = await this.trackingEventRepository.findOne({
                        where: { orderUuid: order.uuid, stage: OrderTrackingStage.ORDER_DELIVERED },
                    });
                    if (!exists) {
                        await this.trackingEventRepository.save(
                            this.trackingEventRepository.create({
                                orderUuid: order.uuid,
                                stage: OrderTrackingStage.ORDER_DELIVERED,
                                date: new Date(),
                                trackingId: null,
                            }),
                        );
                    }
                },
                [OrderStatus.CANCELLED]: async () => {
                    await this.trackingEventRepository.update(
                        { orderUuid: order.uuid, stage: OrderTrackingStage.ORDER_CANCELLED, active: true },
                        { active: false },
                    );
                    await this.trackingEventRepository.save(
                        this.trackingEventRepository.create({
                            orderUuid: order.uuid,
                            stage: OrderTrackingStage.ORDER_CANCELLED,
                            date: new Date(),
                            trackingId: null,
                            cancellationReason: cancellationReason ?? null,
                            active: true,
                        }),
                    );
                },
            };

            await trackingEventMap[status]?.();

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
                [OrderStatus.PAYMENT_FAILED]: {
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
                [OrderStatus.PAYMENT_CANCELLED]: {
                    type: NotificationType.PAYMENT_FAILED,
                    title: 'Payment Cancelled',
                    brief: 'Your payment was cancelled.',
                    message: `Payment for order #${order.uuid} was cancelled. You can return to checkout to try again.`,
                    payload: {
                        type: NotificationType.ORDER_PLACED,
                        priority: NotificationPriority.HIGH,
                        isRead: String(false),
                    },
                },
                [OrderStatus.PAYMENT_EXPIRED]: {
                    type: NotificationType.PAYMENT_FAILED,
                    title: 'Payment Expired',
                    brief: 'Your payment window has expired.',
                    message: `Payment for order #${order.uuid} expired before it was completed. Please place a new order to try again.`,
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
            if (error instanceof HttpException) {
                throw error;
            }
            throw new InternalServerErrorException({
                error: 'Failed to update order status',
                details: error,
            });
        }
    }

    /**
     * Restores stock levels for every item on an order. Shared by cancel()
     * and the payment-expiry scheduler. Expects orderItems.variant and
     * orderItems.warehouse relations to already be loaded on `order`.
     */
    private async restoreInventory(order: Order): Promise<void> {
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

            level.quantity += item.quantity;

            await this.inventoryLevelRepository.save(level);
        }
    }

    /**
     * Reverses the coupon-usage bookkeeping applied at order creation
     * (create(), lines ~512-569) — usage counters, sales/commission
     * totals, and affiliate wallet credit. Used only when a payment
     * permanently expires, so a failed/cancelled-but-retryable order
     * keeps its coupon held for the retry attempt.
     */
    private async releaseCouponUsage(order: Order): Promise<void> {
        const commissionAmount = order.discount?.amount ?? 0;

        if (order.coupon) {
            const coupon = await this.couponRepository.findOne({
                where: { id: order.coupon.id },
                relations: { affiliate: { wallet: true } },
            });

            if (coupon) {
                coupon.ordersCount = Math.max(0, coupon.ordersCount - 1);
                coupon.totalSales.amount = Math.max(0, coupon.totalSales.amount - (order.subTotal?.amount ?? 0));
                coupon.totalCommission.amount = Math.max(0, coupon.totalCommission.amount - commissionAmount);
                await this.couponRepository.save(coupon);

                if (coupon.affiliate?.wallet && commissionAmount > 0) {
                    const wallet = coupon.affiliate.wallet;
                    wallet.amount.amount = Math.max(0, wallet.amount.amount - commissionAmount);
                    wallet.amountAvailable.amount = Math.max(0, wallet.amountAvailable.amount - commissionAmount);
                    await this.walletRepository.save(wallet);

                    const affiliate = coupon.affiliate;
                    affiliate.totalCommission.amount = Math.max(0, affiliate.totalCommission.amount - commissionAmount);
                    affiliate.remainingBalance.amount = Math.max(0, affiliate.remainingBalance.amount - commissionAmount);
                    affiliate.couponsUsed = Math.max(0, affiliate.couponsUsed - 1);
                    await this.affiliateRepository.save(affiliate);
                }
            }
        } else if (order.globalCoupon) {
            const globalCoupon = await this.globalCouponRepository.findOne({
                where: { id: order.globalCoupon.id },
            });

            if (globalCoupon) {
                globalCoupon.ordersCount = Math.max(0, globalCoupon.ordersCount - 1);
                globalCoupon.totalSales.amount = Math.max(0, globalCoupon.totalSales.amount - (order.subTotal?.amount ?? 0));
                globalCoupon.totalCommission.amount = Math.max(0, globalCoupon.totalCommission.amount - commissionAmount);
                globalCoupon.timesUsed = Math.max(0, globalCoupon.timesUsed - 1);
                await this.globalCouponRepository.save(globalCoupon);
            }
        }
    }

    /**
     * Creates a fresh SkipCash checkout session for an order stuck in
     * PAYMENT_PENDING/PAYMENT_FAILED/PAYMENT_CANCELLED, reusing the same
     * order (no duplicate order is created) so the customer can retry
     * payment. PAYMENT_PENDING is included so a customer who simply closed
     * the checkout tab mid-session (no webhook ever arrives in that case)
     * isn't stuck waiting out the payment-expiry window to try again.
     */
    async retryPayment(uuid: string, customerUuid?: string): Promise<Order> {
        const order = await this.orderRepository.findOne({
            where: { uuid },
            relations: {
                customer: true,
                shippingAddress: true,
                paymentTransaction: true,
            },
        });

        if (!order) {
            throw new NotFoundException({
                error: 'Order not found',
            });
        }

        if (customerUuid && order.customer?.uuid !== customerUuid) {
            throw new NotFoundException({
                error: 'Order not found',
            });
        }

        const retryableStatuses = [
            OrderStatus.PAYMENT_PENDING,
            OrderStatus.PAYMENT_FAILED,
            OrderStatus.PAYMENT_CANCELLED,
        ];
        if (!retryableStatuses.includes(order.status)) {
            throw new BadRequestException({
                error: `Cannot retry payment for an order in status ${order.status}`,
            });
        }

        const customerName: Array<string> = order.customer.fullName.split(" ");
        const provider = order.paymentTransaction?.provider ?? PaymentProvider.SKIPCASH;

        const paymentPayload = {
            provider,
            amount: order.total.amount,
            currency: order.total.currencyCode,
            orderUUID: order.uuid,
            firstName: customerName[0],
            lastName: customerName[1] ?? customerName[0],
            emailAddress: order.customer.emailAddress,
            phoneNumber: order.shippingAddress.phoneNumber.replace(/\s+/g, ""),
            street: order.shippingAddress.streetAddress,
            city: order.shippingAddress.city,
            state: order.shippingAddress.state,
            country: order.shippingAddress.country,
            postalCode: order.shippingAddress.zipCode,
        };

        const payment = await this.paymentService.createPayment(paymentPayload);

        order.paymentTransaction = payment;
        order.status = OrderStatus.PAYMENT_PENDING;

        return this.orderRepository.save(order);
    }

    /**
     * Force-expires a single stale, never-completed payment order — called
     * per-order by the payment-expiry scheduler (order.scheduler.ts). Releases
     * the stock and coupon usage held since order creation, since a customer
     * who never retries has no further claim on either.
     */
    async expireStalePayment(uuid: string): Promise<void> {
        const order = await this.orderRepository.findOne({
            where: { uuid },
            relations: {
                customer: true,
                coupon: true,
                globalCoupon: true,
                orderItems: {
                    variant: true,
                    warehouse: true,
                },
            },
        });

        if (!order) return;

        const expirable = [
            OrderStatus.PAYMENT_PENDING,
            OrderStatus.PAYMENT_FAILED,
            OrderStatus.PAYMENT_CANCELLED,
        ];
        if (!expirable.includes(order.status)) return;

        await this.restoreInventory(order);
        await this.releaseCouponUsage(order);

        order.status = OrderStatus.PAYMENT_EXPIRED;
        await this.orderRepository.save(order);

        if (order.customer) {
            this.notificationsService.create({
                customerUUID: order.customer.uuid,
                type: NotificationType.PAYMENT_FAILED,
                title: 'Payment Expired',
                brief: 'Your payment window has expired.',
                message: `Payment for order #${order.uuid} expired before it was completed. Please place a new order to try again.`,
                priority: NotificationPriority.HIGH,
            }).catch(err => this.logger.warn(`Failed to send PAYMENT_EXPIRED notification: ${err?.message}`));

            if (order.customer.emailAddress) {
                this.emailService.sendOrderCancelledEmail(order.customer.emailAddress, {
                    customerName: order.customer.fullName,
                    orderId: order.uuid,
                    reason: 'Your payment window expired before it was completed. Please place a new order to try again.',
                }).catch(err => this.logger.error(`[Email] Failed to send payment-expired email for order ${order.uuid}: ${err?.message}`));
            }
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

            await this.restoreInventory(order);

            order.status = OrderStatus.CANCELLED;

            await this.orderRepository.save(order);

            const cancelledExists = await this.trackingEventRepository.findOne({
                where: { orderUuid: order.uuid, stage: OrderTrackingStage.ORDER_CANCELLED },
            });
            if (!cancelledExists) {
                await this.trackingEventRepository.save(
                    this.trackingEventRepository.create({
                        orderUuid: order.uuid,
                        stage: OrderTrackingStage.ORDER_CANCELLED,
                        date: new Date(),
                        trackingId: null,
                        cancellationReason: null,
                    }),
                );
            }

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

                item.availableStock = stock;
                item.isAvailable = stock > 0;

                item.subTotal = {
                    amount: priceDiscount.amount * item.quantity,
                    currencyCode: priceDiscount.currencyCode,
                };
                item.discountPrice = {
                    amount: 0,
                    currencyCode: priceDiscount.currencyCode,
                };
                item.total = {
                    amount: priceDiscount.amount * item.quantity,
                    currencyCode: priceDiscount.currencyCode,
                };
                
                validatedItems.push(item);
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
                    where: { name: `free_shipping_above_${currency}`.toLowerCase().trim() }
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

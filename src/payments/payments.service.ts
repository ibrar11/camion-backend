import {
    HttpException,
    Inject,
    Injectable,
    InternalServerErrorException,
    Logger,
    NotFoundException
} from "@nestjs/common";

import { InjectRepository } from "@nestjs/typeorm";
import { In, Repository } from "typeorm";

import { CreatePaymentDto } from "./dtos/CreatePaymentDto";
import { CreateSkipCashSessionDto } from "./dtos/CreateSkipCashSessionDto";

import { PaymentTransaction } from "./entities/payment-transaction.entity";

import { PaymentStrategyFactory } from "./factories/PaymentStrategyFactory";

import { PaymentStatus } from "./enums/PaymentStatus";
import { OrderStatus } from "../order/enums/OrderStatus";

import { ExchangeRateService } from "../pricing/exchange-rate.service";

import { PaymentProvider } from "./enums/PaymentProvider";

import { getExchangedPrice } from "../common/currency";

import { SkipCashSessionService } from "./skipcash-session.service";

import { SkipcashSdkResultDto } from "./dtos/SkipcashSdkResultDto";

import { Order } from "../order/entities/order.entity";

import { CartItem } from "../cart/entities/cart-items.entity";

import { OrderTrackingEvent } from "../order/entities/order-tracking-event.entity";

import { Notification } from "../notifications/entities/notification.entity";
import { NotificationsService } from "../notifications/notifications.service";
import { NotificationType } from "../notifications/enums/notification-type.enum";
import { NotificationPriority } from "../notifications/enums/notification-priority.enum";
import { PushNotificationService } from "../notifications/push-notification.service";

import { EmailService } from "../email/email.service";

import { SavedCardsService } from "./saved-cards.service";

import { OrderTrackingStage } from "../order/enums/OrderTrackingStage";

import { getOrderReference } from "../common/maskUuid";

@Injectable()
export class PaymentsService {
    private readonly logger = new Logger(PaymentsService.name);

    constructor(
        @InjectRepository(PaymentTransaction) private paymentTransactionRepository: Repository<PaymentTransaction>,
        @InjectRepository(Order) private orderRepository: Repository<Order>,
        @Inject(ExchangeRateService) private readonly exchangeRateService: ExchangeRateService,
        @Inject(SkipCashSessionService) private readonly skipCashSessionService: SkipCashSessionService,
        @InjectRepository(CartItem) private cartRepository: Repository<CartItem>,
        @InjectRepository(OrderTrackingEvent) private readonly trackingEventRepository: Repository<OrderTrackingEvent>,
        @Inject(PushNotificationService) private readonly pushNotificationService: PushNotificationService,
        private readonly notificationsService: NotificationsService,
        private readonly emailService: EmailService,
        private readonly savedCardsService: SavedCardsService,
        private strategyfactory: PaymentStrategyFactory,
    ) { }

    /**
     * Creates new payment
     *
     * @param dto
     * @returns
     */
    async createPayment(dto: CreatePaymentDto): Promise<PaymentTransaction> {
        try {
            this.logger.log(`Attempting to create payment for order ${dto.orderUUID} customer: ${dto.firstName} ${dto.lastName}`);

            // Create payment transaction
            const transaction = this.paymentTransactionRepository.create({
                provider: dto.provider,
                amount: dto.amount,
                currency: dto.currency,
                status: PaymentStatus.PENDING
            })
            await this.paymentTransactionRepository.save(transaction);

            if (dto.amount.amount > 0 || dto.amount.minorAmount > 0) {
                const exchangeRates = await this.exchangeRateService.findAllFull();
                if (dto?.provider === PaymentProvider.SKIPCASH) {
                    if (dto.currency.toLowerCase().trim() !== "qar") {

                        const exchangeRate = exchangeRates
                            .filter(exchangeRate => exchangeRate.srcCurrencyCode.toLowerCase().trim() === dto.currency.toLowerCase().trim() && exchangeRate.targetCurrencyCode.toLowerCase().trim() === 'qar')
                            .at(0) ?? null;

                        if (!exchangeRate) {
                            throw new NotFoundException({
                                error: `Exchange Rate for ${dto.currency} to qar not found`
                            });
                        }

                        // convert the total in QAR for skipcash.
                        dto.amount = getExchangedPrice(dto.amount, dto.currency, exchangeRate.factor);
                    }
                }

                // fetch the strategy for specified provider
                const strategy = this.strategyfactory.getStrategy(dto.provider);

                // intialize the payment creation for specifed provider
                const result = await strategy.InitiatePayment(dto);

                transaction.transactionId = result.transactionId;
                transaction.rawResponse = result.raw;
            }

            this.logger.log(`Completed create payment for order ${dto.orderUUID} customer: ${dto.firstName} ${dto.lastName}`);
            return await this.paymentTransactionRepository.save(transaction);

        } catch (error: any) {
            this.logger.error(`Error creating payment: ${error?.response?.data || error.message}`);
            throw error;
        }
    }

    /**
     * Creates new skipcash payment session
     *
     * @param customerUuid
     * @param dto
     * @returns
     */
    async createSkipCashSession(
        customerUuid: string,
        dto: CreateSkipCashSessionDto,
    ): Promise<PaymentTransaction> {

        // Create payment transaction
        const transaction = this.paymentTransactionRepository.create({
            provider: dto.provider,
            amount: dto.amount,
            currency: dto.currency,
            status: PaymentStatus.PENDING,
            paymentMethod: dto.paymentMethod,
        })
        await this.paymentTransactionRepository.save(transaction);

        const result = await this.skipCashSessionService.createSession(customerUuid, dto);

        transaction.transactionId = result.paymentId || '';
        transaction.rawResponse = result;

        this.logger.log(`Completed create payment for order ${dto.order} customer: ${dto.firstName} ${dto.lastName}`);
        return await this.paymentTransactionRepository.save(transaction);
    }

    /**
     * Creates new skipcash payment session
     *
     * @param customerUuid
     * @param dto
     * @returns
     */
    async paymentResult(
        dto: SkipcashSdkResultDto,
    ): Promise<PaymentTransaction> {
        try {
            this.logger.log(`Attempting to update payment result for order ${dto.orderUUID}`);

            let order: Order | null = null;
            const uuid = dto.orderUUID;

            console.log("uuiduuiduuiduuiduuid", uuid)

            if (uuid.length === 6) {
                order = await this.orderRepository
                    .createQueryBuilder('order')
                    .leftJoinAndSelect('order.customer', 'customer')
                    .leftJoinAndSelect('order.shippingAddress', 'shippingAddress')
                    .leftJoinAndSelect('order.paymentTransaction', 'paymentTransaction')
                    .leftJoinAndSelect('order.orderItems', 'orderItems')
                    .leftJoinAndSelect('orderItems.product', 'product')
                    .leftJoinAndSelect('orderItems.variant', 'variant')
                    .where('RIGHT("order"."uuid"::text, 6) = :uuid', {
                        uuid,
                    })
                    .getOne();
            } else {
                order = await this.orderRepository.findOne({
                    where: { uuid },
                    relations: {
                        customer: true,
                        shippingAddress: true,
                        paymentTransaction: true,
                        orderItems: {
                            product: true,
                            variant: true,
                        },
                    },
                });
            }

            if (!order) {
                throw new NotFoundException({
                    error: `Order not found for payment status update`
                });
            }

            // Create payment transaction
            const transaction = await this.paymentTransactionRepository.findOne({
                where: {
                    id: order.paymentTransaction.id
                },
                relations: {
                    order: {
                        customer: {
                            savedCards: true
                        }
                    }
                }
            });

            if (!transaction) {
                throw new NotFoundException({
                    error: `Payment transaction not found for payment status update`
                });
            }

            const newStatus = dto.paymentStatus;

            if (transaction.status === PaymentStatus.PAID) {
                this.logger.log(
                    `Transaction already paid, skipping: ${transaction.transactionId}`,
                );
                return transaction;
            }

            transaction.status = newStatus;
            transaction.transactionId = dto.paymentId;
            transaction.lastAttemptAt = new Date();

            if (newStatus !== PaymentStatus.PAID) {
                transaction.errorCode = dto.errorCode || null;
                transaction.failureReason = dto.failureReason || null;
                transaction.paymentMethod = transaction.paymentMethod ?? transaction.provider;
            }

            await this.paymentTransactionRepository.save(transaction);

            this.logger.log(
                `Transaction ${transaction.id} updated to ${newStatus}`,
            );

            let notification: Notification | void = undefined;

            if (newStatus === PaymentStatus.PAID) {
                this.logger.log(`Payment SUCCESS for transaction: ${transaction.transactionId}`);

                order.status = OrderStatus.PAYMENT_SUCCESSFUL;
                await this.orderRepository.save(order);

                if (dto.tokenId && dto.tokenId !== "NA" && order.customer) {
                    const savedCard = await this.savedCardsService.saveCardToken(
                        order.customer,
                        dto.tokenId
                    );
                    this.logger.log(`Card successfully saved: ${JSON.stringify(savedCard)}`);
                    transaction?.order?.customer?.savedCards?.push(savedCard);
                }

                const paymentEventExists = await this.trackingEventRepository.findOne({
                    where: { orderUuid: order.uuid, stage: OrderTrackingStage.PAYMENT_CONFIRMED },
                });
                if (!paymentEventExists) {
                    await this.trackingEventRepository.save(
                        this.trackingEventRepository.create({
                            orderUuid: order.uuid,
                            stage: OrderTrackingStage.PAYMENT_CONFIRMED,
                            date: new Date(),
                            trackingId: null,
                        }),
                    );
                }

                const orderProductVariants = order.orderItems.map(item => ({
                    productId: item.product.id,
                    variantId: item.variant.id,
                    quantity: item.quantity,
                }));

                // Find cart items for this customer that match the order items
                const cartItems = await this.cartRepository.find({
                    where: {
                        customer: { id: order.customer.id },
                    },
                    relations: ['product', 'variant'],
                });

                // Filter cart items that match the ordered items
                const cartItemsToDelete = cartItems.filter(cartItem => {
                    return orderProductVariants.some(ordered =>
                        ordered.productId === cartItem.product.id &&
                        ordered.variantId === cartItem.variant.id
                    );
                });

                if (cartItemsToDelete.length > 0) {
                    const uuidsToDelete = cartItemsToDelete.map(item => item.uuid);
                    await this.cartRepository.delete({ uuid: In(uuidsToDelete) });
                    this.logger.log(`Cleared ${uuidsToDelete.length} cart items for order ${order.uuid}`);
                }

                if (order.customer) {
                    const orderTotal = `${order.total.amount} ${order.total.currencyCode}`;

                    notification = await this.notificationsService.create({
                        customerUUID: order.customer.uuid,
                        type: NotificationType.PAYMENT_SUCCESSFUL,
                        title: 'Payment Successful',
                        brief: 'Your order has been placed and payment confirmed.',
                        message: `Your order #${order.uuid} has been placed and payment of ${orderTotal} was received successfully. Your order is now being processed.`,
                        priority: NotificationPriority.HIGH,
                    }).catch(err => this.logger.warn(`Failed to send PAYMENT_SUCCESSFUL notification: ${err?.message}`));

                    if (order.customer.emailAddress) {
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

                        this.emailService.sendPaymentSuccessEmail(
                            order.customer.emailAddress,
                            {
                                customerName: order.customer.fullName,
                                orderId: getOrderReference(order.uuid),
                                orderTotal,
                                paymentConfirmation: `Payment of ${orderTotal} received successfully.`,
                                items,
                                deliveryDetails,
                                nextSteps: "We're now preparing your order for shipment. You'll receive another email with tracking details once it ships.",
                            },
                        ).catch(err => this.logger.error(`[Email] Failed to send payment-success email for order ${order.uuid}: ${err?.message}`));
                    }
                }

            } else if (
                newStatus === PaymentStatus.FAILED ||
                newStatus === PaymentStatus.REJECTED
            ) {
                this.logger.log(`Payment FAILED/REJECTED for transaction: ${transaction.transactionId}`);

                const alreadyHandled = order.status === OrderStatus.PAYMENT_FAILED
                    || order.status === OrderStatus.CANCELLED;

                if (!alreadyHandled) {
                    order.status = OrderStatus.PAYMENT_FAILED;
                    await this.orderRepository.save(order);

                    if (order.customer) {
                        notification = await this.notificationsService.create({
                            customerUUID: order.customer.uuid,
                            type: NotificationType.PAYMENT_FAILED,
                            title: 'Payment Failed',
                            brief: 'Your payment could not be processed.',
                            message: `Payment for order #${order.uuid} failed. You can retry payment from your order details.`,
                            priority: NotificationPriority.HIGH,
                        }).catch(err => this.logger.warn(`Failed to send PAYMENT_FAILED notification: ${err?.message}`));

                        if (order.customer.emailAddress) {
                            this.emailService.sendPaymentFailedEmail(
                                order.customer.emailAddress,
                                {
                                    customerName: order.customer.fullName,
                                    orderId: getOrderReference(order.uuid),
                                    failureReason: transaction.failureReason ?? 'Your payment could not be processed.',
                                },
                            ).catch(err => this.logger.error(`[Email] Failed to send payment-failed email for order ${order.uuid}: ${err?.message}`));
                        }
                    }
                } else {
                    this.logger.log(`Order ${order.uuid} already ${order.status} — payment failure acknowledged, no status change`);
                }
            } else if (newStatus === PaymentStatus.CANCELLED) {
                this.logger.log(`Payment CANCELLED for transaction: ${transaction.transactionId}`);

                const alreadyHandled = order.status === OrderStatus.PAYMENT_CANCELLED
                    || order.status === OrderStatus.CANCELLED;

                if (!alreadyHandled) {
                    order.status = OrderStatus.PAYMENT_CANCELLED;
                    await this.orderRepository.save(order);

                    if (order.customer) {
                        notification = await this.notificationsService.create({
                            customerUUID: order.customer.uuid,
                            type: NotificationType.PAYMENT_FAILED,
                            title: 'Payment Cancelled',
                            brief: 'Your payment was cancelled.',
                            message: `Payment for order #${order.uuid} was cancelled. You can return to checkout to try again.`,
                            priority: NotificationPriority.HIGH,
                        }).catch(err => this.logger.warn(`Failed to send payment-cancelled notification: ${err?.message}`));

                        if (order.customer.emailAddress) {
                            this.emailService.sendOrderCancelledEmail(
                                order.customer.emailAddress,
                                {
                                    customerName: order.customer.fullName,
                                    orderId: getOrderReference(order.uuid),
                                    reason: 'Your payment was cancelled. You can return to checkout to try again.',
                                },
                            ).catch(err => this.logger.error(`[Email] Failed to send payment-cancelled email for order ${order.uuid}: ${err?.message}`));
                        }
                    }
                } else {
                    this.logger.log(`Order ${order.uuid} already ${order.status} — payment cancellation acknowledged, no status change`);
                }
            }

            if (notification?.uuid) {
                this.logger.log(`Attempting to create push notification for payment status: ${JSON.stringify(order.uuid)}`);
                await this.pushNotificationService.sendToToken(notification?.uuid)
            }
            
            return transaction;
        } catch (error: any) {
            this.logger.error(`Error updating payment status: ${error?.response?.error || error}`);
            if (error instanceof HttpException) {
                throw error;
            } else {
                throw new InternalServerErrorException({
                    error: 'Error updating payment status',
                    details: error?.response?.error || error?.message || error,
                });
            }
        }
    }


    /**
     * Fetch all payments
     *
     * @returns
     */
    async findAll(): Promise<Array<PaymentTransaction>> {
        try {
            this.logger.log(`Attempting to fetch payments`);

            // fetch all payment transactions
            return this.paymentTransactionRepository.find({
                relations: {
                    order: true
                }
            })

        } catch (error: any) {
            this.logger.error(`Error creating payment: ${error?.response?.data || error.message}`);
            throw error;
        }
    }
}

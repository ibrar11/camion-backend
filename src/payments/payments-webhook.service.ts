import {
    Inject,
    Injectable,
    Logger,
    UnauthorizedException,
} from "@nestjs/common";

import { InjectRepository } from "@nestjs/typeorm";
import { In, Repository } from "typeorm";

import { verifySkipcashSignature } from "../common/skipcash";

import { OrderStatus } from "../order/enums/OrderStatus";
import { OrderTrackingEvent } from "../order/entities/order-tracking-event.entity";
import { OrderTrackingStage } from "../order/enums/OrderTrackingStage";

import { SkipcashWebhookDto } from "./dtos/SkipcashWebhookDto";

import { PaymentTransaction } from "./entities/payment-transaction.entity";
import { PaymentStatus } from "./enums/PaymentStatus";

import { Order } from "../order/entities/order.entity";

import { skipcashWebhookResponse } from "./types";

import { Notification } from "../notifications/entities/notification.entity";
import { NotificationsService } from "../notifications/notifications.service";
import { NotificationType } from "../notifications/enums/notification-type.enum";
import { NotificationPriority } from "../notifications/enums/notification-priority.enum";
import { PushNotificationService } from "../notifications/push-notification.service";

import { CartItem } from "../cart/entities/cart-items.entity";
import { EmailService } from "../email/email.service";
import { getOrderReference } from "../common/maskUuid";
import { InventoryItem } from "../inventory/entities/inventory-item.entity";
import { InventoryLevel } from "../inventory/entities/inventory-level.entity";
@Injectable()
export class PaymentsWebhookService {
    private readonly logger = new Logger(PaymentsWebhookService.name);

    constructor(
        @InjectRepository(PaymentTransaction) private readonly paymentRepository: Repository<PaymentTransaction>,
        @InjectRepository(Order) private readonly orderRepository: Repository<Order>,
        @InjectRepository(CartItem) private cartRepository: Repository<CartItem>,
        @InjectRepository(OrderTrackingEvent) private readonly trackingEventRepository: Repository<OrderTrackingEvent>,
        @Inject(PushNotificationService) private readonly pushNotificationService: PushNotificationService,
        private readonly notificationsService: NotificationsService,
        private readonly emailService: EmailService,
        @InjectRepository(InventoryItem) private readonly inventoryRepository: Repository<InventoryItem>,
        @InjectRepository(InventoryLevel) private readonly inventoryLevelRepository: Repository<InventoryLevel>,
    ) { }

    async handleSkipcashWebhook(payload: SkipcashWebhookDto, signature: string): Promise<skipcashWebhookResponse> {
        try {
            this.logger.log(
                `SkipCash Webhook received: ${JSON.stringify(payload)}`,
            );

            const isValid = verifySkipcashSignature(payload, signature);

            if (!isValid) {
                this.logger.warn("Invalid SkipCash webhook signature");
                throw new UnauthorizedException({
                    error: "Invalid signature"
                });
            }

            const {
                PaymentId,
                StatusId,
                TransactionId,
            } = payload;

            if (!TransactionId) {
                this.logger.warn("Missing TransactionId in webhook");
                return { received: true };
            }

            const order = await this.orderRepository.findOne({
                where: { uuid: TransactionId },
                relations: {
                    customer: true,
                    shippingAddress: true,
                    orderItems: {
                        product: true,
                        variant: true,
                        warehouse:true
                    }
                },
            })

            if (!order) {
                this.logger.warn(
                    `Order not found for orderUUId: ${TransactionId}`,
                );
                return { received: true };
            }

            const transaction = await this.paymentRepository.findOne({
                where: {
                    order: { id: order.id }
                },
                relations: {
                    order: true
                }
            });

            if (!transaction) {
                this.logger.warn(
                    `Transaction not found for orderId: ${TransactionId}`,
                );
                return { received: true };
            }

            const statusMap: Record<number, PaymentStatus> = {
                0: PaymentStatus.NEW,
                1: PaymentStatus.PENDING,
                2: PaymentStatus.PAID,
                3: PaymentStatus.CANCELLED,
                4: PaymentStatus.FAILED,
                5: PaymentStatus.REJECTED,
                6: PaymentStatus.REFUNDED,
                7: PaymentStatus.PENDING_REFUND,
                8: PaymentStatus.REFUND_FAILED,
            };

            const statusLabels: Record<number, string> = {
                0: 'New',
                1: 'Pending',
                2: 'Paid',
                3: 'Cancelled by customer',
                4: 'Payment declined by gateway',
                5: 'Payment rejected by gateway',
                6: 'Refunded',
                7: 'Refund pending',
                8: 'Refund failed',
            };

            const newStatus =
                statusMap[StatusId] || PaymentStatus.FAILED;

            if (transaction.status === PaymentStatus.PAID) {
                this.logger.log(
                    `Transaction already paid, skipping: ${TransactionId}`,
                );
                return { received: true };
            }

            transaction.status = newStatus;
            transaction.transactionId = PaymentId;
            transaction.webhookData = payload;
            transaction.lastAttemptAt = new Date();

            if (newStatus !== PaymentStatus.PAID) {
                transaction.errorCode = String(StatusId);
                transaction.failureReason = statusLabels[StatusId] ?? `Gateway status ${StatusId}`;
                transaction.paymentMethod = transaction.paymentMethod ?? transaction.provider;
            }

            await this.paymentRepository.save(transaction);

            this.logger.log(
                `Transaction ${transaction.id} updated to ${newStatus}`,
            );

            let notification: Notification | void = undefined;

            if (newStatus === PaymentStatus.PAID) {
                this.logger.log(`Payment SUCCESS for transaction: ${TransactionId}`);

                order.status = OrderStatus.PAYMENT_SUCCESSFUL;
                await this.orderRepository.save(order);

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
                        customerUUID: getOrderReference(order.customer.uuid),
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
                this.logger.log(`Payment FAILED/REJECTED for transaction: ${TransactionId}`);

                for (const item of order.orderItems) {
                        const inventoryItem = await this.inventoryRepository.findOne({
                            where: { variant: { id: item.variant.id } },
                        });
                        if (!inventoryItem) continue;
                        const level = await this.inventoryLevelRepository.findOne({
                            where: {
                                inventoryItem: { id: inventoryItem.id },
                                warehouse: { id: item.warehouse.id },
                            },
                        });
                        if (level) {
                            level.quantity += item.quantity;
                            await this.inventoryLevelRepository.save(level);
                        }
                    }

                const alreadyHandled = order.status === OrderStatus.PAYMENT_FAILED
                    || order.status === OrderStatus.CANCELLED;

                if (!alreadyHandled) {
                    order.status = OrderStatus.PAYMENT_FAILED;
                    await this.orderRepository.save(order);

                    if (order.customer) {
                        notification = await this.notificationsService.create({
                            customerUUID: getOrderReference(order.customer.uuid),
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
                this.logger.log(`Payment CANCELLED for transaction: ${TransactionId}`);

                const alreadyHandled = order.status === OrderStatus.PAYMENT_CANCELLED
                    || order.status === OrderStatus.CANCELLED;

                if (!alreadyHandled) {
                    order.status = OrderStatus.PAYMENT_CANCELLED;
                    await this.orderRepository.save(order);

                    if (order.customer) {
                        notification = await this.notificationsService.create({
                            customerUUID: getOrderReference(order.customer.uuid),
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
                this.logger.log(`Attempting to create push notification for payment status: ${JSON.stringify(transaction.order.uuid)}`);
                await this.pushNotificationService.sendToToken(notification?.uuid)
            }

            return {
                received: true,
                status: "processed",
                transactionId: TransactionId,
            };
        } catch (error: any) {
            this.logger.error(
                `Error processing SkipCash webhook: ${error.message || error}`,
            );

            return {
                received: true,
                status: "error_handled",
            };
        }
    }
}

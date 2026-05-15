import {
    Inject,
    Injectable,
    Logger,
    UnauthorizedException,
} from "@nestjs/common";

import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";

import { verifySkipcashSignature } from "../common/skipcash";

import { OrderStatus } from "../order/enums/OrderStatus";

import { SkipcashWebhookDto } from "./dtos/SkipcashWebhookDto";

import { PaymentTransaction } from "./entities/payment-transaction.entity";
import { PaymentStatus } from "./enums/PaymentStatus";

import { Order } from "../order/entities/order.entity";

import { skipcashWebhookResponse } from "./types";

import { Notification } from "../notifications/entities/notification.entity";
import { NotificationsService } from "../notifications/notifications.service";
import { NotificationType } from "../notifications/enums/notification-type.enum";
import { NotificationPriority } from "../notifications/enums/notification-priority.enum";
import { PushNotificationService } from "../common/push-notification.service";

@Injectable()
export class PaymentsWebhookService {
    private readonly logger = new Logger(PaymentsWebhookService.name);

    constructor(
        @InjectRepository(PaymentTransaction) private readonly paymentRepository: Repository<PaymentTransaction>,
        @InjectRepository(Order) private readonly orderRepository: Repository<Order>,
        @Inject(PushNotificationService) private readonly pushNotificationService: PushNotificationService,
        private readonly notificationsService: NotificationsService,
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
                relations: { customer: true },
            })

            if (!order) {
                this.logger.warn(
                    `Order not found for orderUUId: ${TransactionId}`,
                );
                return { received: true };
            }

            const transaction = await this.paymentRepository.findOne({
                where: {
                    order: {id: order.id}
                },
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

            await this.paymentRepository.save(transaction);

            this.logger.log(
                `Transaction ${transaction.id} updated to ${newStatus}`,
            );

            let notification: Notification | void = undefined; 

            if (newStatus === PaymentStatus.PAID) {
                this.logger.log(
                    `Payment SUCCESS for transaction: ${TransactionId}`,
                );

                order.status = OrderStatus.PAYMENT_SUCCESSFUL;
                await this.orderRepository.save(order);

                if (order.customer) {
                    notification = await this.notificationsService.create({
                        customerUUID: order.customer.uuid,
                        type: NotificationType.PAYMENT_SUCCESSFUL,
                        title: 'Payment Successful',
                        brief: 'Your payment was processed successfully.',
                        message: `Payment for order #${order.uuid} was successful. Your order is now being processed.`,
                        priority: NotificationPriority.HIGH,
                    }).catch(err => this.logger.warn(`Failed to send PAYMENT_SUCCESSFUL notification: ${err?.message}`));
                }

            } else if (
                newStatus === PaymentStatus.FAILED ||
                newStatus === PaymentStatus.CANCELLED
            ) {
                this.logger.log(
                    `Payment FAILED/CANCELLED for transaction: ${TransactionId}`,
                );

                order.status = OrderStatus.PAYMENT_REJECTED;
                await this.orderRepository.save(order);

                if (order.customer) {
                    notification = await this.notificationsService.create({
                        customerUUID: order.customer.uuid,
                        type: NotificationType.PAYMENT_FAILED,
                        title: 'Payment Failed',
                        brief: 'Your payment could not be processed.',
                        message: `Payment for order #${order.uuid} failed. Please try again or use a different payment method.`,
                        priority: NotificationPriority.HIGH,
                    }).catch(err => this.logger.warn(`Failed to send PAYMENT_FAILED notification: ${err?.message}`));
                }
            }

            if(notification?.uuid) {
                this.logger.log(`Attempting to create psuh notification for payment status: ${JSON.stringify(transaction.order.uuid)}`);
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

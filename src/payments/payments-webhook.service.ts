import {
    Injectable,
    Logger,
    UnauthorizedException,
} from "@nestjs/common";

import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";

import { verifySkipcashSignature } from "src/common/skipcash";

import { SkipcashWebhookDto } from "./dtos/SkipcashWebhookDto";

import { PaymentTransaction } from "./entities/payment-transaction.entity";
import { PaymentStatus } from "./enums/PaymentStatus";

@Injectable()
export class PaymentsWebhookService {
    private readonly logger = new Logger(PaymentsWebhookService.name);

    constructor(
        @InjectRepository(PaymentTransaction)
        private paymentRepo: Repository<PaymentTransaction>,
    ) { }

    async handleSkipcashWebhook(payload: SkipcashWebhookDto, signature: string) {
        try {
            this.logger.log(
                `SkipCash Webhook received: ${JSON.stringify(payload)}`,
            );

            const isValid = verifySkipcashSignature(payload, signature);

            if (!isValid) {
                this.logger.warn("Invalid SkipCash webhook signature");
                throw new UnauthorizedException("Invalid signature");
            }

            const {
                PaymentId,
                Amount,
                StatusId,
                TransactionId,
                VisaId,
            } = payload;

            if (!TransactionId) {
                this.logger.warn("Missing TransactionId in webhook");
                return { received: true };
            }

            const transaction = await this.paymentRepo.findOne({
                where: { orderId: TransactionId },
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

            await this.paymentRepo.save(transaction);

            this.logger.log(
                `Transaction ${transaction.id} updated to ${newStatus}`,
            );

            if (newStatus === PaymentStatus.PAID) {
                this.logger.log(
                    `Payment SUCCESS for transaction: ${TransactionId}`,
                );

                // Need to implement order updation accordingly once order apis implemented
            } else if (
                newStatus === PaymentStatus.FAILED ||
                newStatus === PaymentStatus.CANCELLED
            ) {
                this.logger.log(
                    `Payment FAILED/CANCELLED for transaction: ${TransactionId}`,
                );

                // Need to implement order updation accordingly once order apis implemented
            }

            return {
                received: true,
                status: "processed",
                transactionId: TransactionId,
            };
        } catch (error: any) {
            this.logger.error(
                `Error processing SkipCash webhook: ${error.message}`,
            );

            return {
                received: true,
                status: "error_handled",
            };
        }
    }
}
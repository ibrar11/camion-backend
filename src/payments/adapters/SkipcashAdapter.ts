import crypto from "node:crypto";

import {
    Injectable,
    InternalServerErrorException,
    Logger,
} from "@nestjs/common";

import { generateSignature } from "../../common/skipcash";

import { CreatePaymentDto } from "../dtos/CreatePaymentDto";

import {
    InitiatePaymentResponse,
    SignaturePayload
} from "../types";

@Injectable()
export class SkipCashAdapter {
    private readonly logger = new Logger(SkipCashAdapter.name);

    // note: create payment method needs to be updated after order implementation

    /**
     * Creates new payment
     *
     * @param dto
     * @returns
     */
    async createPayment(dto: CreatePaymentDto): Promise<InitiatePaymentResponse> {
        try {
            this.logger.log(`Attempting to create skipcash payment for order ${dto.orderUUID} customer: ${dto.firstName} ${dto.lastName}`);

            const orderId = dto.orderUUID || '';

            // note: payment logic needs to be reviewed once payment integration starts

            const payload: SignaturePayload = {
                Uid: crypto.randomUUID(),
                KeyId: process.env.SKIPCASH_KEY_ID,
                Amount: dto.amount.toFixed(2),
                FirstName: dto.firstName,
                LastName: dto.lastName,
                Phone: dto.phoneNumber,
                Email: dto.emailAddress,
                Street: dto.street,
                City: dto.city,
                State: dto.state,
                Country: dto.country,
                PostalCode: dto.postalCode,
                TransactionId: orderId,
                Custom1: "",
            };

            const signature = generateSignature(payload);

            // create skipcash payment
            const res = await fetch(`https://skipcashtest.azurewebsites.net/api/v1/payments`, {
                method: "POST",
                headers: {
                    Authorization: signature,
                    "Content-Type": "application/json",
                },
                body: JSON.stringify(payload),
            });
            const data = await res.json();

            if (!res.ok || data.hasError) {
                let message = "Payment creation failed";

                if (data?.error?.message) {
                    message = `SkipCash error: ${data.error.message}`;
                } else if (data?.errorMessage) {
                    message = `SkipCash error: ${data.errorMessage}`;
                } else if (res.status === 403) {
                    message = "Forbidden: Signature does not match or invalid credentials";
                }

                throw new InternalServerErrorException({
                    error: message,
                });
            }
            this.logger.log(`Completed create skipcash payment for order ${dto.orderUUID} customer: ${dto.firstName} ${dto.lastName}`);

            return {
                provider: "skipcash",
                transactionId: data.resultObj.transactionId,
                paymentUrl: data.resultObj.payUrl,
                raw: data,
            };
        } catch (error: any) {
            this.logger.error(`SkipCash payment failed: ${JSON.stringify(error?.response?.data || error.message)}`);
            throw new InternalServerErrorException({
                error: "SkipCash payment failed",
                details: error?.response?.data || error?.message || error,
            });
        }
    }
}

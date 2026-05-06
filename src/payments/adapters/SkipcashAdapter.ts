import crypto from "node:crypto";

import {
    Injectable,
    InternalServerErrorException,
    Logger,
} from "@nestjs/common";

import { ConfigService } from "@nestjs/config";

import { generateSignature } from "../../common/skipcash";

import { CreatePaymentDto } from "../dtos/CreatePaymentDto";

import {
    InitiatePaymentResponse,
    SignaturePayload
} from "../types";

@Injectable()
export class SkipCashAdapter {
    private readonly logger = new Logger(SkipCashAdapter.name);

    constructor(private readonly configService: ConfigService) { }

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
                KeyId: this.configService.get<string>("SKIPCASH_KEY_ID"),
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

            this.logger.log(`Attempting to hit skipcash payment api ${dto.orderUUID} customer: ${dto.firstName} ${dto.lastName}`);
            // create skipcash payment
            const res = await fetch(`${this.configService.get<string>("SKIPCASH_BASE_URL")}/api/v1/payments`, {
                method: "POST",
                headers: {
                    Authorization: signature,
                    "Content-Type": "application/json",
                },
                body: JSON.stringify(payload),
            });
            const data = await res.json();
            this.logger.log(`After hitting skipcash api ${data}`);

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
            console.log("SkipCash payment failed:", error)
            this.logger.error(`SkipCash payment failed: ${error}`);
            throw new InternalServerErrorException({
                error: "SkipCash payment failed",
                details: error?.response?.data || error?.message || error,
            });
        }
    }
}

import crypto from "node:crypto";

import { 
    Injectable,
    Logger,
    NotFoundException,
} from "@nestjs/common";

import { generateSignature } from "src/common/skipcash";

import { CreatePaymentDto } from "../dtos/CreatePaymentDto";

import { InitiatePaymentResponse } from "../types";

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
        try{

            // note: reference id should be replaced with order id
            const referenceId = dto.referenceId || '';
            console.log("referenceIdreferenceIdreferenceId",referenceId)


            // note: payment logic needs to be reviewed once payment integration starts

            const payload = {
                Uid: crypto.randomUUID(),
                KeyId: process.env.SKIPCASH_KEY_ID,
                Amount: dto.amount.toFixed(2),
                FirstName: dto.firstName,
                LastName: dto.lastName,
                Phone: dto.phone,
                Email: dto.email,
                Street: dto.street,
                City: dto.city,
                State: dto.state,
                Country: dto.country,
                PostalCode: dto.postalCode,
                TransactionId: referenceId,
                Custom1: "",
            };

            const signature = generateSignature(payload);

            // create skipcash payment
            const res = await fetch(`${process.env.SKIPCASH_BASE_URL}/api/v1/payments`, {
                method: "POST",
                headers: {
                    Authorization: signature,
                    "Content-Type": "application/json",
                },
                body: JSON.stringify(payload),
            });

            if (!res.ok) {
                throw new Error(`Request failed with status ${res.status}`);
            }

            const data = await res.json();

            return {
                provider: "skipcash",
                transactionId: data.resultObj.transactionId,
                paymentUrl: data.resultObj.payUrl,
                referenceId,
                raw: data,
            };
        } catch (error: any) {
            this.logger.error(`SkipCash payment failed: ${error.message}`);

            let customMessage = 'Please check your information and try again';

            if (error.response?.status === 400) {
                if (error.response?.data?.errorMessage?.includes('Signature')) {
                customMessage = 'Payment verification failed. Please review your details and try again';
                } else {
                customMessage = 'Invalid payment details. Please check your information and try again';
                }
            } else if (error.response?.status === 401) {
                customMessage = 'Payment authentication failed. Please try again';
            } else if (error.response?.status === 422) {
                customMessage = 'Payment information is incomplete. Please fill all required fields';
            } else if (error.response?.status === 500) {
                customMessage = 'Payment service temporarily unavailable. Please try again in a few minutes';
            }

            throw new NotFoundException(customMessage);
        }
    }
}
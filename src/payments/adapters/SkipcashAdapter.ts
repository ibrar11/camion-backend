import * as crypto from "crypto";

import { 
    Injectable,
    Logger,
    NotFoundException,
} from "@nestjs/common";

import { v4 as uuidv4 } from "uuid";
import axios from "axios";

import { CreatePaymentDto } from "../dtos/CreatePaymentDto";

@Injectable()
export class SkipCashAdapter {
    private readonly logger = new Logger(SkipCashAdapter.name);
    private baseUrl = process.env.SKIPCASH_BASE_URL;

    // create payment method needs to be updated after order implementation

    async createPayment(data: CreatePaymentDto) {
        try{

            // reference id should be replaced with order id
            const referenceId = data.referenceId || `temp_${uuidv4()}`;


            // payment logic needs to be reviewed once payment integration starts

            const payload = {
                Uid: uuidv4(),
                KeyId: process.env.SKIPCASH_KEY_ID,
                Amount: data.amount.toFixed(2),
                FirstName: data.firstName,
                LastName: data.lastName,
                Phone: data.phone,
                Email: data.email,
                Street: data.street,
                City: data.city,
                State: data.state,
                Country: data.country,
                PostalCode: data.postalCode,
                TransactionId: referenceId,
                Custom1: "",
            };

            const signature = this.generateSignature(payload);

            const res = await axios.post(
                `${this.baseUrl}/api/v1/payments`,
                payload,
                {
                    headers: {
                    Authorization: signature,
                    "Content-Type": "application/json",
                    },
                }
            );

            return {
                provider: "skipcash",
                transactionId: res.data.resultObj.transactionId,
                paymentUrl: res.data.resultObj.payUrl,
                referenceId,
                raw: res.data,
            };
        } catch (error) {
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

    private generateSignature(payload: any): string {
        const orderedFields = [
            'Uid','KeyId','Amount','FirstName','LastName',
            'Phone','Email','Street','City','State',
            'Country','PostalCode','TransactionId','Custom1'
        ];

        const baseString = orderedFields
            .filter(key => payload[key])
            .map(key => `${key}=${String(payload[key]).trim()}`)
            .join(",");

        return crypto
            .createHmac("sha256", process.env.SKIPCASH_KEY_SECRET || "")
            .update(baseString)
            .digest("base64");
    }
}
import { Injectable } from "@nestjs/common";

import { CreatePaymentDto } from "../dtos/CreatePaymentDto";

import { SkipCashAdapter } from "../adapters/SkipcashAdapter";

import { 
    InitiatePaymentResponse, 
    PaymentStrategy 
} from "../types";

@Injectable()
export class SkipCashStrategy implements PaymentStrategy {
    constructor(private adapter: SkipCashAdapter) {}

    /**
	 * Creates new payment for skipcash
	 *
	 * @param data
	 * @returns
	 */
    async InitiatePayment(data: CreatePaymentDto): Promise<InitiatePaymentResponse> {
        return this.adapter.createPayment(data);
    }
}
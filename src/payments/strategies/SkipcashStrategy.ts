import { Injectable } from "@nestjs/common";

import { CreatePaymentDto } from "../dtos/CreatePaymentDto";

import { PaymentStrategy } from "../interfaces/PaymentStrategy";

import { SkipCashAdapter } from "../adapters/SkipcashAdapter";

@Injectable()
export class SkipCashStrategy implements PaymentStrategy {
    constructor(private adapter: SkipCashAdapter) {}

    async InitiatePayment(data: CreatePaymentDto) {
        return this.adapter.createPayment(data);
    }
}
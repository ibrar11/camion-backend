import { Injectable } from "@nestjs/common";

import { CreatePaymentDto } from "./dtos/CreatePaymentDto";

import { PaymentStrategyFactory } from "./factories/PaymentStrategyFactory";

@Injectable()
export class PaymentsService {
    constructor(private strategyfactory: PaymentStrategyFactory) {}
    
    async createPayment(dto: CreatePaymentDto) {
        const strategy = this.strategyfactory.getStrategy(dto.provider);

        const result = await strategy.InitiatePayment(dto);

        return {
            message: "Payment initiated",
            ...result,
        };
    }
}
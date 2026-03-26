import { CreatePaymentDto } from "../dtos/CreatePaymentDto";

export interface PaymentStrategy {
    InitiatePayment(data: CreatePaymentDto): Promise<any>;
}
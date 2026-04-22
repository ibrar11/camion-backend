import {
    Injectable,
    Logger
} from "@nestjs/common";

import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";

import { CreatePaymentDto } from "./dtos/CreatePaymentDto";

import { PaymentTransaction } from "./entities/payment-transaction.entity";

import { PaymentStrategyFactory } from "./factories/PaymentStrategyFactory";

import { PaymentStatus } from "./enums/PaymentStatus";

@Injectable()
export class PaymentsService {
    private readonly logger = new Logger(PaymentsService.name);
    
    constructor(
        @InjectRepository(PaymentTransaction) private paymentTransactionRepository: Repository<PaymentTransaction>,
        private strategyfactory: PaymentStrategyFactory,
    ) {}
    
    /**
     * Creates new payment
     *
     * @param dto
     * @returns
     */
    async createPayment(dto: CreatePaymentDto): Promise<PaymentTransaction> {
        try {
            this.logger.log(`Attempting to create payment for order ${dto.orderUUID} customer: ${dto.firstName} ${dto.lastName}`);

            // Create payment transaction
            const transaction = this.paymentTransactionRepository.create({
                provider: dto.provider,
                amount: dto.amount,
                currency: dto.currency,
                status: PaymentStatus.PENDING
            })
            await this.paymentTransactionRepository.save(transaction);
            
            // fetch the strategy for specified provider
            const strategy = this.strategyfactory.getStrategy(dto.provider);
            
            // intialize the payment creation for specifed provider
            const result = await strategy.InitiatePayment(dto);

            transaction.transactionId = result.transactionId;
            transaction.rawResponse = result.raw;

            this.logger.log(`Completed create payment for order ${dto.orderUUID} customer: ${dto.firstName} ${dto.lastName}`);
            return await this.paymentTransactionRepository.save(transaction);

        } catch (error: any) {
            this.logger.error(`Error creating payment: ${error?.response?.data || error.message}`);
            throw error;
        }
    }
}
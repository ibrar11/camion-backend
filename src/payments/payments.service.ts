import { 
    Injectable, 
    InternalServerErrorException, 
    Logger
} from "@nestjs/common";

import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";

import { CreatePaymentDto } from "./dtos/CreatePaymentDto";

import { PaymentTransaction } from "./entities/payment-transaction.entity";

import { PaymentStrategyFactory } from "./factories/PaymentStrategyFactory";

import { PaymentStatus } from "./enums/PaymentStatus";

import { InitiatePaymentResponse } from "./types";

@Injectable()
export class PaymentsService {
    private readonly logger = new Logger(PaymentsService.name);
    
    constructor(
        @InjectRepository(PaymentTransaction) private paymentRepo: Repository<PaymentTransaction>,
        private strategyfactory: PaymentStrategyFactory,
    ) {}
    
    /**
	 * Creates new payment
	 *
	 * @param dto
	 * @returns
	 */
    async createPayment(dto: CreatePaymentDto): Promise<InitiatePaymentResponse> {
        try {
            // Create payment transaction
            const transaction = this.paymentRepo.create({
                provider: dto.provider,
                orderId: dto.orderId,
                amount: dto.amount,
                currency: dto.currency,
                status: PaymentStatus.PENDING
            })
            await this.paymentRepo.save(transaction);
            
            // fetch the strategy for specified provider
            const strategy = this.strategyfactory.getStrategy(dto.provider);
            
            // intialize the payment creation for specifed provider
            const result = await strategy.InitiatePayment(dto);

            transaction.transactionId = result.transactionId;
            transaction.rawResponse = result.raw;

            await this.paymentRepo.save(transaction);

            return result;
        } catch (error: any) {
            this.logger.error(`Error creating payment: ${error?.message}`);
            throw new InternalServerErrorException({
                error: 'Failed to create payment',
                details: error.response?.data || error.message,
            });
        }
    }
}
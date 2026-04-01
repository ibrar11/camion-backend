import { 
    Injectable, 
    InternalServerErrorException, 
    Logger
} from "@nestjs/common";

import { CreatePaymentDto } from "./dtos/CreatePaymentDto";

import { PaymentStrategyFactory } from "./factories/PaymentStrategyFactory";

import { CreatePaymentResponse } from "./types";

@Injectable()
export class PaymentsService {
    private readonly logger = new Logger(PaymentsService.name);
    
    constructor(private strategyfactory: PaymentStrategyFactory) {}
    
    /**
	 * Creates new payment
	 *
	 * @param dto
	 * @returns
	 */
    async createPayment(dto: CreatePaymentDto): Promise<CreatePaymentResponse> {
        try {
            // fetch the strategy for specified provider
            const strategy = this.strategyfactory.getStrategy(dto.provider);
            
            // intialize the payment creation for specifed provider
            const result = await strategy.InitiatePayment(dto);

            return {
                success: true,
                message: "Payment initiated",
                data: result,
            };
        } catch (error: any) {
            this.logger.error(`Error creating payment: ${error?.message}`);
            throw new InternalServerErrorException({
                error: 'Failed to create payment',
                details: error.response?.data || error.message,
            });
        }
    }
}
import {
    Inject,
    Injectable,
    Logger,
    NotFoundException
} from "@nestjs/common";

import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";

import { CreatePaymentDto } from "./dtos/CreatePaymentDto";

import { PaymentTransaction } from "./entities/payment-transaction.entity";

import { PaymentStrategyFactory } from "./factories/PaymentStrategyFactory";

import { PaymentStatus } from "./enums/PaymentStatus";

import { ExchangeRateService } from "../pricing/exchange-rate.service";

import { PaymentProvider } from "./enums/PaymentProvider";

import { getExchangedPrice } from "../common/currency";

@Injectable()
export class PaymentsService {
    private readonly logger = new Logger(PaymentsService.name);

    constructor(
        @InjectRepository(PaymentTransaction) private paymentTransactionRepository: Repository<PaymentTransaction>,
        @Inject(ExchangeRateService) private readonly exchangeRateService: ExchangeRateService,
        private strategyfactory: PaymentStrategyFactory,
    ) { }

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

            if (dto.amount.amount > 0 || dto.amount.minorAmount > 0) {
                const exchangeRates = await this.exchangeRateService.findAllFull();
                if (dto?.provider === PaymentProvider.SKIPCASH) {
                    if (dto.currency.toLowerCase().trim() !== "qar") {

                        const exchangeRate = exchangeRates
                            .filter(exchangeRate => exchangeRate.srcCurrencyCode.toLowerCase().trim() === dto.currency.toLowerCase().trim() && exchangeRate.targetCurrencyCode.toLowerCase().trim() === 'qar')
                            .at(0) ?? null;

                        if (!exchangeRate) {
                            throw new NotFoundException({
                                error: `Exchange Rate for ${dto.currency} to qar not found`
                            });
                        }

                        // convert the total in QAR for skipcash.
                        dto.amount = getExchangedPrice(dto.amount, dto.currency, exchangeRate.factor);
                    }
                }

                // fetch the strategy for specified provider
                const strategy = this.strategyfactory.getStrategy(dto.provider);

                // intialize the payment creation for specifed provider
                const result = await strategy.InitiatePayment(dto);

                transaction.transactionId = result.transactionId;
                transaction.rawResponse = result.raw;
            }

            this.logger.log(`Completed create payment for order ${dto.orderUUID} customer: ${dto.firstName} ${dto.lastName}`);
            return await this.paymentTransactionRepository.save(transaction);

        } catch (error: any) {
            this.logger.error(`Error creating payment: ${error?.response?.data || error.message}`);
            throw error;
        }
    }

    /**
     * Fetch all payments
     *
     * @returns
     */
    async findAll(): Promise<Array<PaymentTransaction>> {
        try {
            this.logger.log(`Attempting to fetch payments`);

            // fetch all payment transactions
            return this.paymentTransactionRepository.find({
                relations: {
                    order: true
                }
            })

        } catch (error: any) {
            this.logger.error(`Error creating payment: ${error?.response?.data || error.message}`);
            throw error;
        }
    }
}

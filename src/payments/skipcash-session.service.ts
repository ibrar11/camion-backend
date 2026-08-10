import {
    BadRequestException,
    Injectable,
    Logger,
    NotFoundException,
} from '@nestjs/common';

import { ConfigService } from '@nestjs/config';

import { InjectRepository } from '@nestjs/typeorm';

import { Repository } from 'typeorm';

import { CreateSkipCashSessionDto } from './dtos/CreateSkipCashSessionDto';

import { Order } from '../order/entities/order.entity';

import { Customer } from '../customers/entities/customer.entity';

import { SavedCardsService } from './saved-cards.service';

import { SkipCashSessionResponse } from './types';


@Injectable()
export class SkipCashSessionService {
    private readonly logger = new Logger(SkipCashSessionService.name);
    private readonly apiBaseUrl: string;
    private readonly apiKey: string;
    private readonly webhookUrl: string;

    constructor(
        private readonly configService: ConfigService,
        private readonly savedCardsService: SavedCardsService,
        @InjectRepository(Order)
        private readonly orderRepository: Repository<Order>,
        @InjectRepository(Customer)
        private readonly customerRepository: Repository<Customer>,
    ) {
        // Determine environment
        const env = this.configService.get<string>('SKIPCASH_ENV', 'sandbox');
        this.apiBaseUrl =
            env === 'production'
                ? 'https://api.skipcash.app'
                : 'https://sdk.skipcash.com';
        this.apiKey = this.configService.get<string>('SKIPCASH_API_KEY') || '';
        this.webhookUrl = this.configService.get<string>(
            'SKIPCASH_WEBHOOK_URL',
            `${this.configService.get('APP_URL')}/v1/payments/skipcash/webhook`,
        );
    }

    /**
     * Create a payment session with SkipCash
     */
    async createSession(
        customerUuid: string,
        dto: CreateSkipCashSessionDto,
    ): Promise<SkipCashSessionResponse> {
        this.logger.log(`Creating SkipCash session for order ${dto.orderUuid}`);

        // 1. Find the customer
        const customer = await this.customerRepository.findOne({
            where: { uuid: customerUuid },
        });

        if (!customer) {
            throw new NotFoundException({ error: 'Customer not found' });
        }

        // 2. Find the order
        const order = await this.orderRepository.findOne({
            where: { uuid: dto.orderUuid },
            relations: { customer: true },
        });

        if (!order) {
            throw new NotFoundException({ error: 'Order not found' });
        }

        // 3. Verify order belongs to customer
        if (order.customer.uuid !== customerUuid) {
            throw new BadRequestException({
                error: 'Order does not belong to this customer',
            });
        }

        // 4. Build the request payload
        const payload: any = {
            amount: dto.amount,
            currency: dto.currency.toUpperCase(),
            orderId: dto.orderUuid,
            paymentMethod: dto.paymentMethod || 'credit_card',
            platform: 'mobile', // or 'web' - can be passed in
            webhookUrl: this.webhookUrl,
            customer: {
                firstName: dto.firstName || customer.fullName.split(' ')[0] || 'Customer',
                lastName: dto.lastName || customer.fullName.split(' ').slice(1).join(' ') || 'Unknown',
                email: dto.email || customer.emailAddress,
                phone: dto.phone || customer.phoneNumber || '+97400000000',
            },
        };

        // 5. If tokenizing card
        if (dto.tokenizeCard) {
            payload.tokenizeCard = true;
        }

        // 6. If using a saved card token
        if (dto.savedCardTokenId) {
            // Verify the saved card belongs to this customer
            await this.savedCardsService.getSavedCard(customerUuid, dto.savedCardTokenId);
            payload.savedCardTokenId = dto.savedCardTokenId;
        }

        // 7. Call SkipCash API
        try {
            const response = await fetch(`${this.apiBaseUrl}/api/v1/sessions`, {
                method: 'POST',
                headers: {
                    Authorization: `Bearer ${this.apiKey}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(payload),
            });

            const data = await response.json();

            if (!response.ok) {
                this.logger.error(`SkipCash session creation failed: ${JSON.stringify(data)}`);
                throw new BadRequestException({
                    error: data.error || 'Failed to create payment session',
                    details: data.details || data,
                });
            }

            this.logger.log(`SkipCash session created: ${data.sessionId}`);

            // 8. Store session reference on order (optional - for tracking)
            // You could add a paymentSessionId column to Order entity
            // await this.orderRepository.update(order.id, { paymentSessionId: data.sessionId });

            return {
                sessionId: data.sessionId,
                checkoutUrl: data.checkoutUrl,
                expiresAt: data.expiresAt,
                paymentId: data.paymentId,
            };
        } catch (error: any) {
            this.logger.error(`SkipCash session error: ${error.message}`);
            throw new BadRequestException({
                error: 'Failed to initialize payment',
                details: error.message,
            });
        }
    }

    /**
     * Get session status from SkipCash
     */
    async getSessionStatus(sessionId: string): Promise<any> {
        try {
            const response = await fetch(`${this.apiBaseUrl}/api/v1/sessions/${sessionId}`, {
                method: 'GET',
                headers: {
                    Authorization: `Bearer ${this.apiKey}`,
                    'Content-Type': 'application/json',
                },
            });

            const data = await response.json();

            if (!response.ok) {
                throw new BadRequestException({
                    error: data.error || 'Failed to get session status',
                });
            }

            return data;
        } catch (error: any) {
            this.logger.error(`Get session status error: ${error.message}`);
            throw new BadRequestException({
                error: 'Failed to get payment status',
                details: error.message,
            });
        }
    }
}
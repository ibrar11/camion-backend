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

import { moneyToString } from '../common/currency';


@Injectable()
export class SkipCashSessionService {
    private readonly logger = new Logger(SkipCashSessionService.name);
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
        this.apiKey = this.configService.get<string>('SKIPCASH_API_KEY') || '';
        this.webhookUrl = `${this.configService.get('APP_URL')}/v1/payments/skipcash/webhook`;
    }

    /**
     * Create a payment session with SkipCash
     */
    async createSession(
        customerUuid: string,
        dto: CreateSkipCashSessionDto,
    ): Promise<SkipCashSessionResponse> {
        this.logger.log(`Creating SkipCash session for order ${dto.order.uuid}`);

        // 1. Find the customer
        const customer = await this.customerRepository.findOne({
            where: { uuid: customerUuid },
        });

        if (!customer) {
            throw new NotFoundException({ error: 'Customer not found' });
        }

        // 2. Find the order
        const order = await this.orderRepository.findOne({
            where: { uuid: dto.order.uuid },
            relations: { customer: true },
        }) || dto.order;

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
            amount: moneyToString(dto.amount),
            currency: dto.currency.toUpperCase(),
            orderId: order.uuid,
            paymentMethod: dto.paymentMethod || 'credit_card',
            platform: dto.platform, // or 'web' - can be passed in
            webhookUrl: this.webhookUrl,
            customer: {
                firstName: dto.firstName || customer.fullName.split(' ')[0] || 'Customer',
                lastName: dto.lastName || customer.fullName.split(' ').slice(1).join(' ') || 'Unknown',
                email: dto.emailAddress || customer.emailAddress,
                phone: dto.phoneNumber || customer.phoneNumber || '+97400000000',
                Custom1: "",
            },
        };

        // 5. If tokenizing card
        if (dto.tokenizeCard) {
            payload.tokenizeCard = true;
        }

        // 7. Call SkipCash API
        try {
            const response = await fetch(`https://sdk.skipcash.com/api/v1/sessions`, {
                method: 'POST',
                headers: {
                    Authorization: `Bearer ${this.apiKey}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(payload),
            });            

            const responseText = await response.text();

            this.logger.log(`SkipCash status: ${response.status}`);
            this.logger.log(`SkipCash response: ${responseText}`);

            let data: any = null;

            try {
                data = responseText ? JSON.parse(responseText) : null;
            } catch (error) {
                this.logger.error(`Invalid JSON from SkipCash: ${responseText}`);
                throw new BadRequestException({
                    error: 'Invalid response from SkipCash',
                    statusCode: response.status,
                    details: responseText,
                });
            }

            if (!response.ok) {                
                this.logger.error(
                    `SkipCash session creation failed: ${JSON.stringify(data)}`,
                );

                throw new BadRequestException({
                    error: data?.error || 'Failed to create payment session',
                    details: data?.details || data,
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
            const response = await fetch(`https://sdk.skipcash.com/api/v1/sessions/${sessionId}`, {
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
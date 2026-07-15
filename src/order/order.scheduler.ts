import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { InjectRepository } from '@nestjs/typeorm';
import { In, LessThan, Repository } from 'typeorm';

import { Order } from './entities/order.entity';
import { OrderStatus } from './enums/OrderStatus';
import { OrderService } from './order.service';

@Injectable()
export class OrderScheduler {
    private readonly logger = new Logger(OrderScheduler.name);

    private readonly PAYMENT_EXPIRY_MINUTES = parseInt(process.env.PAYMENT_EXPIRY_MINUTES ?? '30', 10);

    constructor(
        @InjectRepository(Order) private readonly orderRepository: Repository<Order>,
        private readonly orderService: OrderService,
    ) { }

    /**
     * Sweeps orders stuck in PAYMENT_PENDING/PAYMENT_FAILED/PAYMENT_CANCELLED
     * for longer than PAYMENT_EXPIRY_MINUTES and force-expires them, releasing
     * the stock and coupon usage held since order creation.
     */
    @Cron('0 */15 * * * *')
    async expireStalePaymentOrders() {
        const cutoff = new Date(Date.now() - this.PAYMENT_EXPIRY_MINUTES * 60 * 1000);

        const stale = await this.orderRepository.find({
            where: {
                status: In([
                    OrderStatus.PAYMENT_PENDING,
                    OrderStatus.PAYMENT_FAILED,
                    OrderStatus.PAYMENT_CANCELLED,
                ]),
                updatedAt: LessThan(cutoff),
            },
        });

        if (!stale.length) return;

        this.logger.log(`Expiring ${stale.length} stale payment order(s) older than ${this.PAYMENT_EXPIRY_MINUTES}m`);

        for (const order of stale) {
            try {
                await this.orderService.expireStalePayment(order.uuid);
            } catch (err: any) {
                this.logger.error(`Failed to expire payment for order ${order.uuid}: ${err?.message}`);
            }
        }
    }
}

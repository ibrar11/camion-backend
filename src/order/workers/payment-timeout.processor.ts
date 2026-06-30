import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Inject, Injectable, Logger } from '@nestjs/common';
import { Job } from 'bullmq';

import { QueueName } from '../../queue/enums/QueueTypes.enum';
import { PaymentTimeoutJobData } from '../../queue/types';

import { OrderService } from '../order.service';
import { OrderStatus } from '../enums/OrderStatus';

@Processor(QueueName.ORDER_PAYMENT_TIMEOUT)
@Injectable()
export class PaymentTimeoutProcessor extends WorkerHost {
    private readonly logger = new Logger(PaymentTimeoutProcessor.name);

    constructor(
        @Inject(OrderService)
        private readonly orderService: OrderService,
    ) {
        super();
    }

    async process(job: Job<PaymentTimeoutJobData>): Promise<void> {
        const { orderUuid } = job.data;

        this.logger.log(`Payment timeout check for order ${orderUuid}`);

        const order = await this.orderService.findOne(orderUuid).catch(() => null);
        if (!order) {
            this.logger.warn(`Payment timeout: order ${orderUuid} not found — skipping`);
            return;
        }

        const isPending =
            order.status === OrderStatus.PENDING ||
            order.status === OrderStatus.PAYMENT_PENDING;

        if (!isPending) {
            this.logger.log(`Payment timeout: order ${orderUuid} already resolved (status=${order.status}) — no action`);
            return;
        }

        await this.orderService.updateStatus(
            orderUuid,
            OrderStatus.CANCELLED,
            'Payment not completed within 30 minutes',
        );

        this.logger.log(`Payment timeout: order ${orderUuid} cancelled due to payment timeout`);
    }
}

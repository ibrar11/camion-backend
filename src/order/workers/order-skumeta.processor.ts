import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Inject, Injectable, Logger } from '@nestjs/common';
import { Job } from 'bullmq';

import { QueueName } from '../../queue/enums/QueueTypes.enum';
import { OrderSkuMetaJobData } from '../../queue/types';

import { OrderService } from '../order.service';
import { InjectRepository } from '@nestjs/typeorm';
import { Order } from '../entities/order.entity';
import { Repository } from 'typeorm';
import { OrderItem } from '../entities/order-item.entity';

@Processor(QueueName.ORDER_SKUMETA_VALIDATION)
@Injectable()
export class OrderSkuMetaProcessor extends WorkerHost {
    private readonly logger = new Logger(OrderSkuMetaProcessor.name);

    constructor(
        @InjectRepository(Order) private readonly orderRepository: Repository<Order>,
        @InjectRepository(OrderItem) private readonly orderItemRepository: Repository<OrderItem>,
    ) {
        super();
    }

    async process(job: Job<OrderSkuMetaJobData>): Promise<void> {
        const { orderUuid } = job.data;

        this.logger.log(`Order sku meta and procurement id check for order ${orderUuid}`);

        const order = await this.orderRepository.findOne({
            relationLoadStrategy: "query",
            where: { uuid: orderUuid },
            relations: {
                orderItems: {
                    product: true,
                    variant: true,
                },
                customer: true,
            },
        });

        if (!order) {
            this.logger.warn(`Order sku meta and procurement id: order ${orderUuid} not found — skipping`);
            return;
        }

        const orderItems = order.orderItems.map((item) => {
            if (!item?.product?.procurementId || !item?.variant?.skuMeta) {
                item.inValidOrderItem = true;
            }
            return item;
        });

        const invalid = orderItems.find(item => item.inValidOrderItem === true);
        order.inValidOrder = invalid ? true : false;

        await this.orderItemRepository.save(orderItems);
        await this.orderRepository.save(order);

        this.logger.log(`Order sku meta and procurementId: order ${orderUuid} synced`);
    }
}

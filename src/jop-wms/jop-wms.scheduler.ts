import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { InjectRepository } from '@nestjs/typeorm';
import { Not, In, Repository } from 'typeorm';

import { JopWmsClient } from './jop-wms.client';
import { JopWmsOrder, JopWmsOrderType, JOP_WMS_TERMINAL_STATUSES } from './entities/jop-wms-order.entity';
import { JopWmsService } from './jop-wms.service';

@Injectable()
export class JopWmsScheduler {
    private readonly logger = new Logger(JopWmsScheduler.name);

    // Max consecutive errors before we stop polling an order
    private readonly MAX_ERRORS = 5;

    constructor(
        @InjectRepository(JopWmsOrder)
        private readonly wmsOrderRepository: Repository<JopWmsOrder>,
        private readonly client: JopWmsClient,
        private readonly wmsService: JopWmsService,
    ) { }

    /**
     * Polls pending inbound orders every 30 minutes.
     * Inbound (stock receiving) is slower-paced so a longer interval avoids hammering the API.
     */
    @Cron(CronExpression.EVERY_30_MINUTES)
    async pollInboundOrders() {
        await this.pollByType(JopWmsOrderType.INBOUND, 'inboundorder/status', 'customerVoucherNo');
    }

    /**
     * Polls pending outbound orders every 15 minutes.
     * Outbound (fulfillment) is more time-sensitive — customers are waiting for tracking.
     */
    @Cron('0 */15 * * * *')
    async pollOutboundOrders() {
        await this.pollByType(JopWmsOrderType.OUTBOUND, 'outboundorder/status', 'customerVoucherNo');
    }

    /**
     * Polls pending return orders every 30 minutes.
     * Returns are queried by waybillNo + warehouseCode.
     */
    @Cron(CronExpression.EVERY_30_MINUTES)
    async pollReturnOrders() {
        await this.pollByType(JopWmsOrderType.RETURN, 'returnorder/query', 'waybillNo', {
            warehouseCode: process.env.JOP_WMS_WAREHOUSE_CODE ?? '',
        });
    }

    private async pollByType(
        type: JopWmsOrderType,
        endpoint: string,
        orderNoField: string,
        extraFields: Record<string, unknown> = {},
    ) {
        const orders = await this.wmsOrderRepository.find({
            where: {
                type,
                status: Not(In([...JOP_WMS_TERMINAL_STATUSES])),
            },
        });

        if (!orders.length) return;

        this.logger.log(`Polling ${orders.length} ${type} order(s)`);

        for (const order of orders) {
            if (order.errorCount >= this.MAX_ERRORS) {
                this.logger.warn(`Skipping ${order.orderNo} — exceeded max errors (${this.MAX_ERRORS})`);
                continue;
            }

            try {
                const data: any = await this.client.post(endpoint, { [orderNoField]: order.orderNo, ...extraFields });

                const newStatus: string = String(data?.data?.status ?? data?.data?.orderStatus ?? order.status).toLowerCase();
                const waybillNo: string | null = data?.data?.waybillNo ?? data?.data?.trackingNo ?? order.waybillNo;

                const prevStatus = order.status;
                order.status = newStatus;
                order.waybillNo = waybillNo;
                order.lastPolledAt = new Date();
                order.errorCount = 0;

                this.logger.log(`${order.orderNo} → ${order.status}${waybillNo ? ` (waybill: ${waybillNo})` : ''}`);

                // Auto-create outbound order when inbound goods are received (shelved)
                if (order.type === JopWmsOrderType.INBOUND && prevStatus !== 'shelved' && order.status === 'shelved') {
                    this.logger.log(`Inbound ${order.orderNo} shelved — creating outbound orders`);
                    await this.wmsService.createOutboundsForInbound(order);
                }
            } catch (err: any) {
                order.errorCount += 1;
                order.lastPolledAt = new Date();
                this.logger.error(`Poll failed for ${order.orderNo} (attempt ${order.errorCount}): ${err?.message}`);
            }

            await this.wmsOrderRepository.save(order);
        }
    }
}

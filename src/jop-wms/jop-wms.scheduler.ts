import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { InjectRepository } from '@nestjs/typeorm';
import { Not, In, IsNull, Repository } from 'typeorm';

import { JopWmsClient } from './jop-wms.client';
import { JopWmsOrder, JopWmsOrderType, JopWmsInboundStatus, JopWmsOutboundStatus, JOP_WMS_TERMINAL_STATUSES } from './entities/jop-wms-order.entity';
import { JopWmsService } from './jop-wms.service';

import { Order } from '../order/entities/order.entity';
import { NotificationsService } from '../notifications/notifications.service';
import { NotificationType } from '../notifications/enums/notification-type.enum';
import { NotificationPriority } from '../notifications/enums/notification-priority.enum';

@Injectable()
export class JopWmsScheduler {
    private readonly logger = new Logger(JopWmsScheduler.name);

    // Max consecutive errors before we stop polling an order
    private readonly MAX_ERRORS = 5;

    private readonly STALE_DAYS = parseInt(process.env.WMS_STALE_INBOUND_DAYS ?? '30', 10);

    constructor(
        @InjectRepository(JopWmsOrder)
        private readonly wmsOrderRepository: Repository<JopWmsOrder>,
        @InjectRepository(Order)
        private readonly orderRepository: Repository<Order>,
        private readonly client: JopWmsClient,
        private readonly wmsService: JopWmsService,
        private readonly notificationsService: NotificationsService,
    ) { }

    /**
     * Polls pending inbound orders every 3 hours.
     * Also force-expires inbounds that have been pending for >30 days.
     */
    @Cron('0 0 */3 * * *')
    async pollInboundOrders() {
        await this.pollByType(JopWmsOrderType.INBOUND, 'inboundorder/status', 'customerVoucherNo');
    }

    /**
     * Polls pending outbound orders every 3 hours and backfills missing waybill numbers.
     */
    @Cron('0 0 */3 * * *')
    async pollOutboundOrders() {
        await this.pollByType(JopWmsOrderType.OUTBOUND, 'outboundorder/status', 'customerVoucherNo');
        await this.fetchMissingWaybillNumbers();
    }

    private async fetchMissingWaybillNumbers() {
        const orders = await this.wmsOrderRepository.find({
            where: {
                type: JopWmsOrderType.OUTBOUND,
                status: JopWmsOutboundStatus.SHIPPED,
                waybillNo: IsNull(),
            },
        });

        if (!orders.length) return;

        this.logger.log(`Fetching waybill numbers for ${orders.length} shipped outbound order(s)`);

        for (const order of orders) {
            try {
                const data: any = await this.client.post('waybillNo/query', { customerVoucherNo: order.orderNo });
                const waybillNo: string | null = data?.data?.waybillNo ?? null;
                if (waybillNo) {
                    order.waybillNo = waybillNo;
                    await this.wmsOrderRepository.save(order);
                    this.logger.log(`${order.orderNo} waybill: ${waybillNo}`);
                }
            } catch (err: any) {
                this.logger.warn(`waybillNo/query failed for ${order.orderNo}: ${err?.message}`);
            }
        }
    }

    /**
     * Polls pending return orders every 3 hours.
     */
    @Cron('0 0 */3 * * *')
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
            relations: ['sourceOrders'],
        });

        if (!orders.length) return;

        this.logger.log(`Polling ${orders.length} ${type} order(s)`);

        const cutoff = new Date();
        cutoff.setDate(cutoff.getDate() - this.STALE_DAYS);

        for (const order of orders) {
            // Force-expire inbounds that have been pending for too long
            if (type === JopWmsOrderType.INBOUND && order.createdAt < cutoff) {
                this.logger.warn(`Force-expiring stale inbound ${order.orderNo} (created: ${order.createdAt.toISOString()})`);
                order.status = JopWmsInboundStatus.DELETED;
                await this.wmsOrderRepository.save(order);
                await this.wmsService.createOutboundsForInbound(order);
                continue;
            }

            if (order.errorCount >= this.MAX_ERRORS) {
                this.logger.warn(`Skipping ${order.orderNo} — exceeded max errors (${this.MAX_ERRORS})`);
                continue;
            }

            try {
                const data: any = await this.client.post(endpoint, { [orderNoField]: order.orderNo, ...extraFields });

                const newStatus: string = String(data?.data?.status ?? data?.data?.orderStatus ?? order.status).toLowerCase();

                const prevStatus = order.status;
                const prevWaybillNo = order.waybillNo;
                order.status = newStatus;
                order.lastPolledAt = new Date();
                order.errorCount = 0;

                // outboundorder/status does not return waybillNo — fetch it separately on transition to SHIPPED.
                // fetchMissingWaybillNumbers() handles retries for orders that remain null after this.
                if (order.type === JopWmsOrderType.OUTBOUND && prevStatus !== JopWmsOutboundStatus.SHIPPED && order.status === JopWmsOutboundStatus.SHIPPED) {
                    try {
                        const waybillData: any = await this.client.post('waybillNo/query', { customerVoucherNo: order.orderNo });
                        order.waybillNo = waybillData?.data?.waybillNo ?? null;
                    } catch (err: any) {
                        this.logger.warn(`waybillNo/query failed for ${order.orderNo}: ${err?.message}`);
                    }
                }

                this.logger.log(`${order.orderNo} → ${order.status}${order.waybillNo ? ` (waybill: ${order.waybillNo})` : ''}`);

                // Persist status change BEFORE triggering outbound creation.
                // If outbound creation fails, the stored status is already committed so
                // the next poll sees prevStatus=STORED and won't re-trigger.
                await this.wmsOrderRepository.save(order);

                // Auto-create outbound order when inbound goods are fully stored
                if (order.type === JopWmsOrderType.INBOUND && prevStatus !== JopWmsInboundStatus.STORED && order.status === JopWmsInboundStatus.STORED) {
                    this.logger.log(`Inbound ${order.orderNo} stored — creating outbound orders`);
                    await this.wmsService.createOutboundsForInbound(order);
                    const linkedUuids = order.sourceOrders?.map(l => l.orderUuid) ?? [];
                    if (linkedUuids.length) {
                        await this.notifyOrderCustomers(linkedUuids, NotificationType.ORDER_PROCESSING, {
                            title: 'Order Processing',
                            brief: 'Your order is being prepared for shipment.',
                            message: 'Your items have arrived at the warehouse and your order is now being prepared for shipment.',
                        });
                    }
                }

                // Notify customer when outbound order receives a waybill number
                const linkedUuids = order.sourceOrders?.map(l => l.orderUuid) ?? [];
                if (order.type === JopWmsOrderType.OUTBOUND && order.waybillNo && !prevWaybillNo && linkedUuids.length) {
                    await this.notifyOrderCustomers(linkedUuids, NotificationType.ORDER_SHIPPED, {
                        title: 'Order Shipped',
                        brief: 'Your order is on its way.',
                        message: `Your order has been shipped. Tracking number: ${order.waybillNo}.`,
                    });
                }
            } catch (err: any) {
                order.errorCount += 1;
                order.lastPolledAt = new Date();
                this.logger.error(`Poll failed for ${order.orderNo} (attempt ${order.errorCount}): ${err?.message}`);
                await this.wmsOrderRepository.save(order);
            }
        }
    }

    private async notifyOrderCustomers(
        orderUuids: string[],
        type: NotificationType,
        content: { title: string; brief: string; message: string },
    ) {
        for (const uuid of orderUuids) {
            try {
                const order = await this.orderRepository.findOne({
                    where: { uuid },
                    relations: { customer: true },
                });
                if (!order?.customer) continue;

                await this.notificationsService.create({
                    customerUUID: order.customer.uuid,
                    type,
                    ...content,
                    priority: NotificationPriority.HIGH,
                });
            } catch (err: any) {
                this.logger.warn(`Failed to send ${type} notification for order ${uuid}: ${err?.message}`);
            }
        }
    }
}

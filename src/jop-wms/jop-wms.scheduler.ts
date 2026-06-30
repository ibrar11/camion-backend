import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { InjectRepository } from '@nestjs/typeorm';
import { Not, In, IsNull, Repository } from 'typeorm';

import { JopWmsClient } from './jop-wms.client';
import { JopWmsOrder, JopWmsOrderType, JopWmsInboundStatus, JopWmsOutboundStatus, JOP_WMS_TERMINAL_STATUSES } from './entities/jop-wms-order.entity';
import { JopWmsService } from './jop-wms.service';

import { Order } from '../order/entities/order.entity';
import { OrderTrackingEvent } from '../order/entities/order-tracking-event.entity';
import { OrderTrackingStage } from '../order/enums/OrderTrackingStage';
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
        @InjectRepository(OrderTrackingEvent)
        private readonly trackingEventRepository: Repository<OrderTrackingEvent>,
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

    @Cron('0 0 9,21 * * *')
    async pollMissingOutbounds() {
        await this.recoverMissingOutbounds();
    }

    private async recoverMissingOutbounds() {
        // Only fetch stored inbounds that have at least one linked order with no outbound yet.
        // Once all linked orders have outbounds, the inbound drops out of this query permanently.
        const inbounds = await this.wmsOrderRepository
            .createQueryBuilder('inbound')
            .leftJoinAndSelect('inbound.sourceOrders', 'link')
            .where('inbound.type = :type', { type: JopWmsOrderType.INBOUND })
            .andWhere('inbound.status = :status', { status: JopWmsInboundStatus.STORED })
            .andWhere(`EXISTS (
                SELECT 1 FROM jop_wms_order_links il
                WHERE il.wms_order_id = inbound.id
                AND NOT EXISTS (
                    SELECT 1 FROM jop_wms_order_links ol
                    INNER JOIN jop_wms_orders o ON o.id = ol.wms_order_id
                    WHERE ol.order_uuid = il.order_uuid
                    AND o.type = :outType
                )
            )`)
            .setParameter('outType', JopWmsOrderType.OUTBOUND)
            .getMany();

        if (!inbounds.length) return;

        this.logger.log(`Outbound recovery: ${inbounds.length} stored inbound(s) missing outbounds`);

        for (const inbound of inbounds) {
            this.logger.log(`Outbound recovery: creating outbound(s) for inbound ${inbound.orderNo}`);
            try {
                await this.wmsService.createOutboundsForInbound(inbound);
            } catch (err: any) {
                this.logger.error(`Outbound recovery failed for inbound ${inbound.orderNo}: ${err?.message}`);
            }
        }
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
                try {
                    await this.wmsService.createOutboundsForInbound(order);
                } catch (err: any) {
                    this.logger.error(`Force-expire outbound creation failed for ${order.orderNo}: ${err?.message}`);
                }
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
                order.lastError = null;

                // Capture trackingNumber directly from the status response if present (available from status 13+).
                // Fall back to waybillNo/query on transition to SHIPPED for orders that didn't have it earlier.
                if (order.type === JopWmsOrderType.OUTBOUND && !order.waybillNo) {
                    const inlineTracking: string | null = data?.data?.trackingNumber ?? null;
                    if (inlineTracking) {
                        order.waybillNo = inlineTracking;
                    } else if (prevStatus !== JopWmsOutboundStatus.SHIPPED && order.status === JopWmsOutboundStatus.SHIPPED) {
                        try {
                            const waybillData: any = await this.client.post('waybillNo/query', { customerVoucherNo: order.orderNo });
                            order.waybillNo = waybillData?.data?.waybillNo ?? null;
                        } catch (err: any) {
                            this.logger.warn(`waybillNo/query failed for ${order.orderNo}: ${err?.message}`);
                        }
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
                    for (const orderUuid of linkedUuids) {
                        const exists = await this.trackingEventRepository.findOne({
                            where: { orderUuid, stage: OrderTrackingStage.PACKING },
                        });
                        if (!exists) {
                            await this.trackingEventRepository.save(
                                this.trackingEventRepository.create({
                                    orderUuid,
                                    stage: OrderTrackingStage.PACKING,
                                    date: new Date(),
                                    trackingId: null,
                                }),
                            );
                        }
                    }
                    if (linkedUuids.length) {
                        await this.notifyOrderCustomers(linkedUuids, NotificationType.ORDER_PROCESSING, {
                            title: 'Order Processing',
                            brief: 'Your order is being prepared for shipment.',
                            message: 'Your items have arrived at the warehouse and your order is now being prepared for shipment.',
                        });
                    }
                }

                // Notify customer and record DISPATCHING event when waybill is received
                const linkedUuids = order.sourceOrders?.map(l => l.orderUuid) ?? [];
                if (order.type === JopWmsOrderType.OUTBOUND && order.waybillNo && !prevWaybillNo && linkedUuids.length) {
                    await this.notifyOrderCustomers(linkedUuids, NotificationType.ORDER_SHIPPED, {
                        title: 'Order Shipped',
                        brief: 'Your order is on its way.',
                        message: `Your order has been shipped. Tracking number: ${order.waybillNo}.`,
                    });

                    for (const orderUuid of linkedUuids) {
                        const existing = await this.trackingEventRepository.findOne({
                            where: { orderUuid, stage: OrderTrackingStage.DISPATCHING },
                        });
                        if (!existing) {
                            await this.trackingEventRepository.save(
                                this.trackingEventRepository.create({
                                    orderUuid,
                                    stage: OrderTrackingStage.DISPATCHING,
                                    date: new Date(),
                                    trackingId: order.waybillNo,
                                }),
                            );
                        }
                    }
                }
            } catch (err: any) {
                order.errorCount += 1;
                order.lastPolledAt = new Date();
                order.lastError = err?.message ?? 'Unknown error';
                this.logger.error(`Poll failed for ${order.orderNo} (attempt ${order.errorCount}): ${order.lastError}`);
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

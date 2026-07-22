import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Job } from 'bullmq';
import { DataSource, In, Repository } from 'typeorm';

import { QueueName } from '../../queue/enums/QueueTypes.enum';
import { DispatchOrderJobData } from '../../queue/types';

import { Order } from '../../order/entities/order.entity';
import { OrderTrackingEvent } from '../../order/entities/order-tracking-event.entity';
import { OrderTrackingStage } from '../../order/enums/OrderTrackingStage';
import { JopWmsOrder, JopWmsOrderType, JOP_WMS_AWAITING_TRACKING_STATUS } from '../entities/jop-wms-order.entity';
import { JopWmsOrderLink } from '../entities/jop-wms-order-link.entity';
import { JopWmsClient } from '../jop-wms.client';
import { ProcurementService } from '../../procurement/procurement.service';

@Processor(QueueName.WMS_DISPATCH_HIOBUY, { concurrency: 3 })
@Injectable()
export class DispatchOrderProcessor extends WorkerHost {
    private readonly logger = new Logger(DispatchOrderProcessor.name);

    constructor(
        @InjectRepository(Order)
        private readonly orderRepository: Repository<Order>,
        @InjectRepository(JopWmsOrder)
        private readonly wmsOrderRepository: Repository<JopWmsOrder>,
        @InjectRepository(JopWmsOrderLink)
        private readonly wmsOrderLinkRepository: Repository<JopWmsOrderLink>,
        @InjectRepository(OrderTrackingEvent)
        private readonly trackingEventRepository: Repository<OrderTrackingEvent>,
        private readonly client: JopWmsClient,
        private readonly procurementService: ProcurementService,
        private readonly dataSource: DataSource,
    ) {
        super();
    }

    async process(job: Job<DispatchOrderJobData>): Promise<void> {
        const {
            dispatchJobId, shopId, orderUuids, inboundVoucherNo,
            shipperMethod, shipperCompany, warehouseAddress, hiobuyLines, variantSyncData,
        } = job.data;

        this.logger.log(`Processing Hiobuy dispatch shop job: dispatchJobId=${dispatchJobId} shop=${shopId} orders=${orderUuids.length}`);

        // ── Step 1: Full-job idempotency — placeholder inbound existing means done ──
        const existingInbound = await this.wmsOrderRepository.findOne({
            where: { orderNo: inboundVoucherNo },
        });
        if (existingInbound) {
            this.logger.log(`Dispatch ${dispatchJobId} shop ${shopId}: inbound ${inboundVoucherNo} already tracked — done`);
            return;
        }

        // ── Step 2: Hiobuy idempotency — ONLY use the BullMQ job-data checkpoint ────
        const existingHiobuyOrderId = job.data.hiobuyOrderId;

        if (existingHiobuyOrderId) {
            this.logger.log(`Dispatch ${dispatchJobId} shop ${shopId}: Hiobuy already created (${existingHiobuyOrderId}) — skipping`);
        } else {
            // ── Step 3: Sync variants to WMS (idempotent, non-blocking) ──────
            for (const variantData of variantSyncData) {
                this.logger.log(`Dispatch ${dispatchJobId}: syncing variant ${variantData.sku} to WMS`);
                try {
                    await this.client.post('product/synchronize', variantData);
                    this.logger.log(`Dispatch ${dispatchJobId}: variant ${variantData.sku} synced`);
                } catch (err: any) {
                    this.logger.warn(`Dispatch ${dispatchJobId}: variant sync failed for ${variantData.sku} — ${err?.message}`);
                }
            }

            // ── Step 4: Create Hiobuy order — one call covering the whole shop batch ─
            const { orderId, raw } = await this.procurementService.createHiobuyOrder({
                lines: hiobuyLines,
                receiver: warehouseAddress as any,
            });

            this.logger.log(`Dispatch ${dispatchJobId} shop ${shopId}: Hiobuy order created: ${orderId}`);

            // Checkpoint into job data so retries skip Hiobuy even if the DB write below fails
            await job.updateData({ ...job.data, hiobuyOrderId: orderId, hiobuyResponse: raw });

            // ── Step 5: Append Hiobuy order id to every order in the batch + stamp tracking ──
            const runner = this.dataSource.createQueryRunner();
            await runner.connect();
            await runner.startTransaction();
            try {
                for (const orderUuid of orderUuids) {
                    await runner.query(
                        `UPDATE orders
                         SET gulltrans_order_sns = array_append(COALESCE(gulltrans_order_sns, '{}'), $1)
                         WHERE uuid = $2`,
                        [orderId, orderUuid],
                    );
                }
                for (const orderUuid of orderUuids) {
                    const alreadyProcessing = await runner.manager.findOne(OrderTrackingEvent, {
                        where: { orderUuid, stage: OrderTrackingStage.PROCESSING },
                    });
                    if (!alreadyProcessing) {
                        await runner.manager.save(
                            runner.manager.create(OrderTrackingEvent, {
                                orderUuid,
                                stage: OrderTrackingStage.PROCESSING,
                                date: new Date(),
                                trackingId: null,
                            }),
                        );
                    }
                }
                await runner.commitTransaction();
            } catch (err: any) {
                await runner.rollbackTransaction();
                this.logger.error(`Dispatch ${dispatchJobId} shop ${shopId}: DB write failed — ${err?.message}`);
                throw err;
            } finally {
                await runner.release();
            }
        }

        // ── Step 6: Create placeholder inbound — real WMS inbound is created later,
        //    once pollHiobuyPendingInbounds finds a real tracking number ──────────
        const hiobuyOrderId = job.data.hiobuyOrderId ?? existingHiobuyOrderId ?? null;
        const hiobuyResponse = job.data.hiobuyResponse ?? null;

        this.logger.log(`Dispatch ${dispatchJobId} shop ${shopId}: creating placeholder inbound ${inboundVoucherNo}, awaiting tracking`);

        const inbound = await this.wmsOrderRepository.save(
            this.wmsOrderRepository.create({
                orderNo: inboundVoucherNo,
                type: JopWmsOrderType.INBOUND,
                status: JOP_WMS_AWAITING_TRACKING_STATUS,
                wmsAssignedId: null,
                gulltransResponse: hiobuyResponse,
                hiobuyShipperMethod: shipperMethod,
                hiobuyShipperCompany: shipperCompany ?? null,
                hiobuyShopId: shopId,
                hiobuyOrderId,
                dispatchJobId,
            }),
        );

        const orders = await this.orderRepository.find({
            where: { uuid: In(orderUuids) },
            select: ['id', 'uuid'],
        });
        if (orders.length) {
            const links = orders.map(o =>
                this.wmsOrderLinkRepository.create({ wmsOrderId: inbound.id, orderId: o.id, orderUuid: o.uuid }),
            );
            await this.wmsOrderLinkRepository
                .createQueryBuilder()
                .insert()
                .into(JopWmsOrderLink)
                .values(links)
                .orIgnore()
                .execute();
        }

        this.logger.log(`Dispatch ${dispatchJobId} shop ${shopId}: placeholder inbound ${inboundVoucherNo} created covering ${orderUuids.length} order(s), awaiting tracking`);
    }
}

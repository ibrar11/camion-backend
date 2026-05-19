import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Job } from 'bullmq';
import { DataSource, In, Repository } from 'typeorm';

import { QueueName } from '../../queue/enums/QueueTypes.enum';
import { DispatchShopJobData } from '../../queue/types';

import { OrderAddressDto } from '../../procurement/dtos/CreateProcurementOrderDto';

import { Order } from '../../order/entities/order.entity';
import { JopWmsOrder, JopWmsOrderType } from '../entities/jop-wms-order.entity';
import { JopWmsOrderLink } from '../entities/jop-wms-order-link.entity';
import { JopWmsClient } from '../jop-wms.client';
import { ProcurementService } from '../../procurement/procurement.service';

@Processor(QueueName.WMS_DISPATCH, { concurrency: 3 })
@Injectable()
export class DispatchProcessor extends WorkerHost {
    private readonly logger = new Logger(DispatchProcessor.name);

    private get warehouseCode() { return process.env.JOP_WMS_WAREHOUSE_CODE ?? ''; }

    constructor(
        @InjectRepository(Order)
        private readonly orderRepository: Repository<Order>,
        @InjectRepository(JopWmsOrder)
        private readonly wmsOrderRepository: Repository<JopWmsOrder>,
        @InjectRepository(JopWmsOrderLink)
        private readonly wmsOrderLinkRepository: Repository<JopWmsOrderLink>,
        private readonly client: JopWmsClient,
        private readonly procurementService: ProcurementService,
        private readonly dataSource: DataSource,
    ) {
        super();
    }

    async process(job: Job<DispatchShopJobData>): Promise<void> {
        const {
            dispatchJobId, shopId, orderUuids,
            inboundVoucherNo, shipperMethod, shipperCompany,
            warehouseAddress, gulltransItems, variantSyncData, wmsBoxList,
        } = job.data;

        this.logger.log(`Processing dispatch shop job: dispatchJobId=${dispatchJobId} shop=${shopId} orders=${orderUuids.length}`);

        // ── Step 1: Full-job idempotency — inbound existing means the entire job completed ──
        const existingInbound = await this.wmsOrderRepository.findOne({
            where: { orderNo: inboundVoucherNo },
        });
        if (existingInbound) {
            this.logger.log(`Dispatch ${dispatchJobId} shop ${shopId}: inbound ${inboundVoucherNo} already tracked — done`);
            return;
        }

        // ── Step 2: Gulltrans idempotency — ONLY use the BullMQ job-data checkpoint ─────────
        //    Do NOT fall back to orders.gulltransOrderSn from the DB. That column is written by
        //    every shop job for the same customer orders, so a competing shop job completing first
        //    would make this job falsely believe its own Gulltrans order was already created.
        const existingSn = job.data.gulltransOrderSn ?? null;

        let gulltransOrderSn: string;

        if (existingSn) {
            this.logger.log(`Dispatch ${dispatchJobId} shop ${shopId}: Gulltrans already created (${existingSn}) — skipping`);
            gulltransOrderSn = existingSn;
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

            // ── Step 4: Create Gulltrans procurement order ────────────────────
            const result = await this.procurementService.bulkCreateOrder({
                orders: gulltransItems,
                address: warehouseAddress as OrderAddressDto,
            });

            const shopResult = result.success.find(s => String(s.shopId) === String(shopId));
            if (!shopResult) {
                const failure = result.failed.find(f => String(f.shopId) === String(shopId));
                throw new Error(`Gulltrans failed for shop ${shopId}: ${failure?.reason ?? 'no success entry returned'}`);
            }

            gulltransOrderSn = shopResult.orderSn;
            this.logger.log(`Dispatch ${dispatchJobId} shop ${shopId}: Gulltrans order ${gulltransOrderSn} created`);

            // Checkpoint into job data so retries skip Gulltrans even if the DB write below fails
            await job.updateData({ ...job.data, gulltransOrderSn, gulltransResponse: shopResult.raw });

            // ── Step 5: Append gulltransOrderSn to each order's array (all-or-nothing) ─
            const runner = this.dataSource.createQueryRunner();
            await runner.connect();
            await runner.startTransaction();
            try {
                for (const orderUuid of orderUuids) {
                    await runner.query(
                        `UPDATE orders
                         SET gulltrans_order_sns = array_append(COALESCE(gulltrans_order_sns, '{}'), $1)
                         WHERE uuid = $2`,
                        [gulltransOrderSn, orderUuid],
                    );
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

        // ── Step 6: Create WMS inbound ────────────────────────────────────────

        this.logger.log(`Dispatch ${dispatchJobId} shop ${shopId}: creating WMS inbound ${inboundVoucherNo} (${wmsBoxList.length} box(es))`);
        const inboundResult: any = await this.client.post('inboundorder/create', {
            warehouseCode: this.warehouseCode,
            customerVoucherNo: inboundVoucherNo,
            shipperMethod,
            shipperCompany: shipperCompany ?? '',
            equipmentNumber: '',
            waybillNo: '',
            vat: '',
            vatInfo: '',
            memo: '',
            boxList: wmsBoxList,
        });

        const wmsAssignedId = String(inboundResult?.data?.inboundOrderId ?? '') || null;
        this.logger.log(`Dispatch ${dispatchJobId} shop ${shopId}: WMS inbound ${inboundVoucherNo} created — WMS ID ${wmsAssignedId ?? 'N/A'}`);

        const inbound = await this.wmsOrderRepository.save(
            this.wmsOrderRepository.create({
                orderNo: inboundVoucherNo,
                type: JopWmsOrderType.INBOUND,
                status: 'pending',
                wmsAssignedId,
                gulltransResponse: job.data.gulltransResponse ?? null,
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

        this.logger.log(`Dispatch ${dispatchJobId} shop ${shopId}: inbound ${inboundVoucherNo} created covering ${orderUuids.length} order(s)`);
    }
}

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

        // ── Step 1: Idempotency check — skip Gulltrans if already done ────────
        const orders = await this.orderRepository.find({ where: { uuid: In(orderUuids) } });
        const existingId = orders.find(o => o.gulltransOrderId)?.gulltransOrderId ?? null;

        let gulltransOrderId: string;

        if (existingId) {
            this.logger.log(`Dispatch ${dispatchJobId} shop ${shopId}: Gulltrans already created (${existingId}) — skipping`);
            gulltransOrderId = existingId;
        } else {
            // ── Step 2: Sync variants to WMS (idempotent, non-blocking) ──────
            for (const variantData of variantSyncData) {
                try {
                    await this.client.post('product/synchronize', variantData);
                } catch (err: any) {
                    this.logger.warn(`Variant sync failed for ${variantData.sku}: ${err?.message}`);
                }
            }

            // ── Step 3: Create Gulltrans procurement order ────────────────────
            const result = await this.procurementService.bulkCreateOrder({
                orders: gulltransItems,
                address: warehouseAddress as OrderAddressDto,
            });

            const shopResult = result.success.find(s => String(s.shopId) === String(shopId));
            if (!shopResult) {
                const failure = result.failed.find(f => String(f.shopId) === String(shopId));
                throw new Error(`Gulltrans failed for shop ${shopId}: ${failure?.reason ?? 'no success entry returned'}`);
            }

            gulltransOrderId = String(shopResult.orderId);
            this.logger.log(`Dispatch ${dispatchJobId} shop ${shopId}: Gulltrans order ${gulltransOrderId} created`);

            // ── Step 4: Persist gulltransOrderId (all-or-nothing transaction) ─
            const runner = this.dataSource.createQueryRunner();
            await runner.connect();
            await runner.startTransaction();
            try {
                for (const orderUuid of orderUuids) {
                    await runner.manager.update(Order, { uuid: orderUuid }, { gulltransOrderId });
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

        // ── Step 5: Create WMS inbound (idempotent via orderNo uniqueness) ────
        const existingInbound = await this.wmsOrderRepository.findOne({
            where: { orderNo: inboundVoucherNo },
        });

        if (existingInbound) {
            this.logger.log(`Dispatch ${dispatchJobId} shop ${shopId}: inbound ${inboundVoucherNo} already tracked — done`);
            return;
        }

        await this.client.post('inboundorder/create', {
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

        await this.wmsOrderRepository.save(
            this.wmsOrderRepository.create({
                orderNo: inboundVoucherNo,
                type: JopWmsOrderType.INBOUND,
                status: 'pending',
                sourceOrderUuids: orderUuids.join(','),
            }),
        );

        this.logger.log(`Dispatch ${dispatchJobId} shop ${shopId}: inbound ${inboundVoucherNo} created covering ${orderUuids.length} order(s)`);
    }
}

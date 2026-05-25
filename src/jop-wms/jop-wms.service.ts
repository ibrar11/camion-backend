import * as crypto from 'node:crypto';

import {
    BadRequestException,
    Injectable,
    Logger,
    NotFoundException,
} from '@nestjs/common';

import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';

import { InjectRepository } from '@nestjs/typeorm';
import { In, IsNull, Repository } from 'typeorm';

import { ProductVariant } from '../inventory/entities/product-variant.entity';
import { Warehouse } from '../inventory/entities/warehouse.entity';
import { WeightUnit } from '../inventory/enums/WeightUnit.enum';
import { DimensionsUnit } from '../inventory/enums/DimensionsUnit.enum';

import { Order } from '../order/entities/order.entity';
import { OrderItem } from '../order/entities/order-item.entity';
import { OrderStatus } from '../order/enums/OrderStatus';

import { JopWmsClient } from './jop-wms.client';
import { JopWmsOrder, JopWmsInboundStatus, JopWmsOrderType, JopWmsOutboundStatus, JOP_WMS_TERMINAL_STATUSES } from './entities/jop-wms-order.entity';
import { JopWmsOrderLink } from './entities/jop-wms-order-link.entity';

import { SyncProductDto } from './dtos/SyncProductDto';
import { QueryProductDto } from './dtos/QueryProductDto';
import { CreateInboundOrderDto } from './dtos/CreateInboundOrderDto';
import { InboundOrderStatusDto } from './dtos/InboundOrderStatusDto';
import { GetInboundLabelDto } from './dtos/GetInboundLabelDto';
import { CancelOrderDto } from './dtos/CancelOrderDto';
import { CreateOutboundOrderDto } from './dtos/CreateOutboundOrderDto';
import { EstimateShippingDto } from './dtos/EstimateShippingDto';
import { QueryInventoryDto } from './dtos/QueryInventoryDto';
import { GetLogisticsDto } from './dtos/GetLogisticsDto';
import { CreateReturnOrderDto } from './dtos/CreateReturnOrderDto';
import { QueryReturnOrderDto } from './dtos/QueryReturnOrderDto';
import { DispatchOrdersDto } from './dtos/DispatchOrdersDto';
import { RecoverInboundDto } from './dtos/RecoverInboundDto';

import { ProcurementService } from '../procurement/procurement.service';
import { OrderAddressDto } from '../procurement/dtos/CreateProcurementOrderDto';

import { QueueName } from '../queue/enums/QueueTypes.enum';
import { DispatchShopJobData } from '../queue/types';

@Injectable()
export class JopWmsService {
    private readonly logger = new Logger(JopWmsService.name);

    private get warehouseCode() { return process.env.JOP_WMS_WAREHOUSE_CODE ?? ''; }

    constructor(
        @InjectRepository(ProductVariant)
        private readonly variantRepository: Repository<ProductVariant>,
        @InjectRepository(JopWmsOrder)
        private readonly wmsOrderRepository: Repository<JopWmsOrder>,
        @InjectRepository(Order)
        private readonly orderRepository: Repository<Order>,
        @InjectRepository(Warehouse)
        private readonly warehouseRepository: Repository<Warehouse>,
        @InjectRepository(JopWmsOrderLink)
        private readonly wmsOrderLinkRepository: Repository<JopWmsOrderLink>,
        private readonly client: JopWmsClient,
        private readonly procurementService: ProcurementService,
        @InjectQueue(QueueName.WMS_DISPATCH)
        private readonly dispatchQueue: Queue,
    ) { }

    private async trackOrder(orderNo: string, type: JopWmsOrderType, orderUuids?: string[], wmsAssignedId?: string) {
        const existing = await this.wmsOrderRepository.findOne({ where: { orderNo } });
        if (existing) return;

        const wmsOrder = await this.wmsOrderRepository.save(
            this.wmsOrderRepository.create({ orderNo, type, status: 'pending', wmsAssignedId: wmsAssignedId ?? null }),
        );

        if (orderUuids?.length) {
            await this.linkOrdersToWmsOrder(wmsOrder.id, orderUuids);
        }
    }

    private async linkOrdersToWmsOrder(wmsOrderId: number, orderUuids: string[]): Promise<void> {
        const orders = await this.orderRepository.find({ where: { uuid: In(orderUuids) }, select: ['id', 'uuid'] });
        if (!orders.length) return;
        const links = orders.map(order =>
            this.wmsOrderLinkRepository.create({ wmsOrderId, orderId: order.id, orderUuid: order.uuid }),
        );
        await this.wmsOrderLinkRepository
            .createQueryBuilder()
            .insert()
            .into(JopWmsOrderLink)
            .values(links)
            .orIgnore()
            .execute();
    }

    // ISO8601 with timezone for deposeDate fields
    private deposeDate(): string {
        return new Date().toISOString().replace('Z', '+0000');
    }

    // JOP WMS only accepts CM or FT — normalize everything else to CM
    private toCm(value: number, unit: string): number {
        switch (unit.toLowerCase()) {
            case 'm':  return value * 100;
            case 'in': return value * 2.54;
            default:   return value; // cm, ft handled as-is
        }
    }

    private normalizeDimensions(dimensions?: { length?: number; width?: number; height?: number; unit?: string }) {
        const unit = dimensions?.unit ?? DimensionsUnit.Centimeter;
        const wmsUnit = unit.toLowerCase() === 'ft' ? 'FT' : 'CM';
        return {
            lengthUnit: wmsUnit,
            length: this.toCm(dimensions?.length ?? 0, unit),
            width: this.toCm(dimensions?.width ?? 0, unit),
            height: this.toCm(dimensions?.height ?? 0, unit),
        };
    }

    // ─── Products ────────────────────────────────────────────────────────────

    async syncProduct(dto: SyncProductDto) {
        const variant = await this.variantRepository.findOne({
            where: { uuid: dto.variantUuid },
        });

        if (!variant) {
            throw new NotFoundException({ error: 'Product variant not found' });
        }

        this.logger.log(`Syncing variant ${variant.sku} to JOP WMS`);
        return this.syncVariantToWms(variant, dto.synchronizeType ?? 1);
    }

    private async syncVariantToWms(variant: ProductVariant, synchronizeType = 1): Promise<void> {
        await this.client.post('product/synchronize', {
            synchronizeType,
            sku: variant.sku,
            barcode: variant.sku,
            name: variant.titleEn || variant.titleAr,
            enName: variant.titleEn,
            weightUnit: (variant.weight?.unit ?? WeightUnit.Kilograms).toUpperCase(),
            weight: variant.weight?.amount ?? 0,
            ...this.normalizeDimensions(variant.dimensions),
            packingType: 0,
            declaredPrice: variant.cost?.amount ?? 0,
        });
    }

    async queryProducts(dto: QueryProductDto) {
        return this.client.post('product/query', {
            code: dto.code ?? '',
            barcode: dto.barcode ?? '',
            name: dto.name ?? '',
            enName: dto.enName ?? '',
            page: dto.page ?? 1,
        });
    }

    // ─── Inbound Orders ───────────────────────────────────────────────────────

    async createInboundOrder(dto: CreateInboundOrderDto) {
        this.logger.log(`WMS inbound: creating order ${dto.customerVoucherNo} (${dto.boxList?.length ?? 0} box(es))`);
        const result = await this.client.post('inboundorder/create', {
            warehouseCode: this.warehouseCode,
            customerVoucherNo: dto.customerVoucherNo,
            shipperMethod: dto.shipperMethod,
            shipperCompany: dto.shipperCompany ?? '',
            equipmentNumber: dto.equipmentNumber ?? '',
            waybillNo: dto.waybillNo ?? '',
            vat: dto.vat ?? '',
            vatInfo: dto.vatInfo ?? '',
            memo: dto.memo ?? '',
            boxList: dto.boxList,
        });
        const wmsAssignedId = String((result as any)?.data?.inboundOrderId ?? '');
        this.logger.log(`WMS inbound: order ${dto.customerVoucherNo} created — WMS ID ${wmsAssignedId || 'N/A'}`);
        await this.trackOrder(dto.customerVoucherNo, JopWmsOrderType.INBOUND, dto.sourceOrderUuids ?? [], wmsAssignedId || undefined);
        return result;
    }

    async getInboundOrderStatus(dto: InboundOrderStatusDto) {
        const payload: Record<string, unknown> = {};
        if (dto.inboundOrderId) payload.inboundOrderId = dto.inboundOrderId;
        else payload.customerVoucherNo = dto.customerVoucherNo;
        return this.client.post('inboundorder/status', payload);
    }

    async cancelInboundOrder(customerVoucherNo: string, dto: CancelOrderDto) {
        return this.client.post('inboundorder/depose', {
            customerVoucherNo,
            deposeMemo: dto.deposeMemo,
            deposeDate: this.deposeDate(),
        });
    }

    async getInboundOrderLabel(dto: GetInboundLabelDto) {
        const payload: Record<string, unknown> = { printType: dto.printType };
        if (dto.inboundOrderId) payload.inboundOrderId = dto.inboundOrderId;
        else if (dto.customerVoucherNo) payload.customerVoucherNo = dto.customerVoucherNo;
        else if (dto.waybillNo) payload.waybillNo = dto.waybillNo;
        return this.client.post('inboundorder/getOrderLabelUrl', payload);
    }

    // ─── Outbound Orders ──────────────────────────────────────────────────────

    async createOutboundOrder(dto: CreateOutboundOrderDto) {
        this.logger.log(`WMS outbound: creating order ${dto.customerVoucherNo} (${dto.productList?.length ?? 0} SKU(s))`);
        const result = await this.client.post('outboundorder/create', {
            warehouseCode: this.warehouseCode,
            customerVoucherNo: dto.customerVoucherNo,
            logisticsChannelCode: dto.logisticsChannelCode,
            orderSource: dto.orderSource ?? 4,
            ...(dto.waybillNo && { waybillNo: dto.waybillNo }),
            ...(dto.logisticsLabelInfo && { logisticsLabelInfo: dto.logisticsLabelInfo }),
            ...(dto.memo && { memo: dto.memo }),
            insurance: dto.insurance ?? 0,
            ...(dto.insuranceValue && { insuranceValue: dto.insuranceValue }),
            ...(dto.insuranceCurrency && { insuranceCurrency: dto.insuranceCurrency }),
            ...(dto.orderSaleSum && { orderSaleSum: dto.orderSaleSum }),
            ...(dto.orderSaleCurrency && { orderSaleCurrency: dto.orderSaleCurrency }),
            consignee: dto.consignee,
            productList: dto.productList,
        });
        const wmsAssignedId = String((result as any)?.data?.outboundOrderId ?? '');
        this.logger.log(`WMS outbound: order ${dto.customerVoucherNo} created — WMS ID ${wmsAssignedId || 'N/A'}`);
        await this.trackOrder(dto.customerVoucherNo, JopWmsOrderType.OUTBOUND, [], wmsAssignedId || undefined);
        return result;
    }

    async getOutboundOrderStatus(customerVoucherNo: string) {
        return this.client.post('outboundorder/status', { customerVoucherNo });
    }

    async cancelOutboundOrder(customerVoucherNo: string, dto: CancelOrderDto) {
        return this.client.post('outboundorder/depose', {
            customerVoucherNo,
            deposeMemo: dto.deposeMemo,
            deposeDate: this.deposeDate(),
        });
    }

    async estimateShipping(dto: EstimateShippingDto) {
        return this.client.post('outboundorder/getTransSum', {
            logisticsChannelCode: dto.logisticsChannelCode,
            addressType: dto.addressType ?? 1,
            consignee: dto.consignee,
            boxDetails: dto.boxDetails,
        });
    }

    // ─── Inventory ────────────────────────────────────────────────────────────

    async queryInventory(dto: QueryInventoryDto) {
        return this.client.post('inventory/query', {
            sku: dto.sku ?? '',
            warehouseCode: dto.warehouseCode ?? this.warehouseCode,
            inventoryType: dto.inventoryType ?? 0,
            page: dto.page ?? 1,
            limit: dto.limit ?? 10,
        });
    }

    // ─── Logistics ────────────────────────────────────────────────────────────

    async getLogisticsChannels(dto: GetLogisticsDto) {
        return this.client.post('logistics/getProduct', {
            warehouseCode: dto.warehouseCode,
        });
    }

    // ─── Waybill ──────────────────────────────────────────────────────────────

    async queryWaybill(customerVoucherNo: string) {
        return this.client.post('waybillNo/query', { customerVoucherNo });
    }

    // ─── Returns ──────────────────────────────────────────────────────────────

    async createReturnOrder(dto: CreateReturnOrderDto) {
        const result = await this.client.post('returnorder/create', {
            warehouseCode: this.warehouseCode,
            sourceNo: dto.sourceNo ?? '',
            original: dto.original,
            waybillNo: dto.waybillNo ?? '',
            reason: dto.reason ?? '',
            cargoList: dto.cargoList,
        });

        // Track by waybillNo if provided (the WMS return identifier), else sourceNo
        const trackingKey = dto.waybillNo || dto.sourceNo;
        if (trackingKey) {
            await this.trackOrder(trackingKey, JopWmsOrderType.RETURN);
        }
        return result;
    }

    async queryReturnOrder(dto: QueryReturnOrderDto) {
        return this.client.post('returnorder/query', {
            warehouseCode: dto.warehouseCode,
            waybillNo: dto.waybillNo,
        });
    }

    // ─── Dispatch ─────────────────────────────────────────────────────────────

    async dispatchApprovedOrders(dto: DispatchOrdersDto): Promise<{ jobId: string }> {
        if (dto.orderUuids?.length) {
            const linkedOrders = await this.orderRepository.find({
                where: { uuid: In(dto.orderUuids) },
                select: ['id', 'uuid'],
            });
            const linkedOrderIds = linkedOrders.map(o => o.id);

            const existingLinks = linkedOrderIds.length
                ? await this.wmsOrderLinkRepository
                    .createQueryBuilder('link')
                    .innerJoin('link.wmsOrder', 'wmsOrder', 'wmsOrder.type = :type', { type: JopWmsOrderType.INBOUND })
                    .where('link.orderId IN (:...orderIds)', { orderIds: linkedOrderIds })
                    .select(['link.orderId'])
                    .getMany()
                : [];

            if (existingLinks.length) {
                const dispatchedIds = new Set(existingLinks.map(l => l.orderId));
                const alreadyDispatched = linkedOrders
                    .filter(o => dispatchedIds.has(o.id))
                    .map(o => o.uuid);
                throw new BadRequestException({
                    message: 'Some orders have already been dispatched to WMS',
                    alreadyDispatched,
                });
            }
        }

        // ── Load eligible orders ───────────────────────────────────────────────
        const where: any = { status: OrderStatus.CONFIRMED, gulltransOrderSns: IsNull() };
        if (dto.orderUuids?.length) where.uuid = In(dto.orderUuids);

        const orders = await this.orderRepository.find({
            where,
            relations: ['orderItems', 'orderItems.variant', 'orderItems.variant.product'],
        });

        if (!orders.length) {
            this.logger.log('dispatchApprovedOrders: no eligible orders found');
            return { jobId: '' };
        }

        // ── Group items by shop ────────────────────────────────────────────────
        type ItemRef = { order: Order; item: OrderItem };
        const shopGroups = new Map<string, { shopName: string; items: ItemRef[] }>();

        for (const order of orders) {
            for (const item of order.orderItems) {
                const shopId = item.variant?.product?.shopId;
                if (!shopId) continue;
                if (!shopGroups.has(shopId)) {
                    shopGroups.set(shopId, { shopName: item.variant.product.shopName ?? '', items: [] });
                }
                shopGroups.get(shopId)!.items.push({ order, item });
            }
        }

        if (!shopGroups.size) {
            this.logger.warn('dispatchApprovedOrders: no items have Gulltrans shop data — import products from 1688 first');
            return { jobId: '' };
        }

        // ── Guard: reject if any variant is missing skuMeta ───────────────────
        const missingSkuMeta: Array<{ productId: string; sku: string; orderUuid: string }> = [];
        for (const { shopName: _s, items } of shopGroups.values()) {
            for (const { order, item } of items) {
                if (!item.variant?.skuMeta || Object.keys(item.variant.skuMeta).length === 0) {
                    missingSkuMeta.push({
                        productId: item.variant?.product?.uuid ?? item.variant?.product?.procurementId ?? 'unknown',
                        sku: item.variant?.sku ?? 'unknown',
                        orderUuid: order.uuid,
                    });
                }
            }
        }
        if (missingSkuMeta.length) {
            throw new BadRequestException({
                message: 'Cannot dispatch: some variants are missing skuMeta. Fix them and retry.',
                missingSkuMeta,
            });
        }

        // ── Load warehouse address (needed by Gulltrans) ───────────────────────
        const activeWarehouse = await this.warehouseRepository.findOne({ where: { isActive: true } });
        if (!activeWarehouse) throw new NotFoundException('No active warehouse found');

        const warehouseAddress = {
            receiver_name: activeWarehouse.contactName ?? '',
            phone: activeWarehouse.phone ?? '',
            address: [activeWarehouse.addressLine1, activeWarehouse.addressLine2].filter(Boolean).join(', '),
            city: activeWarehouse.city,
            province: activeWarehouse.state,
            postcode: activeWarehouse.postcode ?? '',
            company: activeWarehouse.name,
            country_name: activeWarehouse.country,
            country: { country_code: activeWarehouse.countryCode ?? '', name: activeWarehouse.country },
        };

        // ── Enqueue one BullMQ job per shop ───────────────────────────────────
        const dispatchJobId = crypto.randomUUID();

        for (const [shopId, { shopName, items }] of shopGroups) {
            const orderUuids = [...new Set(items.map(({ order }) => order.uuid))];
            const inboundVoucherNo = crypto.randomUUID().replace(/-/g, '');

            const gulltransItems = items.map(({ item }) => ({
                shop_id: shopId,
                shop_name: shopName,
                platform: '1688',
                platform_url: `https://detail.1688.com/offer/${item.variant.product.procurementId}.html`,
                name: item.variant.titleEn,
                goods_amount: String(item.variant.cost.amount * item.quantity),
                skus: [{
                    platform_sku: item.variant.sku,
                    price: String(item.variant.cost.amount),
                    quantity: String(item.quantity),
                    sku_info: item.variant.skuMeta ?? {},
                }],
            }));

            const seenSkus = new Set<string>();
            const variantSyncData = items.reduce<DispatchShopJobData['variantSyncData']>((acc, { item }) => {
                if (!seenSkus.has(item.variant.sku)) {
                    seenSkus.add(item.variant.sku);
                    acc.push({
                        synchronizeType: 1,
                        sku: item.variant.sku,
                        barcode: item.variant.sku,
                        name: item.variant.titleEn || item.variant.titleAr,
                        enName: item.variant.titleEn,
                        weightUnit: (item.variant.weight?.unit ?? WeightUnit.Kilograms).toUpperCase(),
                        weight: item.variant.weight?.amount ?? 0,
                        ...this.normalizeDimensions(item.variant.dimensions),
                        packingType: 0,
                        declaredPrice: item.variant.cost?.amount ?? 0,
                    });
                }
                return acc;
            }, []);

            let totalWeight = 0, maxLength = 0, maxWidth = 0, maxHeight = 0;
            const skuQtyMap = new Map<string, number>();

            for (const { item } of items) {
                totalWeight += (item.variant.weight?.amount ?? 0) * item.quantity;
                maxLength = Math.max(maxLength, item.variant.dimensions?.length ?? 0);
                maxWidth = Math.max(maxWidth, item.variant.dimensions?.width ?? 0);
                maxHeight = Math.max(maxHeight, item.variant.dimensions?.height ?? 0);
                skuQtyMap.set(item.variant.sku, (skuQtyMap.get(item.variant.sku) ?? 0) + item.quantity);
            }

            const jobData: DispatchShopJobData = {
                jobId: `${dispatchJobId}-${shopId}`,
                dispatchJobId,
                shopId,
                shopName,
                orderUuids,
                inboundVoucherNo,
                shipperMethod: dto.shipperMethod,
                shipperCompany: dto.shipperCompany,
                warehouseAddress,
                gulltransItems,
                variantSyncData,
                wmsBoxList: [{
                    boxNo: `BOX-${inboundVoucherNo.slice(0, 8).toUpperCase()}`,
                    serialNumber: 1,
                    length: maxLength || 1,
                    width: maxWidth || 1,
                    height: maxHeight || 1,
                    weight: totalWeight || 1,
                    productList: [...skuQtyMap.entries()].map(([sku, qty]) => ({ sku, qty })),
                }],
                createdAt: new Date(),
            };

            await this.dispatchQueue.add('dispatch-shop', jobData, {
                jobId: jobData.jobId,
                attempts: 5,
                backoff: { type: 'exponential', delay: 2 * 60 * 1000 },
                removeOnComplete: 100,
                removeOnFail: 200,
            });

            this.logger.log(`Dispatch ${dispatchJobId}: enqueued shop ${shopId} (${orderUuids.length} order(s))`);
        }

        this.logger.log(`Dispatch ${dispatchJobId}: ${shopGroups.size} shop job(s) queued`);
        return { jobId: dispatchJobId };
    }

    async createOutboundsForInbound(wmsOrder: JopWmsOrder): Promise<void> {
        const links = await this.wmsOrderLinkRepository.find({
            where: { wmsOrderId: wmsOrder.id },
            relations: ['order'],
        });

        if (!links.length) {
            this.logger.warn(`Skipping outbound creation for inbound ${wmsOrder.orderNo} — no linked source orders`);
            return;
        }

        const logisticsChannelCode = process.env.JOP_WMS_LOGISTICS_CHANNEL ?? '';

        const orderUuids = links.map(l => l.order.uuid);
        this.logger.log(`Creating outbounds for inbound ${wmsOrder.orderNo} — ${orderUuids.length} order(s)`);

        let firstError: any = null;

        for (const orderUuid of orderUuids) {
            const allInboundsForOrder = await this.wmsOrderRepository
                .createQueryBuilder('wmsOrder')
                .innerJoin('wmsOrder.sourceOrders', 'link')
                .innerJoin('link.order', 'order', 'order.uuid = :uuid', { uuid: orderUuid })
                .where('wmsOrder.type = :type', { type: JopWmsOrderType.INBOUND })
                .getMany();

            const pendingInbounds = allInboundsForOrder.filter(
                (o) => !(JOP_WMS_TERMINAL_STATUSES as readonly string[]).includes(o.status),
            );
            if (pendingInbounds.length > 0) {
                this.logger.log(
                    `Order ${orderUuid} — holding outbound, ${pendingInbounds.length} inbound(s) not yet terminal (${pendingInbounds.map((o) => o.orderNo).join(', ')})`,
                );
                continue;
            }

            const problemInbounds = allInboundsForOrder.filter(
                (o) => o.status !== JopWmsInboundStatus.STORED,
            );
            if (problemInbounds.length > 0) {
                this.logger.warn(
                    `Order ${orderUuid} — ${problemInbounds.length} inbound(s) ended without being stored: ${problemInbounds.map((o) => `${o.orderNo}(status:${o.status})`).join(', ')} — outbound will be created with available items only`,
                );
            }

            const order = await this.orderRepository.findOne({
                where: { uuid: orderUuid },
                relations: ['orderItems', 'orderItems.variant', 'shippingAddress'],
            });

            if (!order) {
                this.logger.warn(`Order ${orderUuid} not found — skipping outbound`);
                continue;
            }

            const customerVoucherNo = `${order.uuid.replace(/-/g, '').substring(0, 29)}out`;

            const existingOutbound = await this.wmsOrderRepository.findOne({
                where: { orderNo: customerVoucherNo, type: JopWmsOrderType.OUTBOUND },
            });
            if (existingOutbound) {
                this.logger.log(`Outbound ${customerVoucherNo} already tracked (status: ${existingOutbound.status}) — skipping`);
                continue;
            }

            // Check WMS before creating — outbound may already exist there but not locally
            try {
                const statusResult: any = await this.client.post('outboundorder/status', { customerVoucherNo });
                const jopStatus = String(statusResult?.data?.status ?? '');
                if (jopStatus) {
                    const synced = await this.wmsOrderRepository.save(
                        this.wmsOrderRepository.create({ orderNo: customerVoucherNo, type: JopWmsOrderType.OUTBOUND, status: jopStatus }),
                    );
                    await this.linkOrdersToWmsOrder(synced.id, [order.uuid]);
                    this.logger.log(`Synced existing WMS outbound ${customerVoucherNo} at status ${jopStatus}`);
                    continue;
                }
            } catch {
                this.logger.log(`Outbound ${customerVoucherNo} does not exist on WMS — proceeding with creation`);
            }

            const addr = order.shippingAddress;

            try {
                const result: any = await this.createOutboundOrder({
                    customerVoucherNo,
                    logisticsChannelCode,
                    consignee: {
                        name: addr.fullName,
                        country: addr.country,
                        province: addr.state,
                        city: addr.city,
                        address: addr.streetAddress,
                        postcode: addr.zipCode,
                        phone: addr.phoneNumber.replace(/^\+/, ''),
                    },
                    productList: order.orderItems.map(item => ({
                        sku: item.variant.sku,
                        qty: item.quantity,
                    })),
                });

                const outbound = await this.wmsOrderRepository.findOne({
                    where: { orderNo: customerVoucherNo, type: JopWmsOrderType.OUTBOUND },
                });
                if (outbound) {
                    await this.linkOrdersToWmsOrder(outbound.id, [order.uuid]);

                    // If JOP WMS accepted the create but returned a non-zero code (e.g. waybill
                    // assignment failed internally), trackOrder saved status='pending' but the real
                    // status on JOP WMS may already be 12. Probe immediately so the DB is accurate
                    // and the next retry can act on it without waiting for a scheduler poll.
                    if (result?.code !== 0) {
                        try {
                            const statusResult: any = await this.client.post('outboundorder/status', { customerVoucherNo });
                            const realStatus = String(statusResult?.data?.status ?? '');
                            if (realStatus && realStatus !== outbound.status) {
                                await this.wmsOrderRepository.update(outbound.id, { status: realStatus });
                                this.logger.log(`Outbound ${customerVoucherNo} status synced to ${realStatus} immediately after creation`);
                            }
                        } catch {
                            // Non-critical — scheduler will catch up on next poll
                        }
                    }
                }

                this.logger.log(`Outbound created for order ${order.uuid} → ${customerVoucherNo}`);
            } catch (err: any) {
                const errDetail = err?.message || (typeof err?.getResponse === 'function' ? JSON.stringify(err.getResponse()) : String(err));
                this.logger.error(`Outbound creation failed for order ${order.uuid} — ${errDetail}`);

                // JOP WMS sometimes creates the order internally before returning an error
                // (e.g. status 12 when waybill assignment fails). If that happened, track it
                // so the scheduler polls it instead of blind-retrying a duplicate create.
                try {
                    const statusResult: any = await this.client.post('outboundorder/status', { customerVoucherNo });
                    const jopStatus = String(statusResult?.data?.status ?? '');
                    if (jopStatus) {
                        const saved = await this.wmsOrderRepository.save(
                            this.wmsOrderRepository.create({ orderNo: customerVoucherNo, type: JopWmsOrderType.OUTBOUND, status: jopStatus }),
                        );
                        await this.linkOrdersToWmsOrder(saved.id, [order.uuid]);
                        this.logger.log(`Tracked orphaned JOP WMS outbound ${customerVoucherNo} at status ${jopStatus}`);
                    }
                } catch {
                    // Outbound doesn't exist on JOP WMS either — original error stands
                }

                if (!firstError) firstError = err;
            }
        }

        if (firstError) throw firstError;
    }

    async retryOutboundForOrder(orderUuid: string): Promise<{ success: boolean; message?: string; error?: string }> {
        const allInbounds = await this.wmsOrderRepository
            .createQueryBuilder('w')
            .innerJoin('w.sourceOrders', 'link')
            .innerJoin('link.order', 'order', 'order.uuid = :uuid', { uuid: orderUuid })
            .where('w.type = :type', { type: JopWmsOrderType.INBOUND })
            .getMany();

        if (!allInbounds.length) {
            throw new NotFoundException({ error: 'No inbound orders found for this order' });
        }

        const pendingInbounds = allInbounds.filter(
            i => !(JOP_WMS_TERMINAL_STATUSES as readonly string[]).includes(i.status),
        );
        if (pendingInbounds.length > 0) {
            throw new BadRequestException({
                error: `Cannot create outbound — ${pendingInbounds.length} inbound(s) not yet stored: ${pendingInbounds.map(i => `${i.orderNo}(status:${i.status})`).join(', ')}`,
            });
        }

        const storedInbound = allInbounds.find(i => i.status === JopWmsInboundStatus.STORED);
        if (!storedInbound) {
            throw new NotFoundException({ error: 'No stored inbound found for this order' });
        }

        const order = await this.orderRepository.findOne({
            where: { uuid: orderUuid },
            relations: ['orderItems', 'orderItems.variant', 'shippingAddress'],
        });
        if (!order) throw new NotFoundException({ error: 'Order not found' });

        const customerVoucherNo = `${orderUuid.replace(/-/g, '').substring(0, 29)}out`;
        const logisticsChannelCode = process.env.JOP_WMS_LOGISTICS_CHANNEL ?? '';
        const addr = order.shippingAddress;

        // Find or prepare the outbound record — patch in place so history is preserved.
        // JOP WMS automatically discards the previous order when we re-submit with the same customerVoucherNo.
        let outboundRecord = await this.wmsOrderRepository.findOne({
            where: { orderNo: customerVoucherNo, type: JopWmsOrderType.OUTBOUND },
        });

        try {
            const result: any = await this.createOutboundOrder({
                customerVoucherNo,
                logisticsChannelCode,
                consignee: {
                    name: addr.fullName,
                    country: addr.country,
                    province: addr.state,
                    city: addr.city,
                    address: addr.streetAddress,
                    postcode: addr.zipCode,
                    phone: addr.phoneNumber.replace(/^\+/, ''),
                },
                productList: order.orderItems.map(item => ({
                    sku: item.variant.sku,
                    qty: item.quantity,
                })),
            });

            // Probe real status when JOP WMS accepted but returned a non-zero code
            let newStatus = 'pending';
            if (result?.code !== 0) {
                try {
                    const statusResult: any = await this.client.post('outboundorder/status', { customerVoucherNo });
                    newStatus = String(statusResult?.data?.status ?? 'pending');
                } catch { /* scheduler will catch up */ }
            }

            if (outboundRecord) {
                this.logger.log(`retryOutbound: patching existing record ${customerVoucherNo} → status ${newStatus}`);
                await this.wmsOrderRepository.update(outboundRecord.id, {
                    status: newStatus,
                    errorCount: 0,
                    lastError: null,
                    waybillNo: null,
                    lastPolledAt: new Date(),
                });
            } else {
                outboundRecord = await this.wmsOrderRepository.save(
                    this.wmsOrderRepository.create({ orderNo: customerVoucherNo, type: JopWmsOrderType.OUTBOUND, status: newStatus }),
                );
                await this.linkOrdersToWmsOrder(outboundRecord.id, [orderUuid]);
            }

            return { success: true, message: 'Outbound created successfully' };
        } catch (err: any) {
            const detail = err?.message || (typeof err?.getResponse === 'function' ? JSON.stringify(err.getResponse()) : String(err));
            this.logger.error(`retryOutbound failed for ${customerVoucherNo}: ${detail}`);
            return { success: false, error: detail };
        }
    }

    async retryOutboundForInbound(orderNo: string): Promise<{ message: string }> {
        const inbound = await this.wmsOrderRepository.findOne({
            where: { orderNo, type: JopWmsOrderType.INBOUND },
            relations: ['sourceOrders'],
        });

        if (!inbound) {
            throw new NotFoundException({ error: `Inbound order ${orderNo} not found` });
        }

        await this.createOutboundsForInbound(inbound);
        return { message: `Outbound creation triggered for inbound ${orderNo}` };
    }

    async dispatchMissingItems(orderUuid: string): Promise<{
        found: number;
        retried: number;
        shopIds: string[];
        message?: string;
    }> {
        const candidateJobs = await this.dispatchQueue.getJobs(['failed', 'delayed']);
        const matchingJobs = candidateJobs.filter(
            j => Array.isArray((j.data as DispatchShopJobData).orderUuids)
                && (j.data as DispatchShopJobData).orderUuids.includes(orderUuid),
        );

        if (!matchingJobs.length) {
            return {
                found: 0,
                retried: 0,
                shopIds: [],
                message: 'No failed or delayed dispatch jobs found for this order. If the job was removed from the queue, use POST /v1/wms/orders/dispatch with the specific orderUuid.',
            };
        }

        const retriedShopIds: string[] = [];

        for (const job of matchingJobs) {
            const data = job.data as DispatchShopJobData;
            const { shopId, shopName } = data;

            // Only rebuild Gulltrans payload if Gulltrans hasn't been called yet for this job.
            // If gulltransOrderSn is set, Gulltrans already succeeded — the failure was at the
            // WMS inbound step, so we just retry without touching gulltransItems.
            if (!data.gulltransOrderSn) {
                // Load ALL orders in this job — a single shop job can cover multiple order UUIDs,
                // so filtering by only the requested orderUuid would drop the others' items.
                const jobOrders = await this.orderRepository.find({
                    where: { uuid: In(data.orderUuids) },
                    relations: ['orderItems', 'orderItems.variant', 'orderItems.variant.product'],
                });

                const shopItems = jobOrders.flatMap(o =>
                    o.orderItems.filter(item => item.variant?.product?.shopId === shopId),
                );

                if (!shopItems.length) {
                    this.logger.warn(`dispatchMissing ${orderUuid}: no items for shop ${shopId} — skipping`);
                    continue;
                }

                const freshGulltransItems = shopItems.map(item => ({
                    shop_id: shopId,
                    shop_name: shopName,
                    platform: '1688',
                    platform_url: `https://detail.1688.com/offer/${item.variant.product.procurementId}.html`,
                    name: item.variant.titleEn,
                    goods_amount: String(item.variant.cost.amount * item.quantity),
                    skus: [{
                        platform_sku: item.variant.sku,
                        price: String(item.variant.cost.amount),
                        quantity: String(item.quantity),
                        sku_info: item.variant.skuMeta ?? {},
                    }],
                }));

                await job.updateData({ ...data, gulltransItems: freshGulltransItems });
                this.logger.log(`dispatchMissing ${orderUuid}: refreshed gulltransItems for shop ${shopId} (${jobOrders.length} order(s))`);
            }

            const state = await job.getState();
            if (state === 'failed') {
                await job.retry();
            } else if (state === 'delayed') {
                await job.promote();
            }

            retriedShopIds.push(shopId);
            this.logger.log(`dispatchMissing ${orderUuid}: re-queued shop ${shopId} (was ${state})`);
        }

        return { found: matchingJobs.length, retried: retriedShopIds.length, shopIds: retriedShopIds };
    }

    // ─── Recovery ─────────────────────────────────────────────────────────────

    async recoverInbound(orderNo: string, dto: RecoverInboundDto): Promise<{ gulltransOrders: any[]; linkedOrderUuids: string[] }> {
        const inbound = await this.wmsOrderRepository.findOne({
            where: { orderNo },
            relations: ['sourceOrders'],
        });
        if (!inbound) throw new NotFoundException(`WMS inbound not found: ${orderNo}`);

        if (inbound.sourceOrders?.length) {
            throw new BadRequestException({
                message: 'Inbound already has links — recovery not needed',
                linkedOrderUuids: inbound.sourceOrders.map(l => l.orderUuid),
            });
        }

        const orders = await this.orderRepository.find({
            where: { uuid: In(dto.orderUuids) },
            relations: ['orderItems', 'orderItems.variant', 'orderItems.variant.product'],
        });

        if (!orders.length) throw new NotFoundException('None of the provided order UUIDs were found');

        const missing = dto.orderUuids.filter(u => !orders.find(o => o.uuid === u));
        if (missing.length) this.logger.warn(`recoverInbound: UUIDs not found in DB — ${missing.join(', ')}`);

        // Group items by shop (same logic as dispatchApprovedOrders)
        type ItemRef = { order: Order; item: OrderItem };
        const shopGroups = new Map<string, { shopName: string; items: ItemRef[] }>();

        for (const order of orders) {
            for (const item of order.orderItems) {
                const shopId = item.variant?.product?.shopId;
                if (!shopId) continue;
                if (!shopGroups.has(shopId)) {
                    shopGroups.set(shopId, { shopName: item.variant.product.shopName ?? '', items: [] });
                }
                shopGroups.get(shopId)!.items.push({ order, item });
            }
        }

        if (!shopGroups.size) throw new BadRequestException('No order items have Gulltrans shop data');

        const activeWarehouse = await this.warehouseRepository.findOne({ where: { isActive: true } });
        if (!activeWarehouse) throw new NotFoundException('No active warehouse found');

        const warehouseAddress: OrderAddressDto = {
            receiver_name: activeWarehouse.contactName ?? '',
            phone: activeWarehouse.phone ?? '',
            address: [activeWarehouse.addressLine1, activeWarehouse.addressLine2].filter(Boolean).join(', '),
            city: activeWarehouse.city,
            province: activeWarehouse.state,
            postcode: activeWarehouse.postcode ?? '',
            company: activeWarehouse.name,
            country_name: activeWarehouse.country,
            country: { country_code: activeWarehouse.countryCode ?? '', name: activeWarehouse.country },
        };

        const gulltransOrders: any[] = [];

        for (const [shopId, { shopName, items }] of shopGroups) {
            const gulltransItems = items.map(({ item }) => ({
                shop_id: shopId,
                shop_name: shopName,
                platform: '1688',
                platform_url: `https://detail.1688.com/offer/${item.variant.product.procurementId}.html`,
                name: item.variant.titleEn,
                goods_amount: String(item.variant.cost.amount * item.quantity),
                freight_fee: '0',
                skus: [{
                    platform_sku: item.variant.sku,
                    price: String(item.variant.cost.amount),
                    quantity: String(item.quantity),
                    sku_info: item.variant.skuMeta ?? {},
                }],
            }));

            const result = await this.procurementService.bulkCreateOrder({
                orders: gulltransItems,
                address: warehouseAddress,
            });

            const shopResult = result.success.find(s => String(s.shopId) === String(shopId));
            if (!shopResult) {
                const failure = result.failed.find(f => String(f.shopId) === String(shopId));
                throw new BadRequestException(`Gulltrans failed for shop ${shopId}: ${failure?.reason ?? 'no success entry returned'}`);
            }

            this.logger.log(`recoverInbound ${orderNo}: Gulltrans order ${shopResult.orderSn} created for shop ${shopId}`);
            gulltransOrders.push({ shopId, orderSn: shopResult.orderSn, raw: shopResult.raw });

            // Write gulltrans_order_sns to each order
            for (const order of orders) {
                await this.orderRepository.query(
                    `UPDATE orders SET gulltrans_order_sns = array_append(COALESCE(gulltrans_order_sns, '{}'), $1) WHERE uuid = $2`,
                    [shopResult.orderSn, order.uuid],
                );
            }
        }

        // Create links to the existing inbound
        await this.linkOrdersToWmsOrder(inbound.id, dto.orderUuids);

        // Patch gulltransResponse on the inbound with the first shop's raw response
        const firstRaw = gulltransOrders[0]?.raw ?? null;
        await this.wmsOrderRepository.update(inbound.id, { gulltransResponse: firstRaw });

        const linkedOrderUuids = orders.map(o => o.uuid);
        this.logger.log(`recoverInbound ${orderNo}: linked ${linkedOrderUuids.length} order(s), ${gulltransOrders.length} Gulltrans order(s) created`);

        return { gulltransOrders, linkedOrderUuids };
    }

    // ─── Recovery helpers ─────────────────────────────────────────────────────

    async getUnlinkedOrders(before?: string) {
        const query = this.orderRepository
            .createQueryBuilder('order')
            .where('order.status = :status', { status: OrderStatus.CONFIRMED })
            .andWhere(`(order.gulltrans_order_sns IS NULL OR order.gulltrans_order_sns = '{}')`)
            .select(['order.uuid', 'order.status', 'order.createdAt'])
            .orderBy('order.createdAt', 'DESC');

        if (before) {
            query.andWhere('order.createdAt <= :before', { before });
        }

        return query.getMany();
    }

    // ─── Order Links ──────────────────────────────────────────────────────────

    async getOrderLinks() {
        return this.wmsOrderLinkRepository.find({ order: { id: 'ASC' } });
    }

    // ─── Tracked Orders (polling state) ──────────────────────────────────────

    async getTrackedOrders(type?: JopWmsOrderType) {
        const orders = await this.wmsOrderRepository.find({
            where: type ? { type } : {},
            relations: ['sourceOrders'],
            order: { createdAt: 'DESC' },
        });
        return orders.map(order => ({
            ...order,
            linkedOrderUuids: order.sourceOrders.map(l => l.orderUuid),
            sourceOrders: undefined,
        }));
    }
}

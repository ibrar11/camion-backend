import * as crypto from 'node:crypto';

import {
    BadRequestException,
    Injectable,
    Logger,
    NotFoundException,
} from '@nestjs/common';

import { InjectRepository } from '@nestjs/typeorm';
import { In, IsNull, Repository } from 'typeorm';

import { ProductVariant } from '../inventory/entities/product-variant.entity';
import { Warehouse } from '../inventory/entities/warehouse.entity';
import { WeightUnit } from '../inventory/enums/WeightUnit.enum';
import { DimensionsUnit } from '../inventory/enums/DimensionsUnit.enum';

import { Order } from '../order/entities/order.entity';
import { OrderItem } from '../order/entities/order-item.entity';
import { OrderStatus } from '../order/enums/OrderStatus';

import { Product } from '../inventory/entities/product.entity';

import { ProcurementService } from '../procurement/procurement.service';

import { JopWmsClient } from './jop-wms.client';
import { JopWmsOrder, JopWmsOrderType } from './entities/jop-wms-order.entity';

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
        @InjectRepository(OrderItem)
        private readonly orderItemRepository: Repository<OrderItem>,
        @InjectRepository(Product)
        private readonly productRepository: Repository<Product>,
        @InjectRepository(Warehouse)
        private readonly warehouseRepository: Repository<Warehouse>,
        private readonly client: JopWmsClient,
        private readonly procurementService: ProcurementService,
    ) { }

    private async trackOrder(orderNo: string, type: JopWmsOrderType) {
        const existing = await this.wmsOrderRepository.findOne({ where: { orderNo } });
        if (existing) return;
        await this.wmsOrderRepository.save(
            this.wmsOrderRepository.create({ orderNo, type, status: 'pending' }),
        );
    }

    // ISO8601 with timezone for deposeDate fields
    private deposeDate(): string {
        return new Date().toISOString().replace('Z', '+0000');
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
            name: variant.titleAr || variant.titleEn,
            enName: variant.titleEn,
            weightUnit: (variant.weight?.unit ?? WeightUnit.Kilograms).toUpperCase(),
            weight: variant.weight?.amount ?? 0,
            lengthUnit: (variant.dimensions?.unit ?? DimensionsUnit.Centimeter).toUpperCase(),
            length: variant.dimensions?.length ?? 0,
            width: variant.dimensions?.width ?? 0,
            height: variant.dimensions?.height ?? 0,
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
        await this.trackOrder(dto.customerVoucherNo, JopWmsOrderType.INBOUND);
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
        const result = await this.client.post('outboundorder/create', {
            warehouseCode: this.warehouseCode,
            customerVoucherNo: dto.customerVoucherNo,
            logisticsChannelCode: dto.logisticsChannelCode,
            orderSource: dto.orderSource ?? 4,
            waybillNo: dto.waybillNo ?? '',
            logisticsLabelInfo: dto.logisticsLabelInfo ?? '',
            memo: dto.memo ?? '',
            insurance: dto.insurance ?? 0,
            insuranceValue: dto.insuranceValue ?? 0,
            insuranceCurrency: dto.insuranceCurrency ?? '',
            orderSaleSum: dto.orderSaleSum ?? 0,
            orderSaleCurrency: dto.orderSaleCurrency ?? '',
            consignee: dto.consignee,
            productList: dto.productList,
        });
        await this.trackOrder(dto.customerVoucherNo, JopWmsOrderType.OUTBOUND);
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
            const existingInbounds = await this.wmsOrderRepository.find({
                where: { type: JopWmsOrderType.INBOUND },
                select: ['orderNo', 'sourceOrderUuids'],
            });

            const alreadyDispatched = dto.orderUuids.filter(uuid =>
                existingInbounds.some(w => w.sourceOrderUuids?.split(',').includes(uuid))
            );

            if (alreadyDispatched.length) {
                throw new BadRequestException({
                    message: 'Some orders have already been dispatched to WMS',
                    alreadyDispatched,
                });
            }
        }

        const jobId = crypto.randomUUID();
        setImmediate(() =>
            this.runDispatch(jobId, dto).catch(err =>
                this.logger.error(`Dispatch job ${jobId} crashed: ${err?.message}`)
            )
        );
        return { jobId };
    }

    private async runDispatch(jobId: string, dto: DispatchOrdersDto): Promise<void> {
        this.logger.log(`Dispatch job ${jobId} started`);

        const where: any = { status: OrderStatus.CONFIRMED, gulltransOrderId: IsNull() };
        if (dto.orderUuids?.length) {
            where.uuid = In(dto.orderUuids);
        }

        const orders = await this.orderRepository.find({
            where,
            relations: ['orderItems', 'orderItems.variant', 'orderItems.variant.product', 'shippingAddress'],
        });

        if (!orders.length) {
            this.logger.log(`Dispatch job ${jobId}: no eligible orders found`);
            return;
        }

        this.logger.log(`Dispatch job ${jobId}: processing ${orders.length} order(s)`);

        // ── Step 1: group all items across all orders by shop_id ──────────────
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
            this.logger.warn(`Dispatch job ${jobId}: no items have Gulltrans shop data — import products from 1688 first`);
            return;
        }

        // ── Step 2: build one Gulltrans payload entry per item (bulkCreateOrder
        //            groups by shop_id internally) ───────────────────────────────
        const gulltransOrders: any[] = [];
        for (const [shopId, { shopName, items }] of shopGroups) {
            for (const { item } of items) {
                gulltransOrders.push({
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
                });
            }
        }

        // ── Step 3: single Gulltrans API call ────────────────────────────────
        const activeWarehouse = await this.warehouseRepository.findOne({ where: { isActive: true } });
        if (!activeWarehouse) {
            throw new NotFoundException('No active warehouse found');
        }

        const address = [activeWarehouse.addressLine1, activeWarehouse.addressLine2]
            .filter(Boolean).join(', ');

        const warehouseAddress: any = {
            receiver_name: activeWarehouse.contactName ?? '',
            phone: activeWarehouse.phone ?? '',
            address,
            city: activeWarehouse.city,
            province: activeWarehouse.state,
            postcode: activeWarehouse.postcode ?? '',
            company: activeWarehouse.name,
            country_name: activeWarehouse.country,
            country: {
                country_code: activeWarehouse.countryCode ?? '',
                name: activeWarehouse.country,
            },
        };

        const gulltransResult = await this.procurementService.bulkCreateOrder({
            orders: gulltransOrders,
            address: warehouseAddress,
        });

        this.logger.log(`Dispatch job ${jobId}: Gulltrans — ${gulltransResult.success.length} shop order(s) created, ${gulltransResult.failed.length} failed`);
        for (const f of gulltransResult.failed) {
            this.logger.error(`Dispatch job ${jobId}: Gulltrans order failed for shop ${f.shopId}: ${f.reason}`);
        }

        // ── Step 4: map Gulltrans order IDs back to customer orders ───────────
        // Build: shopId → gulltransOrderId
        const shopOrderId = new Map<string, string>();
        for (const s of gulltransResult.success) {
            if (s.shopId && s.orderId != null) {
                shopOrderId.set(s.shopId, String(s.orderId));
            } else {
                this.logger.warn(`Dispatch job ${jobId}: Gulltrans success entry missing shopId or orderId — ${JSON.stringify(s)}`);
            }
        }

        // For each customer order, collect all Gulltrans IDs from its shops
        const orderGulltransIds = new Map<string, Set<string>>();
        for (const [shopId, { items }] of shopGroups) {
            const gulltransOrderId = shopOrderId.get(shopId);
            if (!gulltransOrderId) continue;
            for (const { order } of items) {
                if (!orderGulltransIds.has(order.uuid)) {
                    orderGulltransIds.set(order.uuid, new Set());
                }
                orderGulltransIds.get(order.uuid)!.add(gulltransOrderId);
            }
        }

        // ── Step 5: persist gulltransOrderId on each customer order ─────────
        for (const order of orders) {
            const ids = orderGulltransIds.get(order.uuid);
            if (!ids?.size) {
                this.logger.warn(`Dispatch job ${jobId}: order ${order.uuid} had no successful Gulltrans shop`);
                continue;
            }
            await this.orderRepository.update(
                { uuid: order.uuid },
                { gulltransOrderId: [...ids].join(',') },
            );
        }

        // ── Step 6: one WMS inbound per shop group ────────────────────────────
        for (const [shopId, { items }] of shopGroups) {
            if (!shopOrderId.has(shopId)) continue;

            const inboundVoucherNo = crypto.randomUUID().replace(/-/g, '');
            const orderUuids = [...new Set(items.map(({ order }) => order.uuid))];

            let totalWeight = 0;
            let maxLength = 0, maxWidth = 0, maxHeight = 0;
            const skuQtyMap = new Map<string, number>();

            for (const { item } of items) {
                totalWeight += (item.variant.weight?.amount ?? 0) * item.quantity;
                maxLength = Math.max(maxLength, item.variant.dimensions?.length ?? 0);
                maxWidth = Math.max(maxWidth, item.variant.dimensions?.width ?? 0);
                maxHeight = Math.max(maxHeight, item.variant.dimensions?.height ?? 0);
                skuQtyMap.set(item.variant.sku, (skuQtyMap.get(item.variant.sku) ?? 0) + item.quantity);
            }

            const productList = [...skuQtyMap.entries()].map(([sku, qty]) => ({ sku, qty }));

            try {
                // Sync all unique variants to WMS before creating the inbound
                const uniqueVariants = new Map<string, ProductVariant>();
                for (const { item } of items) {
                    if (!uniqueVariants.has(item.variant.sku)) {
                        uniqueVariants.set(item.variant.sku, item.variant);
                    }
                }
                for (const variant of uniqueVariants.values()) {
                    try {
                        await this.syncVariantToWms(variant);
                    } catch (err: any) {
                        this.logger.warn(`Dispatch job ${jobId}: variant sync failed for ${variant.sku} — ${err?.message}`);
                    }
                }

                await this.createInboundOrder({
                    customerVoucherNo: inboundVoucherNo,
                    shipperMethod: dto.shipperMethod,
                    shipperCompany: dto.shipperCompany,
                    boxList: [{
                        boxNo: `BOX-${inboundVoucherNo.slice(0, 8).toUpperCase()}`,
                        serialNumber: 1,
                        length: maxLength || 1,
                        width: maxWidth || 1,
                        height: maxHeight || 1,
                        weight: totalWeight || 1,
                        productList,
                    }],
                });

                await this.wmsOrderRepository.update(
                    { orderNo: inboundVoucherNo, type: JopWmsOrderType.INBOUND },
                    { sourceOrderUuids: orderUuids.join(',') },
                );

                this.logger.log(`Dispatch job ${jobId}: inbound ${inboundVoucherNo} created for shop ${shopId} covering ${orderUuids.length} order(s)`);
            } catch (err: any) {
                this.logger.error(`Dispatch job ${jobId}: WMS inbound failed for shop ${shopId} — ${err?.message}`);
            }
        }

        this.logger.log(`Dispatch job ${jobId} complete`);
    }

    async createOutboundsForInbound(wmsOrder: JopWmsOrder): Promise<void> {
        if (!wmsOrder.sourceOrderUuids) {
            this.logger.warn(`Skipping outbound creation for inbound ${wmsOrder.orderNo} — no sourceOrderUuids`);
            return;
        }

        const logisticsChannelCode = process.env.JOP_WMS_LOGISTICS_CHANNEL ?? '';
        if (!logisticsChannelCode) {
            this.logger.warn(`JOP_WMS_LOGISTICS_CHANNEL not set — skipping outbounds for inbound ${wmsOrder.orderNo}`);
            return;
        }

        const orderUuids = wmsOrder.sourceOrderUuids.split(',').filter(Boolean);
        this.logger.log(`Creating outbounds for inbound ${wmsOrder.orderNo} — ${orderUuids.length} order(s)`);

        for (const orderUuid of orderUuids) {
            const order = await this.orderRepository.findOne({
                where: { uuid: orderUuid },
                relations: ['orderItems', 'orderItems.variant', 'shippingAddress'],
            });

            if (!order) {
                this.logger.warn(`Order ${orderUuid} not found — skipping outbound`);
                continue;
            }

            const customerVoucherNo = `${order.uuid}-out`;
            const addr = order.shippingAddress;

            try {
                await this.createOutboundOrder({
                    customerVoucherNo,
                    logisticsChannelCode,
                    consignee: {
                        name: addr.fullName,
                        country: addr.country,
                        province: addr.state,
                        city: addr.city,
                        address: addr.streetAddress,
                        postcode: addr.zipCode,
                        phone: addr.phoneNumber,
                    },
                    productList: order.orderItems.map(item => ({
                        sku: item.variant.sku,
                        qty: item.quantity,
                    })),
                });

                await this.wmsOrderRepository.update(
                    { orderNo: customerVoucherNo, type: JopWmsOrderType.OUTBOUND },
                    { sourceOrderUuids: order.uuid },
                );

                this.logger.log(`Outbound created for order ${order.uuid} → ${customerVoucherNo}`);
            } catch (err: any) {
                this.logger.error(`Outbound creation failed for order ${order.uuid} — ${err?.message}`);
            }
        }
    }

    // ─── Tracked Orders (polling state) ──────────────────────────────────────

    getTrackedOrders(type?: JopWmsOrderType) {
        return this.wmsOrderRepository.find({
            where: type ? { type } : {},
            order: { createdAt: 'DESC' },
        });
    }
}

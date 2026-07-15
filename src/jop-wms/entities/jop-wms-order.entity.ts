import {
    Column,
    CreateDateColumn,
    Entity,
    Index,
    OneToMany,
    PrimaryGeneratedColumn,
    UpdateDateColumn,
} from 'typeorm';

import { JopWmsOrderLink } from './jop-wms-order-link.entity';

export enum JopWmsOrderType {
    INBOUND = 'inbound',
    OUTBOUND = 'outbound',
    RETURN = 'return',
}

// JOP API returns numeric status codes as strings after String() cast
export const JopWmsInboundStatus = {
    STORED: '14',           // Goods fully received and shelved
    WAREHOUSE_CLOSED: '15', // Warehouse session closed
    DELETED: '16',          // Order deleted
} as const;

export const JopWmsOutboundStatus = {
    PROCESSING_FAILED: '12', // JOP WMS failed to process internally (e.g. waybill assignment)
    SHIPPED: '14',           // Order shipped to customer
    INVALIDATED: '15',       // Order invalidated
} as const;

export const JopWmsReturnStatus = {
    SHELVED: '40',          // Return goods shelved
} as const;

// Hiobuy flow only: placeholder inbound created before the real WMS inbound order
// exists — waiting on /logistics/trace to return a real freight tracking number.
// Deliberately excluded from JOP_WMS_TERMINAL_STATUSES so createOutboundsForInbound's
// "hold until all inbounds terminal" check naturally waits for it.
export const JOP_WMS_AWAITING_TRACKING_STATUS = 'awaiting_tracking';

export const JOP_WMS_TERMINAL_STATUSES = [
    JopWmsInboundStatus.STORED,
    JopWmsInboundStatus.WAREHOUSE_CLOSED,
    JopWmsInboundStatus.DELETED,
    JopWmsOutboundStatus.INVALIDATED,
    JopWmsReturnStatus.SHELVED,
] as const;

@Entity({ name: 'jop_wms_orders' })
export class JopWmsOrder {
    @PrimaryGeneratedColumn()
    id: number;

    @Column({ type: 'varchar', length: 64, unique: true })
    @Index()
    orderNo: string;

    @Column({ type: 'enum', enum: JopWmsOrderType })
    type: JopWmsOrderType;

    @Column({ type: 'varchar', length: 64, default: 'pending' })
    @Index()
    status: string;

    // WMS-assigned order ID returned on creation (inboundOrderId / outboundOrderId)
    @Column({ type: 'varchar', length: 64, nullable: true, default: null })
    wmsAssignedId: string | null;

    // Outbound: WMS-assigned waybill. Inbound (Hiobuy flow): the real 1688 courier
    // freight tracking number from Hiobuy's logistics/trace, mirrored here for
    // admin visibility (never pushed back to WMS beyond the initial create call).
    @Column({ type: 'varchar', length: 128, nullable: true })
    waybillNo: string | null;

    // Hiobuy flow only: admin-supplied dispatch params, persisted here because they
    // must survive until the trace poller actually creates the WMS inbound order,
    // which may happen days after the placeholder row is created.
    @Column({ type: 'integer', nullable: true })
    hiobuyShipperMethod: number | null;

    @Column({ type: 'varchar', nullable: true })
    hiobuyShipperCompany: string | null;

    // Hiobuy flow only: the 1688 shop this inbound's items were sourced from (dispatch
    // is shop-batched — 1688 rejects orders mixing sellers). Lets the trace poller
    // rebuild the box list scoped to only this shop's items when a linked order has
    // items from multiple shops (and therefore multiple inbounds).
    @Column({ type: 'varchar', nullable: true })
    hiobuyShopId: string | null;

    // Hiobuy flow only: the order id returned by POST /v1/orders/create for this
    // shop batch. Stored directly here (not derived from orders.gulltrans_order_sns)
    // because an order can belong to multiple shop batches, each with its own id.
    @Column({ type: 'varchar', nullable: true })
    hiobuyOrderId: string | null;

    @Column({ type: 'timestamptz', nullable: true })
    lastPolledAt: Date | null;

    @OneToMany(() => JopWmsOrderLink, (link) => link.wmsOrder)
    sourceOrders: JopWmsOrderLink[];

    // Full Gulltrans API response payload stored on inbound order creation
    @Column({ type: 'jsonb', nullable: true, default: null })
    gulltransResponse: Record<string, any> | null;

    // Incremented on consecutive errors; used for exponential-backoff decisions
    @Column({ type: 'integer', default: 0 })
    errorCount: number;

    // Last error message from a failed poll; cleared on the next successful poll
    @Column({ type: 'text', nullable: true, default: null })
    lastError: string | null;

    @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
    createdAt: Date;

    @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
    updatedAt: Date;
}

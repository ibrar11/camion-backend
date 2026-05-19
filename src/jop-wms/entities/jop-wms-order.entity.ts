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
    SHIPPED: '14',          // Order shipped to customer
    INVALIDATED: '15',      // Order invalidated
} as const;

export const JopWmsReturnStatus = {
    SHELVED: '40',          // Return goods shelved
} as const;

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

    // Populated once WMS provides a waybill (outbound only)
    @Column({ type: 'varchar', length: 128, nullable: true })
    waybillNo: string | null;

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

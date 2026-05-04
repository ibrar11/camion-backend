import {
    Column,
    CreateDateColumn,
    Entity,
    Index,
    PrimaryGeneratedColumn,
    UpdateDateColumn,
} from 'typeorm';

export enum JopWmsOrderType {
    INBOUND = 'inbound',
    OUTBOUND = 'outbound',
    RETURN = 'return',
}

// Terminal statuses per order type (JOP API returns numeric codes as strings after String() cast)
// Inbound:  14=Stored, 15=Warehouse closed, 16=Deleted
// Outbound: 14=Shipped, 15=Invalidated
// Return:   40=Shelved
export const JOP_WMS_TERMINAL_STATUSES = ['14', '15', '16', '40'] as const;

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

    // Populated once WMS provides a waybill (outbound only)
    @Column({ type: 'varchar', length: 128, nullable: true })
    waybillNo: string | null;

    @Column({ type: 'timestamptz', nullable: true })
    lastPolledAt: Date | null;

    // Comma-separated Order.uuid values — one inbound can cover multiple customer orders
    @Column({ type: 'text', nullable: true, default: null })
    sourceOrderUuids: string | null;

    // Incremented on consecutive errors; used for exponential-backoff decisions
    @Column({ type: 'integer', default: 0 })
    errorCount: number;

    @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
    createdAt: Date;

    @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
    updatedAt: Date;
}

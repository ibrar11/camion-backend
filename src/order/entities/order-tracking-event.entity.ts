import { Column, CreateDateColumn, Entity, Index, PrimaryGeneratedColumn } from 'typeorm';
import { OrderTrackingStage } from '../enums/OrderTrackingStage';

@Entity({ name: 'order_tracking_events' })
export class OrderTrackingEvent {
    @PrimaryGeneratedColumn()
    id: number;

    @Column({ type: 'uuid', name: 'order_uuid' })
    @Index()
    orderUuid: string;

    @Column({ type: 'enum', enum: OrderTrackingStage })
    stage: OrderTrackingStage;

    @Column({ type: 'timestamptz' })
    date: Date;

    @Column({ type: 'varchar', length: 128, nullable: true, default: null, name: 'tracking_id' })
    trackingId: string | null;

    @Column({ type: 'text', nullable: true, default: null, name: 'cancellation_reason' })
    cancellationReason: string | null;

    @Column({ type: 'text', nullable: true, default: null, name: 'review_text' })
    reviewText: string | null;

    @Column({ type: 'int', nullable: true, default: null, name: 'review_rating' })
    reviewRating: number | null;

    @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
    createdAt: Date;
}

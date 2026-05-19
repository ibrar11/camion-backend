import {
    Column,
    CreateDateColumn,
    Entity,
    Index,
    JoinColumn,
    ManyToOne,
    PrimaryGeneratedColumn,
    Unique,
} from 'typeorm';

import { JopWmsOrder } from './jop-wms-order.entity';
import { Order } from '../../order/entities/order.entity';

@Entity({ name: 'jop_wms_order_links' })
@Unique(['wmsOrderId', 'orderId'])
export class JopWmsOrderLink {
    @PrimaryGeneratedColumn()
    id: number;

    @Index()
    @Column({ name: 'wms_order_id' })
    wmsOrderId: number;

    @ManyToOne(() => JopWmsOrder, (wmsOrder) => wmsOrder.sourceOrders, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'wms_order_id' })
    wmsOrder: JopWmsOrder;

    @Index()
    @Column({ name: 'order_id' })
    orderId: number;

    @Index()
    @Column({ name: 'order_uuid', type: 'uuid' })
    orderUuid: string;

    @ManyToOne(() => Order, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'order_id' })
    order: Order;

    @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
    createdAt: Date;
}

import {
    Column,
    CreateDateColumn,
    Entity,
    ManyToOne,
    OneToMany,
    PrimaryGeneratedColumn,
    UpdateDateColumn
} from "typeorm";

import { Exclude } from "class-transformer";

import { OrderStatus } from "../enums/OrderStatus";

import { Customer } from "src/customers/entities/customer.entity";

import { OrderItem } from "./order-item.entity";


@Entity({ name: 'orders', })
export class Order {
    @Exclude()
    @PrimaryGeneratedColumn()
    id: number;

    @Column({ type: "uuid", nullable: false, unique: true, })
    uuid: string;

    @ManyToOne(() => Customer, (customer) => customer.orders)
    customer: Customer;

    @Column({
        type: "enum",
        enum: OrderStatus,
        default: OrderStatus.PENDING,
    })
    status: OrderStatus; // PENDING | CONFIRMED | CANCELLED | DELIVERED

    @Column()
    currency: string;

    @Column({ type: 'decimal', default: 0 })
    subTotal: number;

    @Column({ type: 'decimal', default: 0 })
    shippingCost: number;

    @Column({ type: 'decimal', default: 0 })
    discount: number;

    @Column({ type: 'decimal', default: 0 })
    total: number;

    @Column({ default: false })
    isPaid: boolean;

    @Column({ type: 'timestamp', nullable: true })
    paidAt?: Date;

    @OneToMany(() => OrderItem, (item) => item.order, { cascade: true })
    orderItems: OrderItem[];

    @Column({ type: 'jsonb', nullable: true })
    customerSnapshot: any;

    @Exclude()
    @UpdateDateColumn({
        name: "updated_at",
        type: "timestamptz",
    })
    updatedAt: Date;

    @Exclude()
    @CreateDateColumn({
        name: "created_at",
        type: "timestamptz",
    })
    createdAt: Date;
}
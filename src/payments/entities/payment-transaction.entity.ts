import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    CreateDateColumn,
    UpdateDateColumn,
    OneToOne,
} from "typeorm";

import { Exclude } from "class-transformer";

import { PaymentProvider } from "../enums/PaymentProvider";
import { PaymentStatus } from "../enums/PaymentStatus";

import { Order } from "../../order/entities/order.entity";

@Entity("payment_transactions")
export class PaymentTransaction {
    @PrimaryGeneratedColumn("uuid")
    id: string;

    @Column({
        type: "enum",
        enum: PaymentProvider,
    })
    provider: PaymentProvider;

    @Column({ nullable: true })
    transactionId: string;

    @Column({ type: "decimal", precision: 10, scale: 2 })
    amount: number;

    @Column()
    currency: string;

    @Column({
        type: "enum",
        enum: PaymentStatus,
        default: PaymentStatus.PENDING,
    })
    status: PaymentStatus;

    @OneToOne(() => Order, (order) => order.paymentTransaction)
    order: Order;

    @Column({ type: "jsonb", nullable: true })
    rawResponse: any;

    @Column({ type: "jsonb", nullable: true })
    webhookData: any;

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
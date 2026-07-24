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

import { CurrencyCode } from "../../inventory/enums/CurrencyCode.enum";

export class PaymentMoney {
    @Column({ type: "integer", nullable: true })
    amount: number;

    @Column({ type: "integer", nullable: false, default: 0, })
    minorAmount: number;

    @Column({
        type: "enum",
        enum: CurrencyCode,
        default: CurrencyCode.USD,
    })
    currencyCode: CurrencyCode;
}
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

    @Column(() => PaymentMoney)
    amount: PaymentMoney;

    @Column({
        type: "enum",
        enum: CurrencyCode,
        default: CurrencyCode.USD,
    })
    currency: CurrencyCode;

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

    @Column({ type: "varchar", length: 512, nullable: true, name: "failure_reason" })
    failureReason: string | null;

    @Column({ type: "varchar", length: 128, nullable: true, name: "error_code" })
    errorCode: string | null;

    @Column({ type: "varchar", length: 128, nullable: true, name: "payment_method" })
    paymentMethod: string | null;

    @Column({ type: "timestamptz", nullable: true, name: "last_attempt_at" })
    lastAttemptAt: Date | null;

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
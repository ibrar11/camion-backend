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

import { CurrencyCode } from "src/inventory/enums/CurrencyCode";
import { OrderStatus } from "../enums/OrderStatus";

import { Customer } from "src/customers/entities/customer.entity";

import { OrderItem } from "./order-item.entity";


export class Money {
    @Column({ type: "integer", })
    amount: number;

    @Column({
        type: "enum",
        enum: CurrencyCode,
        default: CurrencyCode.USD,
    })
    currencyCode: CurrencyCode;
}

@Entity({ name: 'orders', })
export class Order {
    @Exclude()
    @PrimaryGeneratedColumn()
    id: number;

    @Column({ type: "uuid", nullable: false, unique: true, })
    uuid: string;

    @Exclude()
    @ManyToOne(() => Customer, (customer) => customer.orders)
    customer: Customer;

    @Column({
        type: "enum",
        enum: OrderStatus,
        default: OrderStatus.PENDING,
    })
    status: OrderStatus;

    @Column(() => Money)
    subTotal: Money;

    @Column(() => Money)
    shippingCost: Money;

    @Column(() => Money)
    discount: Money;

    @Column(() => Money)
    total: Money;

    @OneToMany(() => OrderItem, (item) => item.order, { cascade: true })
    orderItems: OrderItem[];

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
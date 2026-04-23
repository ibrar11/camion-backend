import { Field, ObjectType } from "@nestjs/graphql";

import {
    Column,
    CreateDateColumn,
    Entity,
    ManyToOne,
    OneToMany,
    OneToOne,
    PrimaryGeneratedColumn,
    UpdateDateColumn
} from "typeorm";

import { Exclude } from "class-transformer";

import { OrderStatus } from "../enums/OrderStatus";

import { Customer } from "../../customers/entities/customer.entity";
import { CustomerAddress } from "../../customers/entities/customer-address.entity";

import { OrderItem } from "./order-item.entity";

import { Money } from "../../inventory/entities/product-variant.entity";
import { PaymentTransaction } from "../../payments/entities/payment-transaction.entity";

@ObjectType()
@Entity({ name: 'orders', })
export class Order {
    @Exclude()
    @PrimaryGeneratedColumn()
    id: number;

    @Field()
    @Column({ type: "uuid", nullable: false, unique: true, })
    uuid: string;

    @Exclude()
    @ManyToOne(() => Customer, (customer) => customer.orders)
    customer: Customer;

    @Field(() => CustomerAddress)
    @ManyToOne(() => CustomerAddress, (customerAddress) => customerAddress.orders)
    shippingAddress: CustomerAddress;

    @Field()
    @Column({
        type: "enum",
        enum: OrderStatus,
        default: OrderStatus.PENDING,
    })
    status: OrderStatus;

    @Field(() => Money)
    @Column(() => Money)
    subTotal: Money;

    @Field(() => Money)
    @Column(() => Money)
    shippingCost: Money;

    @Field(() => Money)
    @Column(() => Money)
    discount: Money;

    @Field(() => Money)
    @Column(() => Money)
    total: Money;

    @Field()
    @Column({ type: "varchar", length: 64 })
    eta: string;

    @Field(() => [OrderItem])
    @OneToMany(() => OrderItem, (item) => item.order, { cascade: true })
    orderItems: Array<OrderItem>;

    @OneToOne(() => PaymentTransaction, (transaction) => transaction.order, { cascade: true })
    paymentTransaction: PaymentTransaction;

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

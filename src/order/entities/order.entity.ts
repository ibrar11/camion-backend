import { Field, ObjectType } from "@nestjs/graphql";

import {
    Column,
    CreateDateColumn,
    Entity,
    Index,
    JoinColumn,
    ManyToOne,
    OneToMany,
    OneToOne,
    PrimaryGeneratedColumn,
    UpdateDateColumn
} from "typeorm";

import { OrderTracking } from "../types";

import { Exclude } from "class-transformer";

import { OrderStatus } from "../enums/OrderStatus";

import { Customer } from "../../customers/entities/customer.entity";
import { CustomerAddress } from "../../customers/entities/customer-address.entity";

import { OrderItem } from "./order-item.entity";

import { Money } from "../../inventory/entities/product-variant.entity";
import { Coupon } from "../../referral/entities/coupon.entity";
import { PaymentTransaction } from "../../payments/entities/payment-transaction.entity";

@ObjectType()
export class CouponOrder {
    @Field()
    uuid: string;

    @Field(() => Money)
    total: Money;

    @Field(() => Money)
    commission: Money;

    @Field()
    status: OrderStatus;

    @Field(() => Date)
    createdAt: Date;
}

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
    @Index()
    customer: Customer;

    @Field(() => CustomerAddress)
    @ManyToOne(() => CustomerAddress, (customerAddress) => customerAddress.orders)
    @Index()
    shippingAddress: CustomerAddress;

    @ManyToOne(() => Coupon, (coupon) => coupon.orders)
    @Index()
    coupon: Coupon | null;

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

    // One entry per 1688 shop involved in this order. Null means not yet procured.
    @Field(() => [String], { nullable: true })
    @Column({ type: 'text', array: true, nullable: true, default: null, name: 'gulltrans_order_sns' })
    gulltransOrderSns: string[] | null;

    @Field(() => [OrderItem])
    @OneToMany(() => OrderItem, (item) => item.order, { cascade: true })
    orderItems: Array<OrderItem>;

    @OneToOne(() => PaymentTransaction, (transaction) => transaction.order, { cascade: true })
    @JoinColumn()
    paymentTransaction: PaymentTransaction;

    @Exclude()
    @UpdateDateColumn({
        name: "updated_at",
        type: "timestamptz",
    })
    updatedAt: Date;

    // <!--
    // These fields are not part of the schema. Please don't add them to the database.

    @Field(() => Date, { name: "orderPlacementDate" })
    orderPlacementDate: Date;

    @Field(() => OrderTracking, { nullable: true })
    tracking?: OrderTracking;

    // -->

    @Exclude()
    @CreateDateColumn({
        name: "created_at",
        type: "timestamptz",
    })
    createdAt: Date;
}

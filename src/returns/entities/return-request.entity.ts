import { Field, ObjectType } from "@nestjs/graphql";

import {
    Column,
    CreateDateColumn,
    Entity,
    ManyToOne,
    OneToMany,
    PrimaryGeneratedColumn,
    UpdateDateColumn,
} from "typeorm";

import { Exclude } from "class-transformer";

import { ReturnReason } from "../enums/ReturnReason.enum";
import { ReturnStatus } from "../enums/ReturnStatus.enum";

import { Customer } from "../../customers/entities/customer.entity";
import { Order } from "../../order/entities/order.entity";
import { OrderItem } from "../../order/entities/order-item.entity";
import { Money } from "../../inventory/entities/product-variant.entity";

import { ReturnEvidence } from "./return-evidence.entity";

@ObjectType()
@Entity({ name: "return_requests" })
export class ReturnRequest {
    @Exclude()
    @PrimaryGeneratedColumn()
    id: number;

    @Field()
    @Column({ type: "uuid", unique: true })
    uuid: string;

    @Exclude()
    @ManyToOne(() => Customer, { nullable: false })
    customer: Customer;

    @Field(() => Order)
    @ManyToOne(() => Order, { nullable: false })
    order: Order;

    @Field(() => OrderItem, { nullable: true })
    @ManyToOne(() => OrderItem, { nullable: true })
    orderItem: OrderItem;

    @Field()
    @Column({ type: "enum", enum: ReturnReason })
    reason: ReturnReason;

    @Field()
    @Column({ type: "text" })
    reasonDetail: string;

    @Field()
    @Column({
        type: "enum",
        enum: ReturnStatus,
        default: ReturnStatus.PENDING,
    })
    status: ReturnStatus;

    @Field(() => String, { nullable: true })
    @Column({ type: "varchar", nullable: true })
    adminNote: string | null;

    @Field(() => Money, { nullable: true })
    @Column(() => Money, { prefix: "refund" })
    refundAmount: Money;

    @Field(() => [ReturnEvidence])
    @OneToMany(() => ReturnEvidence, (evidence) => evidence.returnRequest, { cascade: true })
    evidence: ReturnEvidence[];

    @Field()
    @CreateDateColumn({ type: "timestamptz" })
    createdAt: Date;

    @Field()
    @UpdateDateColumn({ type: "timestamptz" })
    updatedAt: Date;
}

import { Field, ObjectType } from "@nestjs/graphql";

import {
	Column,
	CreateDateColumn,
	Entity,
	Index,
	ManyToOne,
	OneToMany,
	PrimaryGeneratedColumn,
	UpdateDateColumn,
} from "typeorm";

import { Exclude } from "class-transformer";

import { Affiliate } from "./affiliate.entity";
import { Order } from "src/order/entities/order.entity";

@ObjectType()
@Entity({ name: "affiliate_coupons" })
export class Coupon {
	@Exclude()
	@PrimaryGeneratedColumn()
	id: number;

	@Field()
	@Column({ type: "uuid", nullable: false, unique: true, })
	uuid: string;

	@ManyToOne(() => Affiliate, (affiliate) => affiliate.coupons, { onDelete: "CASCADE", })
	@Index()
	affiliate: Affiliate;

	@Field()
	@Column({ type: "varchar", length: 32, nullable: false, unique: true, })
	code: string;

	@Field()
	@Column({ type: "numeric", default: 0, nullable: false, })
	discountPercentage: number;

	@Field()
	@Column({ type: "integer", default: 0, nullable: false, })
	ordersCount: number;

	@OneToMany(() => Order, (order) => order.coupon)
	orders: Array<Order>;

	@Field()
	@Column({ type: "timestamptz", nullable: false, })
	expiresAt: Date;

	@Exclude()
	@UpdateDateColumn({
		name: "updated_at",
		type: "timestamptz",
	})
	updatedAt: Date;

	@Field()
	@CreateDateColumn({
		name: "created_at",
		type: "timestamptz",
	})
	createdAt: Date;
}

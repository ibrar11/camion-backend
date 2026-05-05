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

import { Customer } from "./customer.entity";

import { Order } from "../../order/entities/order.entity";

@ObjectType()
@Entity({ name: "customer_addresses", })
export class CustomerAddress {
	@Exclude()
	@PrimaryGeneratedColumn()
	id: number;

	@Field()
	@Column({ type: "uuid", nullable: false, unique: true, })
	uuid: string;

	@ManyToOne(() => Customer, (customer) => customer.addresses, { onDelete: "CASCADE", })
	@Index()
	customer: Customer;

	@Field()
	@Column({ nullable: false, })
	fullName: string;

	@Field()
	@Column({ nullable: false, })
	phoneNumber: string;

	@Field()
	@Column({ nullable: false, })
	streetAddress: string;

	@Field()
	@Column()
	apartment: string;

	@Field()
	@Column()
	zipCode: string;

	@Field()
	@Column({ nullable: false, })
	city: string;

	@Field()
	@Column({ nullable: false, })
	state: string;

	@Field()
	@Column({ nullable: false, })
	country: string;

	@Field()
	@Column({ type: "boolean", default: true, })
	isDefault: boolean;

	@OneToMany(() => Order, (order) => order.shippingAddress)
	orders: Array<Order>;

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

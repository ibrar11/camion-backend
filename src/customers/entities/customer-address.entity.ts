import { Field, ObjectType } from "@nestjs/graphql";

import {
	Column,
	CreateDateColumn,
	Entity,
	ManyToOne,
	PrimaryGeneratedColumn,
	UpdateDateColumn,
} from "typeorm";

import { Exclude } from "class-transformer";

import { Customer } from "./customer.entity";

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

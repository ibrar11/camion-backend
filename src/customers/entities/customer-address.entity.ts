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

@Entity({ name: "customer_addresses", })
export class CustomerAddress {
	@Exclude()
	@PrimaryGeneratedColumn()
	id: number;

	@Column({ type: "uuid", nullable: false, unique: true, })
	uuid: string;

	@ManyToOne(() => Customer, (customer) => customer.addresses, { onDelete: "CASCADE", })
	customer: Customer;

	@Column({ nullable: false, })
	fullName: string;

	@Column({ nullable: false, })
	phoneNumber: string;

	@Column({ nullable: false, })
	streetAddress: string;

	@Column()
	apartment: string;

	@Column()
	zipCode: string;

	@Column({ nullable: false, })
	city: string;

	@Column({ nullable: false, })
	state: string;

	@Column({ nullable: false, })
	country: string;

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

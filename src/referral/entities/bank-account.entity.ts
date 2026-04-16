import { Field, ObjectType } from "@nestjs/graphql";

import {
	Column,
	CreateDateColumn,
	Entity,
	JoinColumn,
	ManyToOne,
	PrimaryGeneratedColumn,
	UpdateDateColumn,
} from "typeorm";

import { Exclude } from "class-transformer";

import { Affiliate } from "./affiliate.entity";

@ObjectType()
@Entity({ name: "affiliate_bank_accounts" })
export class BankAccount {
	@Exclude()
	@PrimaryGeneratedColumn()
	id: number;

	@Field()
	@Column({ type: "uuid", nullable: false, unique: true, })
	uuid: string;

	@ManyToOne(() => Affiliate, (affiliate) => affiliate.wallet, { onDelete: "CASCADE" })
	@JoinColumn()
	affiliate: Affiliate;

	@Field()
	@Column({ nullable: false, })
	bankName: string;

	@Field()
	@Column({ nullable: false, })
	accountHolderName: string;

	@Field()
	@Column({ nullable: false, })
	accountNumber: string;

	@Field()
	@Column({ nullable: false, })
	iban: string;

	@Field()
	@Column({ nullable: true, })
	swiftCode: string;

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

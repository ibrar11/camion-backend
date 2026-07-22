import {
	Column,
	CreateDateColumn,
	Entity,
	Index,
	ManyToOne,
	PrimaryGeneratedColumn,
	UpdateDateColumn,
} from "typeorm";

import { Exclude } from "class-transformer";

import { Wallet } from "./wallet.entity";

import { TransactionType } from "../enums/TransactionType.enum";
import { CurrencyCode } from "../../inventory/enums/CurrencyCode.enum";
import { Field, ObjectType } from "@nestjs/graphql";

@ObjectType()
export class TransactionMoney {
	@Field()
	@Column({ type: "integer", })
	amount: number;

	@Field()
	@Column({ type: "integer", nullable: false, default: 0, })
	minorAmount: number;

	@Field()
	@Column({
		type: "enum",
		enum: CurrencyCode,
		default: CurrencyCode.USD,
	})
	currencyCode: CurrencyCode;
}

@ObjectType()
@Entity({ name: "affiliate_wallet_transactions" })
export class Transaction {
	@Exclude()
	@PrimaryGeneratedColumn()
	id: number;

	@Field()
	@Column({ type: "uuid", nullable: false, unique: true, })
	uuid: string;

	@ManyToOne(() => Wallet, (wallet) => wallet.transactions, { onDelete: "CASCADE", })
	@Index()
	wallet: Wallet;

	@Field()
	@Column(() => TransactionMoney)
	amount: TransactionMoney;

	@Field()
	@Column({
		type: "enum",
		enum: TransactionType,
		default: TransactionType.Credit,
	})
	type: TransactionType;

	@Field()
	@Column({ type: "varchar", length: 256, })
	description: string;

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

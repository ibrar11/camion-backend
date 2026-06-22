import {
	Column,
	CreateDateColumn,
	Entity,
	JoinColumn,
	OneToMany,
	OneToOne,
	PrimaryGeneratedColumn,
	UpdateDateColumn,
} from "typeorm";

import { Exclude } from "class-transformer";

import { CurrencyCode } from "../../inventory/enums/CurrencyCode.enum";

import { Transaction } from "./transaction.entity";
import { Affiliate } from "./affiliate.entity";
import { Field, ObjectType } from "@nestjs/graphql";

@ObjectType()
export class WalletMoney {
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
@Entity({ name: "affiliate_wallets" })
export class Wallet {
	@Exclude()
	@PrimaryGeneratedColumn()
	id: number;

	@Field()
	@Column({ type: "uuid", nullable: false, unique: true, })
	uuid: string;

	@OneToOne(() => Affiliate, (affiliate) => affiliate.wallet, { onDelete: "CASCADE" })
	@JoinColumn()
	affiliate: Affiliate;

	@Field(() => WalletMoney)
	@Column(() => WalletMoney)
	amount: WalletMoney;

	@Field(() => WalletMoney)
	@Column(() => WalletMoney)
	amountPending: WalletMoney;

	@Field(() => WalletMoney)
	@Column(() => WalletMoney)
	amountAvailable: WalletMoney;

	@OneToMany(() => Transaction, (transaction) => transaction.wallet, { cascade: true, })
	transactions: Array<Transaction>;

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

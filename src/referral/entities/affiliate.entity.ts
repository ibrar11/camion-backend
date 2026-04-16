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
	UpdateDateColumn,
} from "typeorm";

import { Exclude } from "class-transformer";

import { AffiliateStatus } from "../enums/AffiliateStatus.enum";
import { AffiliateType } from "../enums/AffiliateType.enum";
import { CurrencyCode } from "../../inventory/enums/CurrencyCode";

import { Coupon } from "./coupon.entity";
import { Customer } from "../../customers/entities/customer.entity";
import { Product } from "../../inventory/entities/product.entity";
import { Wallet } from "./wallet.entity";

@ObjectType()
export class AffiliateMoney {
	@Field()
	@Column({ type: "integer", })
	amount: number;

	@Field()
	@Column({
		type: "enum",
		enum: CurrencyCode,
		default: CurrencyCode.USD,
	})
	currencyCode: CurrencyCode;
}

@ObjectType()
@Entity({ name: "affiliates" })
export class Affiliate {
	@Exclude()
	@PrimaryGeneratedColumn()
	id: number;

	@Field()
	@Column({ type: "uuid", nullable: false, unique: true, })
	uuid: string;

	@OneToOne(() => Customer, (customer) => customer.affiliate, { onDelete: "CASCADE", })
	@JoinColumn({ name: "customerId", })
	customer: Customer;

	@Field()
	@Column({ type: "varchar", length: 128, })
	fullName: string;

	@Field()
	@Column({ type: "varchar", length: 32, })
	gender: string;

	@Field()
	@Column({ type: "varchar", length: 32, })
	nationality: string;

	@Field()
	@Column({ type: "varchar", length: 256, })
	bio: string;

	@Field()
	@Column({
		type: "enum",
		enum: AffiliateType,
		default: AffiliateType.Affiliate,
	})
	@Index()
	type: AffiliateType;

	@Field()
	@Column({
		type: "enum",
		enum: AffiliateStatus,
		default: AffiliateStatus.Pending,
	})
	status: AffiliateStatus;

	@Field()
	@Column(() => AffiliateMoney)
	totalCommission: AffiliateMoney;

	@Field()
	@Column(() => AffiliateMoney)
	totalPaid: AffiliateMoney;

	@Field()
	@Column(() => AffiliateMoney)
	remainingBalance: AffiliateMoney;

	@Field()
	@Column({ type: "integer", default: 0, })
	couponsCreated: number;

	@Field()
	@Column({ type: "integer", default: 0, })
	couponsUsed: number;

	@Field(() => Coupon, { nullable: true, })
	@OneToOne(() => Coupon, (coupon) => coupon.affiliate)
	trendingCoupon: Coupon;

	@Field(() => Product, { nullable: true })
	@ManyToOne(() => Product, { nullable: true, onDelete: "SET NULL", })
	@JoinColumn()
	topProduct: Product;

	@OneToMany(() => Coupon, (coupon) => coupon.affiliate, { cascade: true, })
	coupons: Array<Coupon>;

	@Field(() => Wallet)
	@OneToOne(() => Wallet, (wallet) => wallet.affiliate)
	wallet: Wallet;

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

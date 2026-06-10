import {
	Column,
	CreateDateColumn,
	Entity,
	OneToMany,
	PrimaryGeneratedColumn,
	UpdateDateColumn,
} from "typeorm";

import { Exclude } from "class-transformer";

import { CurrencyCode } from "../../inventory/enums/CurrencyCode.enum";
import { GlobalCouponDiscountType } from "../enums/GlobalCouponDiscountType";

import { Order } from "../../order/entities/order.entity";

export class GlobalCouponMoney {
	@Column({ type: "integer", default: 0, })
	amount: number;

	@Column({
		type: "enum",
		enum: CurrencyCode,
		default: CurrencyCode.USD,
	})
	currencyCode: CurrencyCode;
}

@Entity({ name: "global_coupons", })
export class GlobalCoupon {
	@Exclude()
	@PrimaryGeneratedColumn()
	id: number;

	@Column({ type: "uuid", nullable: false, unique: true, })
	uuid: string;

	@Column({ type: "varchar", length: 32, nullable: false, unique: true, })
	code: string;

	@Column({
		type: "enum",
		enum: GlobalCouponDiscountType,
		default: GlobalCouponDiscountType.Percentage,
	})
	discountType: GlobalCouponDiscountType;

	@Column({ type: "numeric", default: 0, nullable: false, })
	discountPercentage: number;

	@Column({ type: "integer", default: 0, nullable: false, })
	discountValue: number;

	@Column({ type: "integer", default: 0, nullable: false, })
	usageLimit: number;

	@Column({ type: "integer", default: 0, nullable: false, })
	ordersCount: number;

	@Column(() => GlobalCouponMoney)
	totalSales: GlobalCouponMoney;

	@Column(() => GlobalCouponMoney)
	totalCommission: GlobalCouponMoney;

	@OneToMany(() => Order, (order) => order.globalCoupon)
	orders: Array<Order>;

	@Column({ type: "timestamptz", nullable: false, })
	expiresAt: Date;

	@UpdateDateColumn({
		name: "updated_at",
		type: "timestamptz",
	})
	updatedAt: Date;

	@CreateDateColumn({
		name: "created_at",
		type: "timestamptz",
	})
	createdAt: Date;
}

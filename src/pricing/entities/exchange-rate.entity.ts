import {
	Column,
	CreateDateColumn,
	Entity,
	PrimaryGeneratedColumn,
	UpdateDateColumn,
} from "typeorm";

import { Exclude } from "class-transformer";

import { CurrencyCode } from "../../inventory/enums/CurrencyCode.enum";

@Entity({ name: "exchange_rates", })
export class ExchangeRate {
	@Exclude()
	@PrimaryGeneratedColumn()
	id: number;

	@Column({ type: "uuid", nullable: false, unique: true, })
	uuid: string;

	@Column({
		type: "enum",
		enum: CurrencyCode,
		default: CurrencyCode.USD,
	})
	srcCurrencyCode: CurrencyCode;

	@Column({
		type: "enum",
		enum: CurrencyCode,
		default: CurrencyCode.QAR,
	})
	targetCurrencyCode: CurrencyCode;

	@Column({ type: "numeric", default: 0, nullable: false, })
	factor: number;

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

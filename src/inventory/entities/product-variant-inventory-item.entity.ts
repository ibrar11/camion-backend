import {
	Column,
	CreateDateColumn,
	Entity,
	JoinColumn,
	OneToOne,
	PrimaryGeneratedColumn,
	UpdateDateColumn,
} from "typeorm";

import { Exclude } from "class-transformer";

import { CurrencyCode } from "../enums/CurrencyCode.enum";
import { ProductVariant } from "./product-variant.entity";

export class Money {
	@Column({ type: "integer", })
	amount: number;

	@Column({
		type: "enum",
		enum: CurrencyCode,
		default: CurrencyCode.USD,
	})
	currencyCode: CurrencyCode;
}

@Entity({ name: "product_variant_inventory_items", })
export class ProductVariantInventoryItem {
	@Exclude()
	@PrimaryGeneratedColumn()
	id: number;

	@Column({ type: "uuid", nullable: false, unique: true, })
	uuid: string;

	@Column({ type: "integer", })
	quantity: number;

	@Column({ type: "boolean", })
	tracked: boolean;

	@Column(() => Money)
	unitCost: Money;

	@OneToOne(() => ProductVariant, (variant) => variant.inventoryItem, { cascade: true, })
	@JoinColumn({ name: "variantId", })
	variant: ProductVariant;

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

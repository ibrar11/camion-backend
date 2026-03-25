import {
	Column,
	CreateDateColumn,
	Entity,
	ManyToOne,
	OneToMany,
	OneToOne,
	PrimaryGeneratedColumn,
	UpdateDateColumn,
} from "typeorm";

import { Exclude } from "class-transformer";

import { CurrencyCode } from "../enums/CurrencyCode";
import { WeightUnit } from "../enums/WeightUnit";

import { Product } from "./product.entity";
import { ProductVariantImage } from "./product-variant-image.entity";
import { ProductVariantOptionValue } from "./product-variant-option-value.entity";
import { ProductVariantInventoryItem } from "./product-variant-inventory-item.entity";

export class Money {
	@Column({ type: "numeric", })
	amount: number;

	@Column({
		type: "enum",
		enum: CurrencyCode,
		default: CurrencyCode.USD,
	})
	currencyCode: CurrencyCode;
}

export class Weight {
	@Column({ type: "numeric", })
	amount: number;

	@Column({
		type: "enum",
		enum: WeightUnit,
		default: WeightUnit.KILOGRAMS,
	})
	unit: WeightUnit;
}

export class Dimensions {
	@Column({ type: "numeric", })
	width: number;

	@Column({ type: "numeric", })
	height: number;

	@Column({ type: "numeric", })
	length: number;
}

@Entity({ name: "product_variants", })
export class ProductVariant {
	@Exclude()
	@PrimaryGeneratedColumn()
	id: number;

	@Column({ type: "uuid", nullable: false, unique: true, })
	uuid: string;

	@Column({ type: "varchar", length: 128, })
	title: string;

	@Column({ type: "varchar", length: 128, })
	titleAr: string;

	@Column({ type: "varchar", length: 64, })
	sku: string;

	@Column({ type: "varchar", length: 32, })
	barcode: string;

	@Column(() => Money)
	price: Money;

	@Column(() => Weight)
	weight: Weight;

	@Column(() => Dimensions)
	dimensions: Dimensions;

	@ManyToOne(() => Product, (product) => product.variants, { onDelete: "CASCADE", })
	product: Product;

	@OneToOne(() => ProductVariantInventoryItem, (inventoryItem) => inventoryItem.variant, { onDelete: "CASCADE", })
	inventoryItem: ProductVariantInventoryItem;

	@OneToMany(() => ProductVariantOptionValue, (productVariantOptionValue) => productVariantOptionValue.variant, { cascade: true, })
	optionValues: Array<ProductVariantOptionValue>;

	@OneToMany(() => ProductVariantImage, (image) => image.variant, { cascade: true, })
	images: Array<ProductVariantImage>;

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

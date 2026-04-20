import {
	Field,
	Int,
	ObjectType,
} from "@nestjs/graphql";

import {
	Column,
	CreateDateColumn,
	Entity,
	JoinColumn,
	ManyToOne,
	OneToMany,
	OneToOne,
	PrimaryGeneratedColumn,
	UpdateDateColumn,
} from "typeorm";

import { Exclude } from "class-transformer";

import { CurrencyCode } from "../enums/CurrencyCode.enum";
import { WeightUnit } from "../enums/WeightUnit.enum";
import { DimensionsUnit } from "../enums/DimensionsUnit.enum";

import { Product } from "./product.entity";
import { ProductVariantImage } from "./product-variant-image.entity";
import { ProductVariantOptionValue } from "./product-variant-option-value.entity";

import { InventoryItem } from "./inventory-item.entity";

import { CartItem } from "../../cart/entities/cart-items.entity";

import { OrderItem } from "../../order/entities/order-item.entity";

@ObjectType()
export class Money {
	@Field(() => Int)
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
export class Weight {
	@Field(() => Int)
	@Column({ type: "integer", })
	amount: number;

	@Field()
	@Column({
		type: "enum",
		enum: WeightUnit,
		default: WeightUnit.Kilograms,
	})
	unit: WeightUnit;
}

@ObjectType()
export class Dimensions {
	@Field(() => Int)
	@Column({ type: "integer", })
	width: number;

	@Field(() => Int)
	@Column({ type: "integer", })
	height: number;

	@Field(() => Int)
	@Column({ type: "integer", })
	length: number;

	@Field()
	@Column({
		type: "enum",
		enum: DimensionsUnit,
		default: DimensionsUnit.Millimeter,
	})
	unit: DimensionsUnit;
}

@ObjectType()
@Entity({ name: "product_variants", })
export class ProductVariant {
	@Exclude()
	@PrimaryGeneratedColumn()
	id: number;

	@Field()
	@Column({ type: "uuid", nullable: false, unique: true, })
	uuid: string;

	@ManyToOne(() => Product, (product) => product.variants, { onDelete: "CASCADE", })
	product: Product;

	@JoinColumn()
	productId: number;

	@OneToOne(() => InventoryItem, (item) => item.variant)
	@JoinColumn()
	inventoryItem: InventoryItem;

	@Field(() => String, { name: "title" })
	title: string;

	@Field()
	@Column({ type: "varchar", length: 128, })
	titleEn: string;

	@Field()
	@Column({ type: "varchar", length: 128, })
	titleAr: string;

	@Field()
	@Column({ type: "varchar", length: 64, })
	sku: string;

	@Field()
	@Column({ type: "varchar", length: 32, })
	barcode: string;

	@Field(() => Money)
	price: Money;

	@Field(() => Money)
	discountedPrice: Money;

	@Field(() => Money)
	@Column(() => Money)
	cost: Money;

	@Field(() => Weight)
	@Column(() => Weight)
	weight: Weight;

	@Field(() => Dimensions)
	@Column(() => Dimensions)
	dimensions: Dimensions;

	@Column({ type: "integer", nullable: false, default: 0, })
	salesCount: number;

	@Field(() => [ProductVariantOptionValue])
	@OneToMany(() => ProductVariantOptionValue, (productVariantOptionValue) => productVariantOptionValue.variant, { cascade: true, })
	optionValues: Array<ProductVariantOptionValue>;

	@Field(() => [ProductVariantImage])
	@OneToMany(() => ProductVariantImage, (image) => image.variant, { cascade: true, })
	images: Array<ProductVariantImage>;

	@OneToMany(() => CartItem, (cartItem) => cartItem.variant, { cascade: true, })
	cartItems: Array<CartItem>;

	@OneToMany(() => OrderItem, (orderItem) => orderItem.variant)
	orderItems: Array<OrderItem>;

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

import {
	Column,
	CreateDateColumn,
	Entity,
	OneToMany,
	PrimaryGeneratedColumn,
	UpdateDateColumn,
} from "typeorm";

import { Exclude } from "class-transformer";

import { ProductStatus } from "../enums/ProductStatus";

import { ProductOption } from "./product-option.entity";
import { ProductVariant } from "./product-variant.entity";

import { CartItem } from "src/cart/entities/cart-items.entity";

@Entity({ name: "products", })
export class Product {
	@Exclude()
	@PrimaryGeneratedColumn()
	id: number;

	@Column({ type: "uuid", nullable: false, unique: true, })
	uuid: string;

	@Column({ type: "varchar", length: 64, nullable: false, unique: true, })
	slug: string;

	@Column({ type: "varchar", length: 128, })
	title: string;

	@Column({ type: "varchar", length: 128, })
	titleAr: string;

	@Column({ type: "varchar", length: 256, })
	brief: string;

	@Column({ type: "varchar", length: 256, })
	briefAr: string;

	@Column({ type: "text", })
	description: string;

	@Column({ type: "text", })
	descriptionAr: string;

	@Column({ type: "text", })
	descriptionHtml: string;

	@Column({ type: "text", })
	descriptionHtmlAr: string;

	@Column({
		type: "enum",
		enum: ProductStatus,
		default: ProductStatus.DRAFT,
	})
	status: ProductStatus;

	@OneToMany(() => ProductOption, (option) => option.product, { cascade: true, })
	options: Array<ProductOption>;

	@OneToMany(() => ProductVariant, (variant) => variant.product, { cascade: true, })
	variants: Array<ProductVariant>;

	@OneToMany(() => CartItem, (cartItem) => cartItem.product, { cascade: true, })
	cartItems: Array<CartItem>;

	@Exclude()
	@Column({
		name: "published_at",
		type: "timestamptz",
	})
	publishedAt: Date;

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

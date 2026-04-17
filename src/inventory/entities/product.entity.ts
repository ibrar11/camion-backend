import {
	ObjectType,
	Field,
} from "@nestjs/graphql";

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
import { ProductCategory } from "./product-category.entity";
import { ProductReview } from "./product-review.entity";

import { CartItem } from "../../cart/entities/cart-items.entity";

import { OrderItem } from "../../order/entities/order-item.entity";

import { WishlistItem } from "src/wishlist/entities/wishlist.entity";

@ObjectType()
@Entity({ name: "products", })
export class Product {
	@Exclude()
	@PrimaryGeneratedColumn()
	id: number;

	@Field()
	@Column({ type: "uuid", nullable: false, unique: true, })
	uuid: string;

	@Field()
	@Column({ type: "varchar", length: 64, nullable: false, unique: true, })
	slug: string;

	@Field(() => String, { name: "title", })
	title: string;

	@Field(() => String)
	@Column({ type: "varchar", length: 128, })
	titleEn: string;

	@Field(() => String)
	@Column({ type: "varchar", length: 128, })
	titleAr: string;

	@Field(() => String, { name: "brief" })
	brief: string;

	@Field(() => String)
	@Column({ type: "varchar", length: 256, })
	briefEn: string;

	@Field(() => String)
	@Column({ type: "varchar", length: 256, })
	briefAr: string;

	@Field(() => String, { name: "description" })
	description: string;

	@Field(() => String)
	@Column({ type: "text", })
	descriptionEn: string;

	@Field(() => String)
	@Column({ type: "text", })
	descriptionAr: string;

	@Field(() => String, { name: "descriptionHtml" })
	descriptionHtml: string;

	@Field(() => String)
	@Column({ type: "text", })
	descriptionHtmlEn: string;

	@Field(() => String)
	@Column({ type: "text", })
	descriptionHtmlAr: string;

	@Field()
	@Column({
		type: "enum",
		enum: ProductStatus,
		default: ProductStatus.DRAFT,
	})
	status: ProductStatus;

	@Field(() => [ProductOption])
	@OneToMany(() => ProductOption, (option) => option.product, { cascade: true, })
	options: Array<ProductOption>;

	@Field(() => [ProductVariant])
	@OneToMany(() => ProductVariant, (variant) => variant.product, { cascade: true, })
	variants: Array<ProductVariant>;

	@OneToMany(() => ProductCategory, (productCategories) => productCategories.product, { cascade: true, })
	productCategories: Array<ProductCategory>;

	@Field(() => [ProductReview])
	@OneToMany(() => ProductReview, (review) => review.product, { cascade: true, })
	reviews: Array<ProductReview>;

	@OneToMany(() => CartItem, (cartItem) => cartItem.product, { cascade: true, })
	cartItems: Array<CartItem>;

	@OneToMany(() => OrderItem, (orderItem) => orderItem.product)
	orderItems: Array<OrderItem>;

	@OneToMany(() => WishlistItem, (wishlistItem) => wishlistItem.product)
	wishlistItems: Array<WishlistItem>;

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

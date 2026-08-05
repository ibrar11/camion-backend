import {
	ObjectType,
	Field,
} from "@nestjs/graphql";

import {
	Column,
	CreateDateColumn,
	Entity,
	Index,
	JoinColumn,
	OneToMany,
	OneToOne,
	PrimaryGeneratedColumn,
	UpdateDateColumn,
} from "typeorm";

import { Exclude } from "class-transformer";

import { Campaign } from "../../campaigns/entities/campaign.entity";

import { ProductStatus } from "../enums/ProductStatus.enum";

import { ProductOption } from "./product-option.entity";
import { ProductVariant } from "./product-variant.entity";
import { ProductCategory } from "./product-category.entity";
import { ProductReview } from "./product-review.entity";
import { ProductView } from "./product-view.entity";

import { CartItem } from "../../cart/entities/cart-items.entity";

import { OrderItem } from "../../order/entities/order-item.entity";

import { WishlistItem } from "../../wishlist/entities/wishlist.entity";

import { Translation } from "../../translation/entities/translation.entity";
import { ProductAttachment } from "./product-attachment.entity";

import { BundleItem } from "../../bundles/entities/bundle-item.entity";

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

	/*
	ALTER TABLE "products" ADD "search_vector_en" tsvector GENERATED ALWAYS AS (to_tsvector('english', coalesce(title_en, ''))) STORED;
	CREATE INDEX "idx_products_search_en" ON "products" USING gin("search_vector_en");
	*/

	@Exclude()
	@Column({
		type: 'tsvector',
		asExpression: `to_tsvector('english', coalesce(title_en, ''))`,
		generatedType: 'STORED',
		nullable: true,
	})
	@Index('idx_products_search_en', { unique: false })
	tsvTitleEn: string;

	@Exclude()
	@Column({
		type: 'tsvector',
		asExpression: `to_tsvector('arabic', coalesce(title_ar, ''))`,
		generatedType: 'STORED',
		nullable: true,
	})
	@Index('idx_products_search_ar', { unique: false })
	tsvTitleAr: string;

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

	@Field(() => String)
	@Column({ type: "varchar", length: 256, nullable: false, default: "", })
	featuredImageUrl: string;

	@Field(() => String)
	@Column({ type: "varchar", length: 256, nullable: false, default: "", })
	featuredThumbnailUrl: string;

	@Field(() => String)
	@Column({ type: "varchar", length: 256, nullable: false, default: "", })
	sizechartUrl: string;

	@Field()
	@Column({
		type: "enum",
		enum: ProductStatus,
		default: ProductStatus.DRAFT,
	})
	@Index()
	status: ProductStatus;

	@Field(() => String, { nullable: true })
	@Column({ type: 'varchar', length: 128, nullable: true, default: null })
	shopId: string | null;

	@Field(() => String, { nullable: true })
	@Column({ type: 'varchar', length: 256, nullable: true, default: null })
	shopName: string | null;

	@Field(() => String, { nullable: true })
	@Column({ type: 'varchar', length: 64, nullable: true, default: null })
	procurementId: string | null;

	@Field()
	@Column({ type: "integer", nullable: false, default: 0, })
	@Index()
	salesCount: number;

	@Field()
	@Column({ type: "integer", nullable: false, default: 0, })
	@Index()
	likesCount: number;

	@Field()
	@Column({ type: "integer", nullable: false, default: 0, })
	reviewsCount: number;

	@Field()
	@Column({ type: "integer", nullable: false, default: 0, })
	@Index()
	viewsCount: number;

	@Column({ type: "integer", nullable: false, default: 0, })
	ratingSum: number;

	@Column({ type: "integer", nullable: false, default: 0, })
	@Index()
	ratingCount: number;

	@Field()
	@Column({ type: "numeric", nullable: false, default: 0, })
	ratingAvg: number;

	@Field()
	@Column({ type: "integer", nullable: false, default: 0, })
	ratingOneStarCount: number;

	@Field()
	@Column({ type: "integer", nullable: false, default: 0, })
	ratingTwoStarCount: number;

	@Field()
	@Column({ type: "integer", nullable: false, default: 0, })
	ratingThreeStarCount: number;

	@Field()
	@Column({ type: "integer", nullable: false, default: 0, })
	ratingFourStarCount: number;

	@Field()
	@Column({ type: "integer", nullable: false, default: 0, })
	ratingFiveStarCount: number;

	@Field(() => [ProductAttachment])
	@OneToMany(() => ProductAttachment, (attachment) => attachment.product, { cascade: true, })
	attachments: Array<ProductAttachment>;

	@Field(() => [ProductOption])
	@OneToMany(() => ProductOption, (option) => option.product, { cascade: true, })
	options: Array<ProductOption>;

	@Field(() => [ProductVariant])
	@OneToMany(() => ProductVariant, (variant) => variant.product, { cascade: true, })
	variants: Array<ProductVariant>;

	@Field(() => [ProductCategory])
	@OneToMany(() => ProductCategory, (productCategories) => productCategories.product, { cascade: true, })
	productCategories: Array<ProductCategory>;

	@Field(() => [ProductReview])
	@OneToMany(() => ProductReview, (review) => review.product, { cascade: true, })
	reviews: Array<ProductReview>;

	@OneToMany(() => ProductView, (view) => view.product, { cascade: true, })
	views: Array<ProductView>;

	@OneToMany(() => CartItem, (cartItem) => cartItem.product, { cascade: true, })
	cartItems: Array<CartItem>;

	@OneToMany(() => OrderItem, (orderItem) => orderItem.product, { cascade: true, })
	orderItems: Array<OrderItem>;

	@OneToMany(() => WishlistItem, (wishlistItem) => wishlistItem.product, { cascade: true, })
	wishlistItems: Array<WishlistItem>;

	@OneToMany(() => BundleItem, item => item.product, { cascade: true, })
	bundleItems: Array<BundleItem>;

	@OneToOne(() => Translation, (translation) => translation.product, { cascade: true, })
	@JoinColumn()
	translation: Translation;

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

	/// DO NOT ADD THE PROPERTIES BELOW TO THE SCHEMA ///

	/// Campaign ///
	// Campaign is dynamically attached to the product entity
	@Field(() => Campaign, { nullable: true, })
	campaign: Campaign | null;
}

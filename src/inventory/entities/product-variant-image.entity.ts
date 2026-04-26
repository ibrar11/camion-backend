import {
	Field,
	Int,
	ObjectType,
} from "@nestjs/graphql";

import {
	Column,
	CreateDateColumn,
	Entity,
	Index,
	ManyToOne,
	PrimaryGeneratedColumn,
	UpdateDateColumn,
} from "typeorm";

import { Exclude } from "class-transformer";

import { ProductVariant } from "./product-variant.entity";

@ObjectType()
export class ProductVariantImageDimensions {
	@Field(() => Int)
	@Column({ type: "integer", })
	width: number;

	@Field(() => Int)
	@Column({ type: "integer", })
	height: number;
}

@ObjectType()
@Entity({ name: "product_variant_images", })
export class ProductVariantImage {
	@Exclude()
	@PrimaryGeneratedColumn()
	id: number;

	@Field()
	@Column({ type: "uuid", nullable: false, unique: true, })
	uuid: string;

	@ManyToOne(() => ProductVariant, (variant) => variant.images, { onDelete: "CASCADE", })
	@Index()
	variant: ProductVariant;

	@Field()
	@Column({ type: "varchar", length: 128, })
	imageUrl: string;

	@Field()
	@Column({ type: "varchar", length: 128, })
	thumbnailUrl: string;

	@Field()
	@Column({ type: "varchar", length: 128, })
	alt: string;

	@Field()
	@Column({ type: "boolean", default: false, })
	isFeatured: boolean;

	@Field(() => Int)
	@Column({ type: "integer" })
	position: number;

	@Field(() => ProductVariantImageDimensions)
	@Column(() => ProductVariantImageDimensions)
	dimensions: ProductVariantImageDimensions;

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

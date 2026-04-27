import { Field, ObjectType } from "@nestjs/graphql";

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

import { ProductReview } from "./product-review.entity";

@ObjectType()
@Entity({ name: "product_review_images" })
export class ProductReviewImage {
	@Exclude()
	@PrimaryGeneratedColumn()
	id: number;

	@Field()
	@Column({ type: "uuid", nullable: false, unique: true, })
	uuid: string;

	@ManyToOne(() => ProductReview, (review) => review.images, { onDelete: "CASCADE" })
	@Index()
	review: ProductReview;

	@Field()
	@Column({ type: "varchar", length: 256, nullable: true, })
	imageUrl: string;

	@Field()
	@Column({ type: "varchar", length: 256, nullable: true, })
	thumbnailUrl: string;

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

import { Field, Int, ObjectType } from "@nestjs/graphql";

import {
	Column,
	CreateDateColumn,
	Entity,
	Index,
	ManyToOne,
	OneToMany,
	PrimaryGeneratedColumn,
	UpdateDateColumn,
} from "typeorm";

import { Exclude } from "class-transformer";

import { Product } from "./product.entity";
import { Customer } from "../../customers/entities/customer.entity";
import { ProductReviewImage } from "./product-review-image.entity";

@ObjectType()
@Entity({ name: "product_reviews" })
export class ProductReview {
	@Exclude()
	@PrimaryGeneratedColumn()
	id: number;

	@Field()
	@Column({ type: "uuid", nullable: false, unique: true, })
	uuid: string;

	@Field(() => Customer)
	@ManyToOne(() => Customer, (customer) => customer.reviews, { onDelete: "CASCADE", })
	@Index()
	customer: Customer;

	@ManyToOne(() => Product, (product) => product.reviews, { onDelete: "CASCADE", })
	@Index()
	product: Product;

	@Field(() => Int)
	@Column({ type: "integer", default: 1, })
	rating: number;

	@Field()
	@Column({ type: "varchar", length: 512, })
	comment: string;

	@Field()
	@Column({ type: "boolean", default: false, })
	isEdited: boolean;

	@Field(() => [ProductReviewImage])
	@OneToMany(() => ProductReviewImage, (image) => image.review, { cascade: true, })
	images: Array<ProductReviewImage>;

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

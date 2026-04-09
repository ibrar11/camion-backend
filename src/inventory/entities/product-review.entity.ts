import { Field, Int, ObjectType } from "@nestjs/graphql";

import {
	Column,
	CreateDateColumn,
	Entity,
	ManyToOne,
	PrimaryGeneratedColumn,
	UpdateDateColumn,
} from "typeorm";

import { Exclude } from "class-transformer";

import { Product } from "./product.entity";
import { Customer } from "src/customers/entities/customer.entity";

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
	customer: Customer;

	@ManyToOne(() => Product, (product) => product.variants, { onDelete: "CASCADE", })
	product: Product;

	@Field(() => Int)
	@Column({ type: "numeric", default: 1, })
	rating: number;

	@Field()
	@Column({ type: "varchar", length: 512, })
	comment: string;

	@Field()
	@Column({ type: "boolean", default: false, })
	isEdited: boolean;

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

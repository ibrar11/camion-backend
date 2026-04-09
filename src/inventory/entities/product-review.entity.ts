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

@Entity({ name: "product_reviews" })
export class ProductReview {
	@Exclude()
	@PrimaryGeneratedColumn()
	id: number;

	@Column({ type: "uuid", nullable: false, unique: true, })
	uuid: string;

	@ManyToOne(() => Customer, (customer) => customer.reviews, { onDelete: "CASCADE", })
	customer: Customer;

	@ManyToOne(() => Product, (product) => product.variants, { onDelete: "CASCADE", })
	product: Product;

	@Column()
	rating: number;

	@Column({ type: "varchar", length: 512, })
	comment: string;

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

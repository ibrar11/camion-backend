import { Exclude } from "class-transformer";
import { Column, CreateDateColumn, Entity, Index, ManyToOne, PrimaryGeneratedColumn, Unique, UpdateDateColumn } from "typeorm";
import { Product } from "./product.entity";
import { Category } from "./category.entity";
import {
	Field,
	ObjectType
} from "@nestjs/graphql";

@ObjectType()
@Entity({ name: "product_categories" })
@Unique(["product", "category"])
export class ProductCategory {
	@PrimaryGeneratedColumn()
	id: number;

	@ManyToOne(() => Product, (product) => product.productCategories, { onDelete: "CASCADE", })
	@Index()
	product: Product;

	@Field(() => Category)
	@ManyToOne(() => Category, (category) => category.productCategories, { onDelete: "CASCADE" })
	@Index()
	category: Category;

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

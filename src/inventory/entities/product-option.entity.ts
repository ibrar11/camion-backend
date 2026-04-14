import {
	ObjectType,
	Field,
	Int,
} from "@nestjs/graphql";

import {
	Column,
	CreateDateColumn,
	Entity,
	ManyToOne,
	OneToMany,
	PrimaryGeneratedColumn,
	UpdateDateColumn,
} from "typeorm";

import { Exclude } from "class-transformer";

import { Product } from "./product.entity";
import { ProductOptionValue } from "./product-option-value.entity";

@ObjectType()
@Entity({ name: "product_options", })
export class ProductOption {
	@Exclude()
	@PrimaryGeneratedColumn()
	id: number;

	@Field()
	@Column({ type: "uuid", nullable: false, unique: true, })
	uuid: string;

	@ManyToOne(() => Product, (product) => product.options, { onDelete: "CASCADE", })
	product: Product;

	@Field(() => String, { name: "name" })
	name: string;

	@Field()
	@Column({ type: "varchar", length: 64, })
	nameEn: string;

	@Field()
	@Column({ type: "varchar", length: 64, })
	nameAr: string;

	@Field(() => Int)
	@Column({ type: "integer" })
	position: number;

	@Field(() => [ProductOptionValue])
	@OneToMany(() => ProductOptionValue, (value) => value.option, { cascade: true, })
	values: Array<ProductOptionValue>;

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

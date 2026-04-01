import {
	Field,
	ObjectType,
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

import { ProductCategory } from "./product-category.entity";

@ObjectType()
@Entity({ name: "categories", })
export class Category {
	@Exclude()
	@PrimaryGeneratedColumn()
	id: number;

	@Field()
	@Column({ type: "uuid", nullable: false, unique: true, })
	uuid: string;

	@ManyToOne(() => Category, (category) => category.children, { onDelete: "SET NULL", })
	parent: Category | null;

	@Field()
	@Column({ type: "varchar", length: 64, nullable: false, unique: true, })
	slug: string;

	@Field(() => String, { name: "name", })
	name: string;

	@Field()
	@Column({ type: "varchar", length: 32, })
	nameEn: string;

	@Field()
	@Column({ type: "varchar", length: 32, })
	nameAr: string;

	@Column({ type: "numeric" })
	pricingFactor: number;

	@Exclude()
	@Column({ nullable: true, })
	parentId: number | null;

	@Field(() => [Category])
	@OneToMany(() => Category, (category) => category.parent)
	children: Array<Category>;

	@OneToMany(() => ProductCategory, (productCategory) => productCategory.category)
	productCategories: Array<ProductCategory>;

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

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

import { ProductOption } from "./product-option.entity";
import { ProductVariantOptionValue } from "./product-variant-option-value.entity";

@ObjectType()
@Entity({ name: "product_option_values", })
export class ProductOptionValue {
	@Exclude()
	@PrimaryGeneratedColumn()
	id: number;

	@Field()
	@Column({ type: "uuid", nullable: false, unique: true, })
	uuid: string;

	@ManyToOne(() => ProductOption, (option) => option.values, { onDelete: "CASCADE" })
	option: ProductOption;

	@Field(() => String, { name: "value", })
	value: string;

	@Field()
	@Column({ type: "varchar", length: 64, })
	valueEn: string;

	@Field()
	@Column({ type: "varchar", length: 64, })
	valueAr: string;

	@Field(() => Int)
	@Column({ type: "integer" })
	position: number;

	@OneToMany(() => ProductVariantOptionValue, (productVariantOptionValue) => productVariantOptionValue.optionValue)
	variantLinks: Array<ProductVariantOptionValue>;

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

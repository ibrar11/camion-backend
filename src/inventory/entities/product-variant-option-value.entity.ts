import {
	Field,
	ObjectType,
} from "@nestjs/graphql";

import {
	CreateDateColumn,
	Entity,
	Index,
	ManyToOne,
	PrimaryGeneratedColumn,
	UpdateDateColumn,
} from "typeorm";

import { Exclude } from "class-transformer";

import { ProductVariant } from "./product-variant.entity";
import { ProductOptionValue } from "./product-option-value.entity";

@ObjectType()
@Entity({ name: "product_variant_option_values" })
export class ProductVariantOptionValue {
	@Exclude()
	@PrimaryGeneratedColumn()
	id: number;

	@ManyToOne(() => ProductVariant, (variant) => variant.optionValues, { onDelete: "CASCADE", })
	@Index()
	variant: ProductVariant;

	@Field(() => ProductOptionValue)
	@ManyToOne(() => ProductOptionValue, (productOptionValue) => productOptionValue.variantLinks)
	@Index()
	optionValue: ProductOptionValue;

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

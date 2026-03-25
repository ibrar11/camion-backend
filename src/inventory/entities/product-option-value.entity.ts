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

@Entity({ name: "product_option_values", })
export class ProductOptionValue {
	@Exclude()
	@PrimaryGeneratedColumn()
	id: number;

	@Column({ type: "uuid", nullable: false, unique: true, })
	uuid: string;

	@Column({ type: "varchar", length: 64, })
	value: string;

	@Column({ type: "numeric" })
	position: number;

	@ManyToOne(() => ProductOption, (option) => option.values, { onDelete: "CASCADE" })
	option: ProductOption;

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

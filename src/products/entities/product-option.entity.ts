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

@Entity({ name: "product_options", })
export class ProductOption {
	@Exclude()
	@PrimaryGeneratedColumn()
	id: number;

	@Column({ type: "uuid", nullable: false, unique: true, })
	uuid: string;

	@Column({ type: "varchar", length: 64, })
	name: string;

	@Column({ type: "numeric" })
	position: number;

	@ManyToOne(() => Product, (product) => product.options, { onDelete: "CASCADE", })
	product: Product;

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

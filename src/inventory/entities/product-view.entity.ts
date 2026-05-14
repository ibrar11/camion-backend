import {
	Column,
	CreateDateColumn,
	Entity,
	ManyToOne,
	PrimaryGeneratedColumn,
	Unique,
	UpdateDateColumn,
} from "typeorm";

import { Exclude } from "class-transformer";

import { Product } from "./product.entity";
import { Customer } from "../../customers/entities/customer.entity";

@Entity({ name: "product_views" })
@Unique(["product", "customer"])
export class ProductView {
	@Exclude()
	@PrimaryGeneratedColumn()
	id: number;

	@Column({ type: "uuid", nullable: false, unique: true, })
	uuid: string;

	@ManyToOne(() => Product, (product) => product.views, { onDelete: 'CASCADE', })
	product: Product;

	@ManyToOne(() => Customer, (customer) => customer.views, { onDelete: 'CASCADE', })
	customer: Customer;

	@Column({ type: "integer", nullable: false, default: 0, })
	viewsCount: number;

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

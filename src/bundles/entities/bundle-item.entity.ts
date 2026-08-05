import { ObjectType } from "@nestjs/graphql";
import { Exclude } from "class-transformer";
import { Column, Entity, Index, JoinColumn, ManyToOne, PrimaryGeneratedColumn, Unique } from "typeorm";
import { Bundle } from "./bundle.entity";
import { Product } from "src/inventory/entities/product.entity";

@ObjectType()
@Entity({ name: "bundle_products" })
@Unique([""])
export class BundleItem {
	@Exclude()
	@PrimaryGeneratedColumn()
	id: number;

	@Column({ type: "uuid", nullable: false, unique: true, })
	uuid: string;

	@ManyToOne(() => Bundle, (bundle) => bundle.items, { onDelete: "CASCADE", })
	@JoinColumn({ name: "bundle_id" })
	@Index()
	bundle: Bundle;


	@ManyToOne(() => Product, (product) => product.bundleItems, { onDelete: "CASCADE" })
	@JoinColumn({ name: "product_id" })
	product: Product;

	@Column({ type: "integer", default: 1, })
	quantity: number;
}

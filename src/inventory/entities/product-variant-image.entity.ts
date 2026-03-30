import {
	Column,
	CreateDateColumn,
	Entity,
	ManyToOne,
	PrimaryGeneratedColumn,
	UpdateDateColumn,
} from "typeorm";

import { Exclude } from "class-transformer";

import { ProductVariant } from "./product-variant.entity";

export class Dimensions {
	@Column({ type: "numeric", })
	width: number;

	@Column({ type: "numeric", })
	height: number;
}

@Entity({ name: "product_variant_images", })
export class ProductVariantImage {
	@Exclude()
	@PrimaryGeneratedColumn()
	id: number;

	@Column({ type: "uuid", nullable: false, unique: true, })
	uuid: string;

	@Column({ type: "varchar", length: 64, })
	uri: string;

	@Column({ type: "varchar", length: 128, })
	alt: string;

	@Column({ type: "numeric" })
	position: number;

	@Column(() => Dimensions)
	dimensions: Dimensions;

	@ManyToOne(() => ProductVariant, (variant) => variant.images, { onDelete: "CASCADE", })
	variant: ProductVariant;

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

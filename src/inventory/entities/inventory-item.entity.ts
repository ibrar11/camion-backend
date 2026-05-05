import {
	Field,
	ObjectType,
} from "@nestjs/graphql";

import {
	Column,
	CreateDateColumn,
	Entity,
	Index,
	OneToMany,
	OneToOne,
	PrimaryGeneratedColumn,
	UpdateDateColumn,
} from "typeorm";

import { Exclude } from "class-transformer";

import { InventoryLevel } from "./inventory-level.entity";
import { ProductVariant } from "./product-variant.entity";

@ObjectType()
@Entity({ name: "inventory_items" })
export class InventoryItem {
	@Exclude()
	@PrimaryGeneratedColumn()
	id: number;

	@Field()
	@Column({ type: "uuid", nullable: false, unique: true, })
	uuid: string;

	@Field()
	@Column()
	sku: string;

	@OneToOne(() => ProductVariant, (variant) => variant.inventoryItem)
	variant: ProductVariant;

	@OneToMany(() => InventoryLevel, (level) => level.inventoryItem)
	levels: Array<InventoryLevel>;

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

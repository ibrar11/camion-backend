import {
	Field,
	Int,
	ObjectType,
} from "@nestjs/graphql";

import {
	Column,
	CreateDateColumn,
	Entity,
	Index,
	ManyToOne,
	PrimaryGeneratedColumn,
	UpdateDateColumn,
} from "typeorm";

import { Exclude } from "class-transformer";

import { InventoryItem } from "./inventory-item.entity";
import { Warehouse } from "./warehouse.entity";

@ObjectType()
@Entity({ name: "inventory_levels" })
export class InventoryLevel {
	@Exclude()
	@PrimaryGeneratedColumn()
	id: number;

	@Field()
	@Column({ type: "uuid", nullable: false, unique: true, })
	uuid: string;

	@ManyToOne(() => InventoryItem, (item) => item.levels)
	@Index()
	inventoryItem: InventoryItem;

	@ManyToOne(() => Warehouse, (warehouse) => warehouse.levels)
	@Index()
	warehouse: Warehouse;

	@Field(() => Int)
	@Column({ type: "integer", default: 0, })
	quantity: number;

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

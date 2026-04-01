import {
	Column,
	CreateDateColumn,
	Entity,
	ManyToOne,
	PrimaryGeneratedColumn,
	UpdateDateColumn,
} from "typeorm";

import { Exclude } from "class-transformer";

import { InventoryItem } from "./inventory-item.entity";
import { Warehouse } from "./warehouse.entity";

@Entity({ name: "inventory_levels" })
export class InventoryLevel {
	@Exclude()
	@PrimaryGeneratedColumn()
	id: number;

	@Column({ type: "uuid", nullable: false, unique: true, })
	uuid: string;

	@Column({ type: "numeric", default: 0, })
	quantity: number;

	@ManyToOne(() => InventoryItem, (item) => item.levels)
	inventoryItem: InventoryItem;

	@ManyToOne(() => Warehouse, (warehouse) => warehouse.levels)
	warehouse: Warehouse;

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

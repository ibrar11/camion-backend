import {
	Column,
	CreateDateColumn,
	Entity,
	OneToMany,
	PrimaryGeneratedColumn,
	UpdateDateColumn
} from "typeorm";

import { Exclude } from "class-transformer";

import { InventoryLevel } from "./inventory-level.entity";

@Entity({ name: "warehouses" })
export class Warehouse {
	@Exclude()
	@PrimaryGeneratedColumn()
	id: number;

	@Column({ type: "uuid", nullable: false, unique: true, })
	uuid: string;

	@Column({ nullable: false, })
	name: string;

	@Column({ nullable: false, })
	code: string;

	@Column({ nullable: false, })
	addressLine1: string;

	@Column({ nullable: true, })
	addressLine2: string;

	@Column()
	country: string;

	@Column()
	state: string;

	@Column()
	city: string;

	@OneToMany(() => InventoryLevel, (level) => level.warehouse)
	levels: Array<InventoryLevel>;

	@Column({ type: "boolean", default: true, })
	isActive: boolean;

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

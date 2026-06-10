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

import { ExportRequestStatus } from "../enums/ExportRequestStatus.enum";
import { ExportRequestFormat } from "../enums/ExportRequestFormat.enum";

import { Category } from "../../inventory/entities/category.entity";

@Entity({ name: "export_requests", })
export class ExportRequest {
	@Exclude()
	@PrimaryGeneratedColumn()
	id: number;

	@Column({ type: "uuid", nullable: false, unique: true, })
	uuid: string;

	@Column({ type: "varchar", length: 64, })
	name: string;

	@Column({
		type: "enum",
		enum: ExportRequestFormat,
		default: ExportRequestFormat.None,
	})
	format: ExportRequestFormat;

	@Column({
		type: "integer",
		default: 0,
		nullable: false,
	})
	pagesCount: number;

	@ManyToOne(() => Category, (category) => category.exportRequests, { onDelete: "CASCADE", })
	@Index()
	category: Category | null;

	@Column({
		type: "varchar",
		length: 128,
		default: "",
	})
	downloadUrl: string;

	@Column({
		type: "enum",
		enum: ExportRequestStatus,
		default: ExportRequestStatus.Pending,
	})
	status: ExportRequestStatus;

	@UpdateDateColumn({
		name: "updated_at",
		type: "timestamptz",
	})
	updatedAt: Date;

	@CreateDateColumn({
		name: "created_at",
		type: "timestamptz",
	})
	createdAt: Date;
}

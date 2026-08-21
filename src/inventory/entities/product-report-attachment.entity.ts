import { Field, ObjectType } from "@nestjs/graphql";

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

import { ProductReport } from "./product-report.entity";
import { ProductReportAttachmentType } from "../enums/ProductReportAttachmentType.enum";

@ObjectType()
@Entity({ name: "product_report_attachments" })
export class ProductReportAttachment {
	@Exclude()
	@PrimaryGeneratedColumn()
	id: number;

	@Field()
	@Column({ type: "uuid", nullable: false, unique: true, })
	uuid: string;

	@ManyToOne(() => ProductReport, (report) => report.attachments, { onDelete: "CASCADE", })
	@Index()
	report: ProductReport;

	@Field()
	@Column({ type: "varchar", length: 256, nullable: false, })
	mediaUrl: string;

	@Field({ nullable: true })
	@Column({ type: "varchar", length: 256, nullable: true, default: null, })
	thumbnailUrl: string | null;

	@Field()
	@Column({
		type: "varchar",
		length: 32,
		default: ProductReportAttachmentType.Image,
	})
	mediaType: ProductReportAttachmentType;

	@Field({ nullable: true })
	@Column({ type: "varchar", length: 256, nullable: true, default: null, })
	fileName: string | null;

	@Field({ nullable: true })
	@Column({ type: "varchar", length: 128, nullable: true, default: null, })
	mimeType: string | null;

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

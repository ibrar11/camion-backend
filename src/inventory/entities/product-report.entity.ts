import { Field, ObjectType } from "@nestjs/graphql";

import {
	Column,
	CreateDateColumn,
	Entity,
	Index,
	ManyToOne,
	OneToMany,
	PrimaryGeneratedColumn,
	UpdateDateColumn,
} from "typeorm";

import { Exclude } from "class-transformer";

import { Customer } from "../../customers/entities/customer.entity";
import { Product } from "./product.entity";
import { ProductReportAttachment } from "./product-report-attachment.entity";

import { ProductReportPriority } from "../enums/ProductReportPriority.enum";
import { ProductReportReason } from "../enums/ProductReportReason.enum";
import { ProductReportStatus } from "../enums/ProductReportStatus.enum";

@ObjectType()
@Entity({ name: "product_reports" })
export class ProductReport {
	@Exclude()
	@PrimaryGeneratedColumn()
	id: number;

	@Field()
	@Column({ type: "uuid", nullable: false, unique: true, })
	uuid: string;

	@Field(() => Customer)
	@ManyToOne(() => Customer, { onDelete: "CASCADE", })
	@Index()
	customer: Customer;

	@Field(() => Product)
	@ManyToOne(() => Product, { onDelete: "CASCADE", })
	@Index()
	product: Product;

	@Field()
	@Column({ type: "varchar", length: 64, nullable: false, })
	reason: ProductReportReason;

	@Field()
	@Column({ type: "varchar", length: 1024, nullable: false, })
	details: string;

	@Field(() => String, { nullable: true })
	@Column({ type: "varchar", length: 128, nullable: true, default: null, })
	orderNumber: string | null;

	@Field()
	@Column({ type: "varchar", length: 32, nullable: false, default: ProductReportStatus.Pending, })
	status: ProductReportStatus;

	@Field()
	@Column({ type: "varchar", length: 32, nullable: false, default: ProductReportPriority.Normal, })
	priority: ProductReportPriority;

	@Exclude()
	@Column({ type: "varchar", length: 256, nullable: false, unique: true, })
	duplicateFingerprint: string;

	@Field(() => [ProductReportAttachment], { nullable: true })
	@OneToMany(() => ProductReportAttachment, (attachment) => attachment.report, { cascade: true, })
	attachments: Array<ProductReportAttachment>;

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

import { Field, ObjectType } from "@nestjs/graphql";

import {
	Column,
	CreateDateColumn,
	Entity,
	Index,
	JoinColumn,
	ManyToOne,
	PrimaryGeneratedColumn,
	UpdateDateColumn,
} from "typeorm";

import { Exclude } from "class-transformer";

import { Product } from "./product.entity";
import { AttachmentMediaType } from "../enums/AttachmentMediaType.enum";

@ObjectType()
@Entity({ name: "product_attachments" })
export class ProductAttachment {
	@Exclude()
	@PrimaryGeneratedColumn()
	id: number;

	@Field()
	@Column({ type: "uuid", nullable: false, unique: true, })
	uuid: string;

	@ManyToOne(() => Product, (product) => product.attachments, { onDelete: "CASCADE", })
	@JoinColumn({ name: "product_id", })
	@Index()
	product: Product;

	@Field()
	@Column({ type: "varchar", length: 256, nullable: false, default: "", })
	mediaUrl: string;

	@Field()
	@Column({
		type: "enum",
		enum: AttachmentMediaType,
		default: AttachmentMediaType.Image,
	})
	mediaType: AttachmentMediaType;

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

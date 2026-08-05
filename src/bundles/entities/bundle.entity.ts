import { Field } from "@nestjs/graphql";

import {
	Column,
	CreateDateColumn,
	Entity,
	OneToMany,
	PrimaryGeneratedColumn,
	UpdateDateColumn,
} from "typeorm";

import { Exclude } from "class-transformer";
import { BundleItem } from "./bundle-item.entity";

@Entity({ name: "bundles" })
export class Bundle {
	@Exclude()
	@PrimaryGeneratedColumn()
	id: number;

	@Field()
	@Column({ type: "uuid", nullable: false, unique: true, })
	uuid: string;

	@Field(() => String, { name: "title", })
	title: string;

	@Field()
	@Column()
	titleEn: string;

	@Field()
	@Column()
	titleAr: string;

	@Field(() => String, { name: "brief" })
	brief: string;

	@Field(() => String)
	@Column({ type: "varchar", length: 256, })
	briefEn: string;

	@Field(() => String)
	@Column({ type: "varchar", length: 256, })
	briefAr: string;

	@Column({ type: "varchar", length: 64, nullable: false, unique: true, })
	slug: string;

	@Column({ type: "numeric", default: 1, })
	pricingFactor: number;

	@Column({ type: "numeric", default: 0, })
	discountPercentage: number;

	@OneToMany(() => BundleItem, item => item.bundle, { cascade: true, })
	items: Array<BundleItem>;

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

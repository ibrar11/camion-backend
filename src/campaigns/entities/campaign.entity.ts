import {
	Field,
	Int,
	ObjectType,
} from "@nestjs/graphql";

import {
	Column,
	CreateDateColumn,
	Entity,
	OneToMany,
	PrimaryGeneratedColumn,
	UpdateDateColumn,
} from "typeorm";

import { Exclude } from "class-transformer";

import { CampaignCategory } from "./campaign-category.entity";

@ObjectType()
@Entity({ name: "campaigns", })
export class Campaign {
	@Exclude()
	@PrimaryGeneratedColumn()
	id: number;

	@Field()
	@Column({ type: "uuid", nullable: false, unique: true, })
	uuid: string;

	@Field()
	name: string;

	@Column({ type: "varchar", length: 64, })
	nameEn: string;

	@Column({ type: "varchar", length: 64, })
	nameAr: string;

	@Field(() => String, { name: "brief" })
	brief: string;

	@Field(() => String)
	@Column({ type: "varchar", default: "", length: 256, })
	briefEn: string;

	@Field(() => String)
	@Column({ type: "varchar", default: "", length: 256, })
	briefAr: string;

	@Field()
	@Column({ type: "varchar", length: 64, nullable: false, unique: true, })
	slug: string;

	@Column({ type: "numeric", default: 0, })
	pricingFactor: number;

	@Field(() => Int)
	@Column({ type: "numeric", default: 0, nullable: false, })
	discountPercentage: number;

	@Field()
	@Column({ type: "timestamptz", nullable: false, })
	startsAt: Date;

	@Field()
	@Column({ type: "timestamptz", nullable: false, })
	finishesAt: Date;

	@Field(() => Boolean)
	@Column({ type: "boolean", default: true, })
	isActive: boolean;

	@Field(() => Boolean)
	@Column({ type: "boolean", default: false, })
	isFeatured: boolean;

	@Field(() => [CampaignCategory])
	@OneToMany(() => CampaignCategory, (campaignCategory) => campaignCategory.campaign, { cascade: true, })
	campaignCategories: Array<CampaignCategory>;

	@Column({ type: "timestamptz", nullable: true, default: null })
	cartAdjustedAt: Date | null;

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

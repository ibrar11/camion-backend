import { Field, ObjectType } from "@nestjs/graphql";

import {
	CreateDateColumn,
	Entity,
	Index,
	JoinColumn,
	ManyToOne,
	PrimaryGeneratedColumn,
	Unique,
	UpdateDateColumn,
} from "typeorm";

import { Exclude } from "class-transformer";

import { Category } from "../../inventory/entities/category.entity";

import { Campaign } from "./campaign.entity";

@ObjectType()
@Entity({ name: "campaign_category", })
@Unique(["campaign", "category"])
export class CampaignCategory {
	@Exclude()
	@PrimaryGeneratedColumn()
	id: number;

	@ManyToOne(() => Campaign, (campaign) => campaign.campaignCategories, { onDelete: "CASCADE", })
	@JoinColumn({ name: "campaign_id", })
	@Index()
	campaign: Campaign;

	@Field(() => Category)
	@ManyToOne(() => Category, (category) => category.campaignCategories, { onDelete: "CASCADE", })
	@JoinColumn({ name: "category_id", })
	@Index()
	category: Category;

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

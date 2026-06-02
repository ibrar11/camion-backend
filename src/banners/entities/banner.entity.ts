import {
	ObjectType,
	Field,
} from "@nestjs/graphql";

import {
	Column,
	CreateDateColumn,
	Entity,
	Index,
	OneToMany,
	PrimaryGeneratedColumn,
	UpdateDateColumn,
} from "typeorm";

import { Exclude } from "class-transformer";

import { BannerCategory } from "./banner-category";

@ObjectType()
@Entity({ name: "banners" })
export class Banner {
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

	@Field()
	imageUrl: string;

	@Field()
	@Column({ type: "varchar", length: 256, nullable: false, default: "", })
	imageUrlEn: string;

	@Field()
	@Column({ type: "varchar", length: 256, nullable: false, default: "", })
	imageUrlAr: string;

	@Field()
	linkUrl: string;

	@Field()
	@Column({ type: "varchar", length: 256, nullable: false, default: "", })
	linkUrlEn: string;

	@Field()
	@Column({ type: "varchar", length: 256, nullable: false, default: "", })
	linkUrlAr: string;

	@Field()
	@Column({ default: "homepage" })
	@Index()
	placement: string;

	@Field()
	@Column({ default: "#000000", })
	color: string;

	@Field()
	@Column({ default: true, })
	isActive: boolean;

	@OneToMany(() => BannerCategory, (bannerCategory) => bannerCategory.banner, { cascade: true, })
	bannerCategories: Array<BannerCategory>;

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

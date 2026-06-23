import {
	Field,
	ObjectType,
} from "@nestjs/graphql";

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

import { ProductCategory } from "./product-category.entity";
import { BannerCategory } from "src/banners/entities/banner-category";
import { ExportRequest } from "src/export-requests/entities/export-request.entity";
import { CampaignCategory } from "src/campaigns/entities/campaign-category.entity";

@ObjectType()
@Entity({ name: "categories", })
@Index("IDX_CATEGORIES_FEATURED", ["isFeatured"], {
	where: `"is_featured" = true`,
})
export class Category {
	@Exclude()
	@PrimaryGeneratedColumn()
	id: number;

	@Field()
	@Column({ type: "uuid", nullable: false, unique: true, })
	uuid: string;

	@ManyToOne(() => Category, (category) => category.children, { onDelete: "SET NULL", })
	@Index()
	parent: Category | null;

	@Field()
	@Column({ type: "varchar", length: 64, nullable: false, unique: true, })
	slug: string;

	@Field(() => String, { name: "name", })
	name: string;

	@Field()
	@Column({ type: "varchar", length: 32, })
	nameEn: string;

	@Field()
	@Column({ type: "varchar", length: 32, })
	nameAr: string;

	@Column({ type: "numeric", default: 1, })
	pricingFactor: number;

	@Column({ type: "numeric", default: 0, })
	discountPercentage: number;

	@Field({ nullable: true, })
	@Column({ type: "varchar", length: 256, nullable: true, })
	thumbnailUrl: string;

	@Field()
	@Column({ name: "is_featured", type: "boolean", default: false, })
	isFeatured: boolean;

	@Column({ name: "is_featured_on_homepage", type: "boolean", default: false, })
	@Index()
	isFeaturedOnHomepage: boolean;

	@Exclude()
	@Column({ nullable: true, })
	parentId: number | null;

	@Field(() => [Category])
	@OneToMany(() => Category, (category) => category.parent)
	children: Array<Category>;

	@Field()
	@Column({ name: "products_count", type: "int", default: 0, })
	productsCount: number;

	@OneToMany(() => ProductCategory, (productCategory) => productCategory.category)
	productCategories: Array<ProductCategory>;

	@OneToMany(() => BannerCategory, (bannerCategory) => bannerCategory.category)
	bannerCategories: Array<BannerCategory>;

	@OneToMany(() => CampaignCategory, (campaignCategory) => campaignCategory.category)
	campaignCategories: Array<CampaignCategory>;

	@OneToMany(() => ExportRequest, (exportRequest) => exportRequest.category, { cascade: true, })
	exportRequests: Array<ExportRequest>;

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

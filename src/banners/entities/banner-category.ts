import { CreateDateColumn, Entity, Index, ManyToOne, PrimaryGeneratedColumn, Unique, UpdateDateColumn } from "typeorm";
import { Banner } from "./banner.entity";
import { Category } from "src/inventory/entities/category.entity";
import { Exclude } from "class-transformer";

@Entity({ name: "banner_categories", })
@Unique(["banner", "category"])
export class BannerCategory {
	@PrimaryGeneratedColumn()
	id: number;

	@ManyToOne(() => Banner, (banner) => banner.bannerCategories, { onDelete: "CASCADE", })
	@Index()
	banner: Banner;

	@ManyToOne(() => Category, (category) => category.bannerCategories, { onDelete: "CASCADE", })
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

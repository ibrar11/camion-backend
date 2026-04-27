import {
	Inject,
	UseGuards,
} from "@nestjs/common";

import {
	Args,
	ArgsType,
	Field,
	Int,
	Parent,
	Query,
	ResolveField,
	Resolver,
} from "@nestjs/graphql";

import { Category } from "./entities/category.entity";
import { CategoriesService } from "./categories.service";

import { GqlAuthGuard } from "../auth/gql.guard";

@ArgsType()
export class GetCategoriesArgs {
	@Field({ defaultValue: "en", })
	language: string;

	@Field(() => Int, { defaultValue: 1, })
	pageNumber: number;

	@Field(() => Int, { defaultValue: 100, })
	itemsPerPage: number;
}

@UseGuards(GqlAuthGuard)
@Resolver(() => Category)
export class CategoriesResolver {
	constructor(@Inject(CategoriesService) private readonly categoriesService: CategoriesService) { }

	@ResolveField("name", () => String)
	getName(@Parent() category: Category, @Args() args: GetCategoriesArgs): string {
		const locale = args.language.toLowerCase() || "en";

		const nameMap = {
			"en": category.nameEn,
			"ar": category.nameAr,
		};

		return nameMap[locale] ?? category.nameEn;
	}

	@ResolveField("thumbnailUrl", () => String)
	getThumbnailUrl(@Parent() category: Category): string {
		if (category === null || category.thumbnailUrl === null) {
			return "";
		}

		const segments = category.thumbnailUrl.split("/");
		if (category.thumbnailUrl.startsWith("https://")) {
			return `https://assets.dev.camiontrading.com/${segments[3]}/${segments[4]}`;
		} else if (category.thumbnailUrl.startsWith("s3://")) {
			return `https://assets.dev.camiontrading.com/${segments[2]}/${segments[3]}`;
		}

		return "";
	}

	@Query(() => [Category])
	getCategories(@Args() args: GetCategoriesArgs): Promise<Array<Category>> {
		return this.categoriesService.findAll("", "", args.pageNumber, args.itemsPerPage);
	}

	@Query(() => [Category])
	getFeaturedCategories(@Args() args: GetCategoriesArgs): Promise<Array<Category>> {
		return this.categoriesService.findAllFeatured(args.pageNumber, args.itemsPerPage);
		// console.log(x);
		// return x;
	}
}

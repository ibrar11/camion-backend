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
import { ConfigService } from "@nestjs/config";

@ArgsType()
export class GetCategoriesArgs {
	@Field({ defaultValue: "en", })
	language: string;

	@Field(() => Int, { defaultValue: 1, })
	pageNumber: number;

	@Field(() => Int, { defaultValue: 24, })
	itemsPerPage: number;
}

@UseGuards(GqlAuthGuard)
@Resolver(() => Category)
export class CategoriesResolver {
	assetsHost: string = "";

	constructor(
		@Inject(CategoriesService) private readonly categoriesService: CategoriesService,
		private readonly configService: ConfigService,
	) {
		this.assetsHost = this.configService.get<string>('ASSETS_HOST') as string;
	}

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
			return `${this.assetsHost}/${segments[3]}/${segments[4]}`;
		} else if (category.thumbnailUrl.startsWith("s3://")) {
			return `${this.assetsHost}/${segments[2]}/${segments[3]}`;
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
	}
}

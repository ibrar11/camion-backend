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

	@Query(() => [Category])
	getCategories(@Args() args: GetCategoriesArgs): Promise<Array<Category>> {
		return this.categoriesService.findAll("", "", args.pageNumber, args.itemsPerPage);
	}
}

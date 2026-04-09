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

import { Banner } from "./entities/banner.entity";
import { BannersService } from "./banners.service";

import { GqlAuthGuard } from "../auth/gql.guard";

@ArgsType()
export class GetBannersArgs {
	@Field({ defaultValue: "en-us", })
	locale: string;

	@Field({ defaultValue: "" })
	filters: string;

	@Field({ defaultValue: "" })
	sort: string;

	@Field(() => Int, { defaultValue: 1, })
	pageNumber: number;

	@Field(() => Int, { defaultValue: 100, })
	itemsPerPage: number;
}

@UseGuards(GqlAuthGuard)
@Resolver(() => Banner)
export class BannersResolver {
	constructor(@Inject(BannersService) private readonly bannersService: BannersService) { }

	@ResolveField("title", () => String)
	getTitle(@Parent() banner: Banner, @Args() args: GetBannersArgs): string {
		const locale = args.locale.toLowerCase() || "en-us";

		const titleMap = {
			"en-us": banner.titleEn,
			"ar-qa": banner.titleAr,
		};

		return titleMap[locale] ?? banner.titleEn;
	}

	@Query(() => [Banner])
	getBanners(@Args() args: GetBannersArgs): Promise<Array<Banner>> {
		return this.bannersService.findAll(args.filters, args.sort, args.pageNumber, args.itemsPerPage);
	}
}

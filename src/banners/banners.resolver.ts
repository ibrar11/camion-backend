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
	@Field({ defaultValue: "en", })
	language: string;

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
		const language = args.language.toLowerCase() || "en";

		const titleMap = {
			"en": banner.titleEn,
			"ar": banner.titleAr,
		};

		return titleMap[language] ?? banner.titleEn;
	}

	@ResolveField("imageUrl", () => String)
	getImageUrl(@Parent() banner: Banner): string {
		if (banner === null || banner.imageUrl === null) {
			return "";
		}

		const segments = banner.imageUrl.split("/");
		if (banner.imageUrl.startsWith("https://")) {
			return `https://assets.dev.camiontrading.com/${segments[3]}/${segments[4]}`;
		} else if (banner.imageUrl.startsWith("s3://")) {
			return `https://assets.dev.camiontrading.com/${segments[2]}/${segments[3]}`;
		}

		return "";
	}

	@Query(() => [Banner])
	getBanners(@Args() args: GetBannersArgs): Promise<Array<Banner>> {
		return this.bannersService.findAll("", "", args.pageNumber, args.itemsPerPage);
	}
}

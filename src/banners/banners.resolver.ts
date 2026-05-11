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
import { ConfigService } from "@nestjs/config";

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
	assetsHost: string = "";

	constructor(
		@Inject(BannersService) private readonly bannersService: BannersService,
		private readonly configService: ConfigService,
	) {
		this.assetsHost = this.configService.get<string>('ASSETS_HOST') as string;
	}

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
	getImageUrl(@Parent() banner: Banner, @Args() args: GetBannersArgs): string {
		if (banner === null) {
			return "";
		}

		const language = args.language.toLowerCase() || "en";

		const imageUrlMap = {
			"en": banner.imageUrlEn,
			"ar": banner.imageUrlAr,
		};

		const imageUrl = imageUrlMap[language] ?? banner.imageUrlEn;
		if (imageUrl === null || imageUrl === undefined || imageUrl.length === 0) {
			return "";
		}

		const segments = imageUrl.split("/");
		if (imageUrl.startsWith("https://")) {
			return `${this.assetsHost}/${segments[3]}/${segments[4]}`;
		} else if (imageUrl.startsWith("s3://")) {
			return `${this.assetsHost}/${segments[2]}/${segments[3]}`;
		}

		return "";
	}

	@Query(() => [Banner])
	getBanners(@Args() args: GetBannersArgs): Promise<Array<Banner>> {
		return this.bannersService.findAll("", "", args.pageNumber, args.itemsPerPage);
	}
}

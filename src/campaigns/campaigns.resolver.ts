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

import {
	Inject,
	UseGuards,
} from "@nestjs/common";

import dayjs from "dayjs";

import { Campaign } from "./entities/campaign.entity";
import { CampaignsService } from "./campaigns.service";

import { GqlAuthGuard } from "../auth/gql.guard";

@ArgsType()
export class GetCampaignsArgs {
	@Field({ defaultValue: "en", })
	language: string;

	@Field(() => Int, { defaultValue: 1, })
	pageNumber: number;

	@Field(() => Int, { defaultValue: 24, })
	itemsPerPage: number;
}

@ArgsType()
export class GetFeaturedCampaignArgs {
	@Field({ defaultValue: "en", })
	language: string;
}

@UseGuards(GqlAuthGuard)
@Resolver(() => Campaign)
export class CampaignsResolver {
	constructor(@Inject(CampaignsService) private readonly campaignsService: CampaignsService) { }

	@ResolveField("name", () => String)
	getName(@Parent() campaign: Campaign, @Args() args: GetFeaturedCampaignArgs): string {
		const language = args.language.toLowerCase() || "en";

		const nameMap = {
			"en": campaign.nameEn,
			"ar": campaign.nameAr,
		};

		return nameMap[language] ?? campaign.nameEn;
	}

	@ResolveField("startsAt", () => String)
	getStartsAt(@Parent() campaign: Campaign): string {
		return dayjs(campaign.startsAt).toISOString();
	}

	@ResolveField("finishesAt", () => String)
	getFinishesAt(@Parent() campaign: Campaign): string {
		return dayjs(campaign.finishesAt).toISOString();
	}

	@Query(() => [Campaign])
	getCampaigns(@Args() args: GetCampaignsArgs): Promise<Array<Campaign>> {
		return this.campaignsService.findAll("", "", args.pageNumber, args.itemsPerPage);
	}

	@Query(() => Campaign)
	getFeaturedCampaign(@Args() args: GetFeaturedCampaignArgs): Promise<Campaign> {
		return this.campaignsService.findOneFeatured();
	}
}

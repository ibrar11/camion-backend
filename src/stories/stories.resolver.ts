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

import { Story } from "./entities/story.entity";
import { StoriesService } from "./stories.service";

import { GqlAuthGuard } from "../auth/gql.guard";

@ArgsType()
export class GetStoriesArgs {
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
@Resolver(() => Story)
export class StoriesResolver {
	constructor(@Inject(StoriesService) private readonly storiesService: StoriesService) { }

	@ResolveField("caption", () => String)
	getCaption(@Parent() story: Story, @Args() args: GetStoriesArgs): string {
		const locale = args.locale.toLowerCase() || "en-us";

		const captionMap = {
			"en-us": story.captionEn,
			"ar-qa": story.captionAr,
		};

		return captionMap[locale] ?? story.captionEn;
	}

	@Query(() => [Story])
	getStories(@Args() args: GetStoriesArgs): Promise<Array<Story>> {
		return this.storiesService.findAll(args.filters, args.sort, args.pageNumber, args.itemsPerPage);
	}
}

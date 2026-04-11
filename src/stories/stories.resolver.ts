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
	@Field({ defaultValue: "en", })
	language: string;

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
		const language = args.language.toLowerCase() || "en";

		const captionMap = {
			"en": story.captionEn,
			"ar": story.captionAr,
		};

		return captionMap[language] ?? story.captionEn;
	}

	@Query(() => [Story])
	getStories(@Args() args: GetStoriesArgs): Promise<Array<Story>> {
		return this.storiesService.findAll("", "", args.pageNumber, args.itemsPerPage);
	}
}

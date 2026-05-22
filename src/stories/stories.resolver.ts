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
import { StoryFrame } from "./entities/story-frame.entity";
import { retry } from "rxjs";
import { ConfigService } from "@nestjs/config";

@ArgsType()
export class GetStoriesArgs {
	@Field({ defaultValue: "en", })
	language: string;

	@Field(() => Int, { defaultValue: 1, })
	pageNumber: number;

	@Field(() => Int, { defaultValue: 24, })
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

@UseGuards(GqlAuthGuard)
@Resolver(() => StoryFrame)
export class FramesResolver {
	assetsHost: string = "";

	constructor(private readonly configService: ConfigService) {
		this.assetsHost = this.configService.get<string>('ASSETS_HOST') as string;
	}

	@ResolveField("mediaUrl", () => String)
	getMediaUrl(@Parent() frame: StoryFrame): string {
		if (frame === null || frame.mediaUrl === null) {
			return "";
		}

		const segments = frame.mediaUrl.split("/");
		if (frame.mediaUrl.startsWith("https://")) {
			return `${this.assetsHost}/${segments[3]}/${segments[4]}`;
		} else if (frame.mediaUrl.startsWith("s3://")) {
			return `${this.assetsHost}/${segments[2]}/${segments[3]}`;
		}

		return "";
	}

	@ResolveField("thumbnailUrl", () => String)
	getThumbnailUrl(@Parent() frame: StoryFrame): string {
		if (frame === null || frame.thumbnailUrl === null) {
			return "";
		}

		const segments = frame.thumbnailUrl.split("/");
		if (frame.thumbnailUrl.startsWith("https://")) {
			return `${this.assetsHost}/${segments[3]}/${segments[4]}`;
		} else if (frame.thumbnailUrl.startsWith("s3://")) {
			return `${this.assetsHost}/${segments[2]}/${segments[3]}`;
		}

		return "";
	}
}

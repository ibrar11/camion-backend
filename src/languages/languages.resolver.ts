import { Inject, UseGuards } from "@nestjs/common";

import {
	ArgsType,
	Field,
	Query,
	Resolver,
} from "@nestjs/graphql";

import { GqlAuthGuard } from "src/auth/gql.guard";

import { Language } from "./entities/language.entity";
import { LanguagesService } from "./languages.service";

@ArgsType()
export class GetLanguageArgs {
	@Field()
	uuid: string;
}

@UseGuards(GqlAuthGuard)
@Resolver(() => Language)
export class LanguagesResolver {
	constructor(@Inject(LanguagesService) private readonly languagesService: LanguagesService) {}

	@Query(() => [Language])
	getLanguages(): Promise<Language[]> {
		return this.languagesService.getAllLanguages();
	}

}

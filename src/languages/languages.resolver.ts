import { Inject } from "@nestjs/common";

import {
	Query,
	Resolver,
} from "@nestjs/graphql";

import { Language } from "./entities/language.entity";
import { LanguagesService } from "./languages.service";

@Resolver(() => Language)
export class LanguagesResolver {
	constructor(@Inject(LanguagesService) private readonly languagesService: LanguagesService) { }

	@Query(() => [Language])
	getLanguages(): Promise<Language[]> {
		return this.languagesService.getAllLanguages();
	}
}

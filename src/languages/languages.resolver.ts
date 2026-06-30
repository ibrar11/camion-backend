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
	async getLanguages(): Promise<Language[]> {
		let languages = await this.languagesService.getAllLanguages();

		// Filter the french out
		if (Array.isArray(languages) && languages.length !== 0) {
			languages = languages.filter(language => ["English", "Arabic"].includes(language.name));
		}

		return languages;
	}
}

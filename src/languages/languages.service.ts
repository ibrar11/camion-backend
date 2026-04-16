import crypto from "node:crypto";

import {
	ConflictException,
	Injectable,
	NotFoundException,
} from "@nestjs/common";

import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";

import { CreateLanguageDto } from "./dtos/CreateLanguageDto";
import { UpdateLanguageDto } from "./dtos/UpdateLanguageDto";

import { Language } from "./entities/language.entity";

@Injectable()
export class LanguagesService {
	constructor(
		@InjectRepository(Language)
		private readonly languageRepository: Repository<Language>,
	) {}

	/**
	 * Create a new language
	 * @param body
	 * @returns Language
	 */
	async create(body: CreateLanguageDto): Promise<Language> {
		const shortCode = body.shortCode.trim().toLowerCase();

		const existing = await this.languageRepository.findOneBy({ shortCode });
		if (existing) {
			throw new ConflictException({
				error: "A language with this short code already exists.",
			});
		}

		const language = new Language();
		language.uuid = crypto.randomUUID();
		language.name = body.name.trim();
		language.shortCode = shortCode;

		return this.languageRepository.save(language);
	}

	/**
	 * Retrieve all languages with pagination
	 * @param pageNumber
	 * @param itemsPerPage
	 * @returns Language[]
	 */
	getAllLanguages(): Promise<Language[]> {
		return this.languageRepository.find({
			order: { name: "ASC" },
		});
	}

    /**
     * Update a language by UUID
     * @param uuid
     * @param body
     * @returns Language
     */
	async update(uuid: string, body: UpdateLanguageDto): Promise<Language> {
		const language = await this.languageRepository.findOneBy({ uuid });

		if (!language) {
			throw new NotFoundException({
				error: "Failed to find the language. Please check and try again.",
			});
		}

		if (body.name !== undefined) {
			language.name = body.name.trim();
		}

		if (body.shortCode !== undefined) {
			const shortCode = body.shortCode.trim().toLowerCase();

			const existing = await this.languageRepository.findOneBy({ shortCode });

			if (existing && existing.uuid !== uuid) {
				throw new ConflictException({
					error: "A language with this short code already exists.",
				});
			}

			language.shortCode = shortCode;
		}

		return this.languageRepository.save(language);
	}

	/**
	 * Delete a language by UUID
	 * @param uuid
	 * @returns void
	 */
	async delete(uuid: string): Promise<void> {
		await this.languageRepository.delete({ uuid });
	}
}

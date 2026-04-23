import * as crypto from "node:crypto";

import {
	BadRequestException,
	Inject,
	Injectable,
	Logger,
	NotFoundException,
} from '@nestjs/common';

import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { plainToInstance } from "class-transformer";

import { Cache, CACHE_MANAGER } from "@nestjs/cache-manager";

import { generateSlug } from "../common/slug";
import { getSkipAndTake } from "../common/pagination";
import { generateCacheKey } from "../common/cache";

import { CreatePromoDto } from "./dtos/CreatePromoDto";
import { UpdatePromoDto } from "./dtos/UpdatePromoDto";

import { Promo } from './entities/promo.entity';

@Injectable()
export class PromosService {
	private readonly logger = new Logger(PromosService.name);

	constructor(
		@InjectRepository(Promo) private readonly promoRepository: Repository<Promo>,
		@Inject(CACHE_MANAGER) private readonly cacheManager: Cache,
	) { }

	/**
	 * Creates a promo
	 *
	 * @param body
	 * @returns
	 */
	async createPromo(body: CreatePromoDto): Promise<Promo> {
		this.logger.log(`Creating a promo, name: ${body.name}`);

		// Check if the promo already exists
		const existing = await this.promoRepository.findOneBy({
			name: body.name.toLowerCase().trim(),
		});

		if (existing !== null) {
			throw new BadRequestException({
				error: "The promo already exists. Please change the name and try again.",
			});
		}

		// Create a new promo
		const promo = new Promo();
		promo.uuid = crypto.randomUUID();
		promo.name = generateSlug(body.name);
		promo.text = body.text;
		promo.callToActionText = body.callToActionText;
		promo.callToActionLink = body.callToActionLink;
		return this.promoRepository.save(promo);
	}

	/**
	 * Returns a list of promos
	 *
	 * @param filters
	 * @param sort
	 * @param pageNumber
	 * @param itemsPerPage
	 * @returns
	 */
	async findAll(filters: string, sort: string, pageNumber: number = 1, itemsPerPage: number = 100): Promise<Array<Promo>> {
		this.logger.log(`Retrieving promos`);

		// Generate a cache key
		const cacheKey = generateCacheKey("promos", "", [pageNumber, itemsPerPage]);

		// Check in the cache if the categories exist
		const promosInCache = await this.cacheManager.get<Array<Promo>>(cacheKey);
		if (promosInCache) {
			return promosInCache;
		}

		// Get pagination params
		const { skip, take } = getSkipAndTake(pageNumber, itemsPerPage);

		const promos = await this.promoRepository.find({
			order: {
				id: "DESC",
			},
			skip: skip,
			take: take,
		});

		// Save the promos in cache
		await this.cacheManager.set(cacheKey, plainToInstance(Promo, promos), 500000);

		return promos;
	}

	/**
	 * Retrieves a promo
	 *
	 * @param promoUUID
	 * @returns
	 */
	async findOne(promoUUID: string): Promise<Promo> {
		this.logger.log(`Retrieving promo: ${promoUUID}`);

		// Find the promo
		const promo = await this.promoRepository.findOneBy({ uuid: promoUUID, });
		if (promo === null) {
			throw new NotFoundException({
				error: "Failed to find the promo. Please check and try again.",
			});
		}
		return promo;
	}

	/**
	 * Updates a promo
	 *
	 * @param promoUUID
	 * @param body
	 * @returns
	 */
	async updateOne(promoUUID: string, body: UpdatePromoDto): Promise<Promo> {
		this.logger.log(`Updating promo: ${promoUUID}`);

		// Find the promo
		const promo = await this.promoRepository.findOneBy({ uuid: promoUUID, });
		if (promo === null) {
			throw new NotFoundException({
				error: "Failed to find the promo. Please check and try again.",
			});
		}

		// Update the promo
		promo.name = generateSlug(body.name);
		promo.text = body.text;
		promo.callToActionText = body.callToActionText;
		promo.callToActionLink = body.callToActionLink;
		return this.promoRepository.save(promo);
	}

	/**
	 * Deletes a promo
	 *
	 * @param promoUUID
	 */
	async delete(promoUUID: string): Promise<void> {
		await this.promoRepository.delete({
			uuid: promoUUID,
		});
	}
}

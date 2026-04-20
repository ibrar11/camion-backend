import * as crypto from "node:crypto";

import {
	BadRequestException,
	Injectable,
	Logger,
	NotFoundException,
} from '@nestjs/common';

import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { generateSlug } from "../common/slug";
import { getSkipAndTake } from "../common/pagination";

import { CreatePromoDto } from "./dtos/CreatePromoDto";
import { UpdatePromoDto } from "./dtos/UpdatePromoDto";

import { Promo } from './entities/promo.entity';

@Injectable()
export class PromosService {
	private readonly logger = new Logger(PromosService.name);

	constructor(
		@InjectRepository(Promo) private readonly promoRepository: Repository<Promo>,
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
	findAll(filters: string, sort: string, pageNumber: number = 1, itemsPerPage: number = 100): Promise<Array<Promo>> {
		this.logger.log(`Retrieving promos`);

		// Get pagination params
		const { skip, take } = getSkipAndTake(pageNumber, itemsPerPage);

		return this.promoRepository.find({
			order: {
				id: "DESC",
			},
			skip: skip,
			take: take,
		});
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

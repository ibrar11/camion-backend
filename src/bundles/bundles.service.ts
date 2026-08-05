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

import { CreateBundleDto } from './dtos/create-bundle.dto';
import { UpdateBundleDto } from "./dtos/update-bundle.dto";

import { Bundle } from './entities/bundle.entity';
import { BundleItem } from './entities/bundle-item.entity';

@Injectable()
export class BundlesService {
	private readonly logger = new Logger(BundlesService.name);

	constructor(
		@InjectRepository(Bundle) private readonly bundleRepository: Repository<Bundle>,
		@InjectRepository(BundleItem) private readonly bundleItemRepository: Repository<BundleItem>,
	) { }

	/**
	 * Creates a bundle
	 *
	 * @param body
	 * @returns
	 */
	async createBundle(body: CreateBundleDto): Promise<Bundle> {
		this.logger.log(`Attempting to create a bundle`);

		// Make sure the slug is available for the bundle
		if (body.slug !== null) {
			const bundleByCampaign = await this.bundleRepository.findOneBy({ slug: body.slug.trim().toLowerCase(), });
			if (bundleByCampaign !== null) {
				throw new BadRequestException({
					errors: {
						slug: "A bundle using the same slug already exists. Please use a different slug.",
					},
				});
			}
		}

		// Create a bundle
		const bundle = new Bundle();
		bundle.uuid = crypto.randomUUID();
		bundle.titleEn = body.title.en.trim();
		bundle.titleAr = body.title.ar.trim();
		bundle.briefEn = body.brief.en.trim();
		bundle.briefAr = body.brief.ar.trim();
		bundle.slug = generateSlug(body.slug);
		bundle.pricingFactor = body.pricingFactor;
		bundle.discountPercentage = body.discountPercentage;
		return this.bundleRepository.save(bundle);
	}

	/**
	 * Finds a list of bundles
	 *
	 * @param filters
	 * @param sort
	 * @param pageNumber
	 * @param itemsPerPage
	 * @returns
	 */
	findAllUncached(filters: string, sort: string, pageNumber: number = 1, itemsPerPage: number = 100): Promise<Array<Bundle>> {
		this.logger.log(`Retrieving an uncached list of bundles`);

		// Get pagination params
		const { skip, take } = getSkipAndTake(pageNumber, itemsPerPage);

		return this.bundleRepository.find({
			relationLoadStrategy: "query",
			order: {
				id: "DESC",
			},
			skip: skip,
			take: take,
		});
	}

	/**
	 * Finds a list of bundles
	 *
	 * @param filters
	 * @param sort
	 * @param pageNumber
	 * @param itemsPerPage
	 */
	findAll(filters: string, sort: string, pageNumber: number = 1, itemsPerPage: number = 100): Promise<Array<Bundle>> {
		this.logger.log(`Retrieving a list of bundles`);

		// Get pagination params
		const { skip, take } = getSkipAndTake(pageNumber, itemsPerPage);

		return this.bundleRepository.find({
			cache: true,
			relationLoadStrategy: "query",
			order: {
				id: "DESC",
			},
			skip: skip,
			take: take,
		});
	}

	/**
	 * Returns the number of bundles
	 *
	 * @returns
	 */
	countAll(): Promise<number> {
		return this.bundleRepository.count({
			cache: true,
		});
	}

	/**
	 * Finds a bundle
	 *
	 * @param uuid
	 * @returns
	 */
	async findOne(uuid: string): Promise<Bundle> {
		this.logger.log(`Retrieving bundle: ${uuid}`);

		// Find the bundle
		const bundle = await this.bundleRepository.findOne({
			where: { uuid: uuid, },
		});

		if (bundle === null) {
			throw new NotFoundException({
				error: "Failed to find the bundle. Please check and try again."
			});
		}

		return bundle;
	}

	/**
	 * Finds a bundle by slug
	 *
	 * @param slug
	 * @returns
	 */
	async findOneBySlug(slug: string): Promise<Bundle> {
		this.logger.log(`Retrieving bundle: ${slug}`);

		// Find the bundle
		const bundle = await this.bundleRepository.findOne({
			where: { slug: slug, },
		});

		if (bundle === null) {
			throw new NotFoundException({
				error: "Failed to find the bundle. Please check and try again."
			});
		}

		return bundle;
	}

	/**
	 * Updates the bundle
	 *
	 * @param uuid
	 * @param body
	 * @returns
	 */
	async updateBundle(uuid: string, body: UpdateBundleDto): Promise<Bundle> {
		this.logger.log(`Updating bundle: ${uuid}`);

		// Find the bundle
		const bundle = await this.bundleRepository.findOne({
			where: { uuid: uuid, },
		});

		if (bundle === null) {
			throw new NotFoundException({
				error: "Failed to find the bundle. Please check and try again."
			});
		}

		// Update the bundle
		bundle.uuid = crypto.randomUUID();
		bundle.titleEn = body.title.en.trim();
		bundle.titleAr = body.title.ar.trim();
		bundle.briefEn = body.brief.en.trim();
		bundle.briefAr = body.brief.ar.trim();
		bundle.slug = generateSlug(body.slug);
		bundle.pricingFactor = body.pricingFactor;
		bundle.discountPercentage = body.discountPercentage;
		return this.bundleRepository.save(bundle);
	}

	/**
	 * Deletes a campaign
	 *
	 * @param uuid
	 */
	async delete(uuid: string): Promise<void> {
		await this.bundleRepository.delete({
			uuid: uuid,
		});
	}
}

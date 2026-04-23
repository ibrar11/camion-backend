import * as crypto from "node:crypto";

import {
	Inject,
	Injectable,
	Logger,
	NotFoundException,
} from '@nestjs/common';

import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { plainToInstance } from "class-transformer";

import { Cache, CACHE_MANAGER } from '@nestjs/cache-manager';

import { ConfigService } from "@nestjs/config";

import { S3Service } from '../common/s3.service';

import { getSkipAndTake } from '../common/pagination';
import { generateCacheKey } from "../common/cache";

import { UpdateBannerDto } from './dtos/UpdateBannerDto';

import { Banner } from './entities/banner.entity';

@Injectable()
export class BannersService {
	private readonly logger = new Logger(BannersService.name);

	constructor(
		@Inject(S3Service) private readonly s3Service: S3Service,
		@InjectRepository(Banner) private readonly bannerRepository: Repository<Banner>,
		@Inject(CACHE_MANAGER) private readonly cacheManager: Cache,
	) { }

	/**
	 * Creates a banner
	 *
	 * @param file
	 * @returns
	 */
	async createBanner(file: Express.Multer.File): Promise<Banner> {
		this.logger.log(`Attempting to create a banner`);

		// Upload the file to s3
		const params = await this.s3Service.uploadFile("banners", file);

		// Create a banner using the uploaded file
		const banner = new Banner();
		banner.uuid = crypto.randomUUID();
		banner.titleEn = "";
		banner.titleAr = "";
		banner.imageUrl = params.url;
		banner.linkUrl = "";
		banner.isActive = true;
		banner.placement = "";
		return this.bannerRepository.save(banner);
	}

	/**
	 * Finds a list of banners
	 *
	 * @param filters
	 * @param sort
	 * @param pageNumber
	 * @param itemsPerPage
	 */
	async findAll(filters: string, sort: string, pageNumber: number = 1, itemsPerPage: number = 100): Promise<Array<Banner>> {
		this.logger.log("Retrieving a list of banners");

		// Generate a cache key
		const cacheKey = generateCacheKey("banners", "", [pageNumber, itemsPerPage]);

		// Check in the cache if the banners exist
		const bannersInCache = await this.cacheManager.get<Array<Banner>>(cacheKey);
		if (bannersInCache) {
			return bannersInCache;
		}

		// Get pagination params
		const { skip, take } = getSkipAndTake(pageNumber, itemsPerPage);

		const banners = await this.bannerRepository.find({
			order: {
				id: "DESC",
			},
			skip: skip,
			take: take,
		});

		// Save the banners in cache
		await this.cacheManager.set(cacheKey, plainToInstance(Banner, banners), 500000);

		return banners;
	}

	/**
	 * Finds a banner
	 *
	 * @param uuid
	 * @returns
	 */
	async findOne(uuid: string): Promise<Banner> {
		this.logger.log(`Retrieving banner: ${uuid}`);

		// Find the banner
		const banner = await this.bannerRepository.findOneBy({ uuid: uuid, });
		if (banner === null) {
			throw new NotFoundException({
				error: "Failed to find the banner. Please check and try again",
			});

		}
		return banner;
	}

	/**
	 * Updates a banner
	 *
	 * @param uuid
	 * @param body
	 * @returns
	 */
	async updateBanner(uuid: string, body: UpdateBannerDto): Promise<Banner> {
		this.logger.log(`Updating banner: ${uuid}`);

		// Find the banner
		const banner = await this.bannerRepository.findOneBy({ uuid: uuid, });
		if (banner === null) {
			throw new NotFoundException({
				error: "Failed to find the banner. Please check and try again",
			});

		}

		// Update the banner
		banner.titleEn = body.title.en.trim();
		banner.titleAr = body.title.ar.trim();
		banner.linkUrl = body.linkUrl.trim();
		banner.placement = body.placement.trim();
		banner.isActive = body.isActive;
		return this.bannerRepository.save(banner);
	}

	/**
	 * Deletes a banner
	 *
	 * @param uuid
	 */
	async delete(uuid: string): Promise<void> {
		await this.bannerRepository.delete({
			uuid: uuid,
		});
	}
}

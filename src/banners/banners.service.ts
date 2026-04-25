import * as crypto from "node:crypto";

import {
	Inject,
	Injectable,
	Logger,
	NotFoundException,
} from '@nestjs/common';

import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { S3Service } from '../common/s3.service';

import { getSkipAndTake } from '../common/pagination';

import { UpdateBannerDto } from './dtos/UpdateBannerDto';

import { Banner } from './entities/banner.entity';

@Injectable()
export class BannersService {
	private readonly logger = new Logger(BannersService.name);

	constructor(
		@Inject(S3Service) private readonly s3Service: S3Service,
		@InjectRepository(Banner) private readonly bannerRepository: Repository<Banner>,
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
		banner.color = "";
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
	findAll(filters: string, sort: string, pageNumber: number = 1, itemsPerPage: number = 100): Promise<Array<Banner>> {
		this.logger.log("Retrieving a list of banners");

		// Get pagination params
		const { skip, take } = getSkipAndTake(pageNumber, itemsPerPage);

		return this.bannerRepository.find({
			cache: true,
			order: {
				id: "DESC",
			},
			skip: skip,
			take: take,
		});
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
		banner.color = body.color.trim();
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

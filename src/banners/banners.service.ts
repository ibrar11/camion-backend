import * as crypto from "node:crypto";

import {
	BadRequestException,
	Inject,
	Injectable,
	InternalServerErrorException,
	Logger,
	NotFoundException,
} from '@nestjs/common';

import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { S3Service } from '../common/s3.service';
import { FileService } from "../common/file.service";

import { getSkipAndTake } from '../common/pagination';

import { UpdateBannerDto } from './dtos/UpdateBannerDto';

import { Banner } from './entities/banner.entity';
import { BannerCategory } from "./entities/banner-category";

import { Category } from "../inventory/entities/category.entity";

@Injectable()
export class BannersService {
	private readonly logger = new Logger(BannersService.name);

	constructor(
		@Inject(S3Service) private readonly s3Service: S3Service,
		@Inject(FileService) private readonly fileService: FileService,
		@InjectRepository(Banner) private readonly bannerRepository: Repository<Banner>,
		@InjectRepository(BannerCategory) private readonly bannerCategoryRepository: Repository<BannerCategory>,
		@InjectRepository(Category) private readonly categoryRepository: Repository<Category>,
	) { }

	/**
	 * Creates a banner
	 *
	 * @param filesEn
	 * @param filesAr
	 * @returns
	 */
	async createBanner(filesEn: Express.Multer.File[], filesAr: Express.Multer.File[]): Promise<Banner> {
		this.logger.log(`Attempting to create a banner`);

		// Make sure we have a banner for English
		if (!Array.isArray(filesEn) || filesEn.length === 0) {
			throw new BadRequestException({
				errors: {
					filesEn: "Please add a banner for English",
				},
			});
		}

		// Make sure we have a banner for Arabic
		if (!Array.isArray(filesAr) || filesAr.length === 0) {
			throw new BadRequestException({
				errors: {
					filesAr: "Please add a banner for Arabic",
				},
			});
		}

		// Upload the image banners to s3
		let imageParamsEn: { key: string; url: string; } | null;
		try {
			imageParamsEn = await this.s3Service.uploadFile("banners", filesEn[0]);
		} catch (err) {
			this.logger.error(err);
			throw new InternalServerErrorException({
				error: "Failed to upload the English banner. Please try again.",
			});
		}

		let imageParamsAr: { key: string; url: string; } | null;
		try {
			imageParamsAr = await this.s3Service.uploadFile("banners", filesAr[0]);
		} catch (err) {
			this.logger.error(err);
			throw new InternalServerErrorException({
				error: "Failed to upload the Arabic banner. Please try again.",
			});
		}

		// Delete the temporary files
		await this.fileService.deleteFile(filesEn[0]);
		await this.fileService.deleteFile(filesAr[0]);

		// Create a banner using the uploaded file
		const banner = new Banner();
		banner.uuid = crypto.randomUUID();
		banner.titleEn = "";
		banner.titleAr = "";
		banner.imageUrlEn = imageParamsEn.url;
		banner.imageUrlAr = imageParamsAr.url;
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
	findAllUncached(filters: string, sort: string, pageNumber: number = 1, itemsPerPage: number = 100): Promise<Array<Banner>> {
		this.logger.log("Retrieving a list of banners");

		// Get pagination params
		const { skip, take } = getSkipAndTake(pageNumber, itemsPerPage);

		return this.bannerRepository.find({
			relationLoadStrategy: "query",
			relations: {
				bannerCategories: {
					category: true,
				},
			},
			order: {
				id: "DESC",
			},
			skip: skip,
			take: take,
		});
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
			where: {
				isActive: true,
			},
			cache: true,
			order: {
				id: "DESC",
			},
			skip: skip,
			take: take,
		});
	}

	/**
	 * Finds a list of banners by placement
	 *
	 * @param placement
	 * @param sort
	 * @param pageNumber
	 * @param itemsPerPage
	 * @returns
	 */
	async findAllByPlacement(placement: string, sort: string, pageNumber: number = 1, itemsPerPage: number = 100): Promise<Array<Banner>> {
		this.logger.log(`Retrieving a list of banners by placement: ${placement}`);

		// Get pagination params
		const { skip, take } = getSkipAndTake(pageNumber, itemsPerPage);

		// Get banners from the desired placement
		const banners = await this.bannerRepository.find({
			cache: true,
			where: {
				isActive: true,
				placement: placement,
			},
			order: {
				id: "DESC",
			},
			skip: skip,
			take: take,
		});

		// As a fallback, switch to banners from homepage
		if (Array.isArray(banners) && banners.length === 0 && placement !== "homepage") {
			return this.findAllByPlacement("homepage", sort, pageNumber, itemsPerPage);
		}

		return banners;
	}

	/**
	 * Returns all banners by category
	 *
	 * @param categorySlug
	 * @param sort
	 * @param pageNumber
	 * @param itemsPerPage
	 * @returns
	 */
	async findAllByCategory(categorySlug: string, sort: string, pageNumber: number = 1, itemsPerPage: number = 100): Promise<Array<Banner>> {
		this.logger.log(`Retrieving a list of banners by category: ${categorySlug}`);

		// Find the category, return empty array if there is no category against the slug
		const category = await this.categoryRepository.findOne({
			cache: true,
			where: {
				slug: categorySlug,
			},
			relations: {
				parent: {
					parent: true,
				},
			},
		});

		// Return empty banners as fallback
		if (category === null) {
			return [];
		}

		// Get pagination params
		const { skip, take } = getSkipAndTake(pageNumber, itemsPerPage);

		// Find the banners in the desired category
		const banners = await this.bannerRepository.createQueryBuilder("banner")
			.cache(true)
			.setFindOptions({
				relationLoadStrategy: "query",
			})

			// Many-to-many join
			.leftJoin("banner.bannerCategories", "bannerCategory")
			.leftJoin("bannerCategory.category", "category")

			.where("category.id = :id", {
				id: category.id,
			})
			.andWhere("banner.isActive = :isActive", {
				isActive: true,
			})
			.andWhere("banner.placement = :placement", {
				placement: "single-category",
			})
			.distinct(true)
			.orderBy("banner.id", "DESC")
			.skip(skip)
			.take(take)
			.getMany();

		// As a fallback, if we don't have banners in the 3rd level, return banners from the 2nd level
		if (Array.isArray(banners) && banners.length === 0 && category.parent !== null && category.parent.parent !== null) {
			return this.bannerRepository.createQueryBuilder("banner")
				.cache(true)
				.setFindOptions({
					relationLoadStrategy: "query",
				})

				// Many-to-many join
				.leftJoin("banner.bannerCategories", "bannerCategory")
				.leftJoin("bannerCategory.category", "category")

				.where("category.id = :id", {
					id: category.parent.id,
				})
				.andWhere("banner.isActive = :isActive", {
					isActive: true,
				})
				.andWhere("banner.placement = :placement", {
					placement: "single-category",
				})
				.distinct(true)
				.orderBy("banner.id", "DESC")
				.skip(skip)
				.take(take)
				.getMany();
		}

		return banners;
	}

	/**
	 * Returns the estimated count of banners
	 *
	 * @returns
	 */
	countAll(): Promise<number> {
		return this.bannerRepository.count({
			cache: true,
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
		const banner = await this.bannerRepository.findOne({
			where: { uuid: uuid, },
			relations: {
				bannerCategories: {
					category: true,
				},
			},
		});
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
		banner.linkUrlEn = body.linkUrl.en.trim();
		banner.linkUrlAr = body.linkUrl.ar.trim();
		banner.placement = body.placement.trim();
		banner.color = body.color.trim();
		banner.isActive = body.isActive;
		await this.bannerRepository.save(banner);

		// Assign categories to the banner
		if (Array.isArray(body.categories) && body.categories.length !== 0) {
			await Promise.all(body.categories.map(async categoryUUID => {

				// Make sure the category exists
				const category = await this.categoryRepository.findOneBy({ uuid: categoryUUID, });
				if (category === null) {
					return null;
				}

				// Make sure the join between banner and category exists
				const exists = await this.bannerCategoryRepository.findOneBy({
					banner: {
						id: banner.id,
					},
					category: {
						id: category.id,
					},
				});

				if (exists !== null) {
					return null;
				}

				const bannerCategory = new BannerCategory();
				bannerCategory.banner = banner;
				bannerCategory.category = category;
				await this.bannerCategoryRepository.save(bannerCategory);
			}));
		}

		return banner;
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

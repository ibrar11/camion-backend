import crypto from "node:crypto";

import {
	BadRequestException,
	Inject,
	Injectable,
	Logger,
	NotFoundException,
} from "@nestjs/common";

import { InjectRepository } from "@nestjs/typeorm";
import { IsNull, Repository } from "typeorm";

import { plainToInstance } from "class-transformer";

import { Cache, CACHE_MANAGER } from '@nestjs/cache-manager';

import { ConfigService } from "@nestjs/config";

import { S3Service } from "../common/s3.service";

import { getSkipAndTake } from "../common/pagination";
import { generateSlug } from "../common/slug";
import { generateCacheKey } from "../common/cache";

import { CreateCategoryDto } from "./dtos/CreateCategoryDto";
import { UpdateCategoryDto } from "./dtos/UpdateCategoryDto";

import { Category } from "./entities/category.entity";

@Injectable()
export class CategoriesService {
	private readonly logger = new Logger(CategoriesService.name);

	constructor(
		@Inject(S3Service) private readonly s3Service: S3Service,
		@InjectRepository(Category) private readonly categoryRepository: Repository<Category>,
		@Inject(CACHE_MANAGER) private readonly cacheManager: Cache,
	) { }

	/**
	 * Creates a new product category
	 *
	 * @param body
	 * @returns
	 */
	async createProductCategory(body: CreateCategoryDto): Promise<Category> {
		this.logger.log(`Attempting to create product category: ${body.slug}`);

		// Check if a product category already exists by the same slug.
		if (body.slug !== null) {
			const categoryBySlug = await this.categoryRepository.findOneBy({
				slug: body.slug.trim().toLowerCase(),
			});

			// Make sure we don't create another category with the same slug
			if (categoryBySlug !== null) {
				throw new BadRequestException({
					errors: {
						slug: "A category using the same slug already exists. Please use a different slug.",
					},
				});
			}
		}

		// Make sure the parent category already exists.
		let parentCategory: Category | null = null;
		if (body.parentUUID !== null) {
			parentCategory = await this.categoryRepository.findOneBy({ uuid: body.parentUUID, });
			if (parentCategory === null) {
				throw new BadRequestException({
					errors: {
						parentUUID: "Failed to find the parent category. Please use a different category.",
					},
				});
			}
		}

		const category = new Category();
		category.uuid = crypto.randomUUID();
		category.parent = parentCategory;
		category.slug = generateSlug(body.slug);
		category.nameEn = body.name.en.trim().toLowerCase();
		category.nameAr = body.name.ar.trim().toLowerCase();
		category.pricingFactor = body.pricingFactor;
		return this.categoryRepository.save(category);
	}

	/**
	 * Uploads a thumbnail
	 *
	 * @param categoryUUID
	 * @param file
	 * @returns
	 */
	async updateThumbnail(categoryUUID: string, file: Express.Multer.File): Promise<Category> {
		this.logger.log(`Attempting to upload a thumbnail for category: ${categoryUUID}`);

		// Update the file to s3
		const params = await this.s3Service.uploadFile("categories", file);

		// Find the category
		const category = await this.categoryRepository.findOneBy({ uuid: categoryUUID, });
		if (category === null) {
			throw new NotFoundException({
				error: "Failed to find the category. Please check and try again.",
			});
		}

		// Update the category
		category.thumbnailUrl = params.url;
		return this.categoryRepository.save(category);
	}

	/**
	 * Finds a list of product categories
	 *
	 * @param filters
	 * @param sort
	 * @param pageNumber
	 * @param itemsPerPage
	 * @returns
	 */
	async findAll(filters: string, sort: string, pageNumber: number = 1, itemsPerPage: number = 100): Promise<Array<Category>> {
		this.logger.log(`Retrieving product categories`);

		// Generate a cache key
		const cacheKey = generateCacheKey("categories", "", [pageNumber, itemsPerPage]);

		// Check in the cache if the categories exist
		const categoriesInCache = await this.cacheManager.get<Array<Category>>(cacheKey);
		if (categoriesInCache) {
			return categoriesInCache;
		}

		// Get pagination params
		const { skip, take } = getSkipAndTake(pageNumber, itemsPerPage);

		const categories = await this.categoryRepository.find({
			where: {
				parentId: IsNull(),
			},
			relations: {
				children: {
					children: true,
				},
			},
			order: {
				id: "DESC",
			},
			skip: skip,
			take: take,
		});

		// Save the categories in cache
		await this.cacheManager.set(cacheKey, plainToInstance(Category, categories), 500000);

		return categories;
	}

	/**
	 * Finds a product category
	 *
	 * @param uuid
	 * @returns
	 */
	async findOne(uuid: string): Promise<Category> {
		this.logger.log(`Retrieving product category: ${uuid}`);

		// Find the product category
		const category = await this.categoryRepository.findOneBy({ uuid: uuid, });
		if (category === null) {
			throw new NotFoundException({
				error: "Failed to find the category. Please check and try again.",
			});
		}
		return category;
	}

	/**
	 * Updates a product category
	 *
	 * @param uuid
	 * @param body
	 * @returns
	 */
	async updateProductCategory(uuid: string, body: UpdateCategoryDto): Promise<Category> {
		this.logger.log(`Updating product: ${uuid}`);

		// Check if a product category already exists by the same slug.
		if (body.slug !== null) {
			const categoryBySlug = await this.categoryRepository.findOneBy({
				slug: body.slug.trim().toLowerCase(),
			});

			// Make sure we don't create another product with the same slug
			if (categoryBySlug !== null && categoryBySlug.uuid !== uuid) {
				throw new BadRequestException({
					errors: {
						slug: "A category using the same slug already exists. Please use a different slug.",
					},
				});
			}
		}

		// Find the category
		const category = await this.categoryRepository.findOneBy({ uuid: uuid, });
		if (category === null) {
			throw new BadRequestException({
				error: "Failed to find the category. Please check and try again.",
			});
		}

		// Update the category
		category.slug = generateSlug(body.slug);
		category.nameEn = body.name.en.trim().toLowerCase();
		category.nameAr = body.name.ar.trim().toLowerCase();
		category.pricingFactor = body.pricingFactor;
		return this.categoryRepository.save(category);
	}

	/**
	 * Deletes a product category
	 *
	 * @param uuid
	 */
	async delete(uuid: string): Promise<void> {
		await this.categoryRepository.delete({
			uuid: uuid,
		});
	}
}

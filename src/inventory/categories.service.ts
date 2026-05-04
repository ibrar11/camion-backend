import crypto from "node:crypto";

import {
	BadRequestException,
	Inject,
	Injectable,
	InternalServerErrorException,
	Logger,
	NotFoundException,
} from "@nestjs/common";

import { InjectRepository } from "@nestjs/typeorm";
import { IsNull, Repository } from "typeorm";

import { S3Service } from "../common/s3.service";
import { FileService } from "../common/file.service";

import { getSkipAndTake } from "../common/pagination";
import { generateSlug } from "../common/slug";

import { CreateCategoryDto } from "./dtos/CreateCategoryDto";
import { UpdateCategoryDto } from "./dtos/UpdateCategoryDto";

import { Category } from "./entities/category.entity";

@Injectable()
export class CategoriesService {
	private readonly logger = new Logger(CategoriesService.name);

	constructor(
		@Inject(S3Service) private readonly s3Service: S3Service,
		@Inject(FileService) private readonly fileService: FileService,
		@InjectRepository(Category) private readonly categoryRepository: Repository<Category>,
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
		category.nameEn = body.name.en.trim();
		category.nameAr = body.name.ar.trim();
		category.pricingFactor = body.pricingFactor;
		category.discountFactor = body.discountFactor;
		category.isFeatured = body.isFeatured;
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
		let params: { key: string; url: string; } | null = null;
		try {
			params = await this.s3Service.uploadFile("categories", file);
		} catch (err) {
			this.logger.error(err);
			throw new InternalServerErrorException({
				error: "Failed to upload the category image. Please try again.",
			});
		}

		// Delete the temporary file
		await this.fileService.deleteFile(file);

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
	findAll(filters: string, sort: string, pageNumber: number = 1, itemsPerPage: number = 100): Promise<Array<Category>> {
		this.logger.log(`Retrieving product categories`);

		// Get pagination params
		const { skip, take } = getSkipAndTake(pageNumber, itemsPerPage);

		return this.categoryRepository.find({
			cache: true,
			relationLoadStrategy: "query",
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
	}

	/**
	 * Finds a list of product categories uncached
	 *
	 * @param filters
	 * @param sort
	 * @param pageNumber
	 * @param itemsPerPage
	 * @returns
	 */
	findAllUncached(filters: string, sort: string, pageNumber: number = 1, itemsPerPage: number = 100): Promise<Array<Category>> {
		this.logger.log(`Retrieving product categories uncached`);

		// Get pagination params
		const { skip, take } = getSkipAndTake(pageNumber, itemsPerPage);

		return this.categoryRepository.find({
			relationLoadStrategy: "query",
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
	}

	/**
	 * Returns the featured categories
	 *
	 * @param pageNumber
	 * @param itemsPerPage
	 * @returns
	 */
	findAllFeatured(pageNumber: number = 1, itemsPerPage: number = 100): Promise<Array<Category>> {
		this.logger.log(`Retrieving product categories = featured`);

		// Get pagination params
		const { skip, take } = getSkipAndTake(pageNumber, itemsPerPage);

		return this.categoryRepository.find({
			cache: true,
			relationLoadStrategy: "query",
			where: {
				isFeatured: true,
			},
			order: {
				id: "DESC",
			},
			skip: skip,
			take: take,
		});
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
		category.nameEn = body.name.en.trim();
		category.nameAr = body.name.ar.trim();
		category.pricingFactor = body.pricingFactor;
		category.discountFactor = body.discountFactor;
		category.isFeatured = body.isFeatured;
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

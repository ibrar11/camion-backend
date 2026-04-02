import crypto from "node:crypto";

import {
	BadRequestException,
	Injectable,
	Logger,
	NotFoundException
} from '@nestjs/common';

import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { getSkipAndTake } from "../common/pagination";
import { generateSlug } from "src/common/slug";

import { CreateProductDto } from './dtos/CreateProductDto';
import { UpdateProductDto } from './dtos/UpdateProductDto';
import { UpdateProductSlugDto } from './dtos/UpdateProductSlugDto';
import { UpdateProductStatusDto } from './dtos/UpdateProductStatusDto';

import { Product } from './entities/product.entity';

import { ProductStatus } from './enums/ProductStatus';
import { ProductCategory } from "./entities/product-category.entity";
import { Category } from "./entities/category.entity";

@Injectable()
export class ProductsService {
	private readonly logger = new Logger(ProductsService.name);

	constructor(
		@InjectRepository(Category) private readonly categoryRepository: Repository<Category>,
		@InjectRepository(Product) private readonly productRepository: Repository<Product>,
		@InjectRepository(ProductCategory) private readonly productCategoryRepository: Repository<ProductCategory>,
	) { }

	/**
	 * Creates a new product
	 *
	 * @param body
	 * @returns
	 */
	async createProduct(body: CreateProductDto): Promise<Product> {
		this.logger.log(`Attempting to create product: ${body.title}`);

		// Check if a product already exists by the same slug
		if (body.slug !== null) {
			const productBySlug = await this.productRepository.findOneBy({
				slug: body.slug.trim().toLowerCase(),
			});

			// Make sure we don't create another product with the same slug
			if (productBySlug !== null) {
				throw new BadRequestException({
					status: "fail",
					errors: {
						slug: "A product using the same slug already exists. Please use a different slug.",
					},
				});
			}
		}

		const product = new Product();
		product.uuid = crypto.randomUUID();
		product.slug = generateSlug(body.slug);
		product.title = body.title.en.trim();
		product.titleAr = body.title.ar.trim();
		product.brief = body.brief.en.trim();
		product.briefAr = body.brief.ar.trim();
		product.description = body.description.en.trim();
		product.descriptionAr = body.description.ar.trim();
		product.descriptionHtml = body.descriptionHtml.en.trim();
		product.descriptionHtmlAr = body.descriptionHtml.ar.trim();
		product.status = ProductStatus.DRAFT;
		product.publishedAt = new Date();
		await this.productRepository.save(product);

		// Find the categories and create product categories.
		// This is to join the categories to its associated product.
		if (body.categories !== null && body.categories.length !== 0) {
			body.categories.forEach(async categoryUUID => {
				const category = await this.categoryRepository.findOneBy({ uuid: categoryUUID, });
				if (category === null) {
					return;
				}

				const productCategory = new ProductCategory();
				productCategory.product = product;
				productCategory.category = category;
				await this.productCategoryRepository.save(productCategory);
			});
		}

		return product;
	}

	/**
	 * Finds a list of products
	 *
	 * @param filters
	 * @param sort
	 * @param pageNumber
	 * @param itemsPerPage
	 * @returns
	 */
	findAll(filters: string, sort: string, pageNumber: number = 1, itemsPerPage: number = 100): Promise<Array<Product>> {
		this.logger.log(`Retrieving products`);

		// Get pagination params
		const { skip, take } = getSkipAndTake(pageNumber, itemsPerPage);

		// Parse the filters
		let filtersObject: { slug?: string } = {};
		try {
			filtersObject = JSON.parse(filters);
		} catch {
			this.logger.warn("Unable to parse filters. Please check the documentation and try again.");
		}

		// Returns products by category
		if (filtersObject.slug !== undefined) {
			return this.findAllByCategorySlug(filtersObject.slug, sort, skip, take);
		}

		return this.productRepository.find({
			relations: {
				options: {
					values: true,
				},
				variants: {
					optionValues: {
						optionValue: true,
					},
				},
			},
			skip: skip,
			take: take,
		});
	}

	/**
	 * Finds products by a category slug
	 *
	 * @param slug
	 * @param sort
	 * @param skip
	 * @param take
	 * @returns
	 */
	async findAllByCategorySlug(slug: string, sort: string, skip: number, take: number): Promise<Array<Product>> {
		this.logger.log(`Retrieving products by category slug: ${slug}`);

		return this.productRepository
			.createQueryBuilder("product")
			.innerJoin("product.productCategories", "pc")
			.innerJoin("pc.category", "category")
			.where("category.slug = :slug", { slug: slug, })
			.skip(skip)
			.take(take)
			.getMany();
	}

	/**
	 * Finds a product
	 *
	 * @param uuid
	 * @returns
	 */
	async findOne(uuid: string): Promise<Product> {
		this.logger.log(`Retrieving product: ${uuid}`);

		// Find the product
		const product = await this.productRepository.findOne({
			where: { uuid: uuid, },
			relations: {
				options: {
					values: true,
				},
				variants: {
					optionValues: {
						optionValue: true,
					},
				},
			},
		});

		if (product === null) {
			throw new NotFoundException({
				status: "fail",
			});
		}
		return product;
	}

	/**
	 * Updates a product
	 *
	 * @param uuid
	 * @param body
	 * @returns
	 */
	async updateProduct(uuid: string, body: UpdateProductDto): Promise<Product> {
		this.logger.log(`Updating product: ${uuid}`);

		// Find the product
		const product = await this.productRepository.findOneBy({ uuid: uuid, });
		if (product === null) {
			throw new NotFoundException({
				status: "fail",
			});
		}

		// Update the product
		product.title = body.title.en.trim();
		product.titleAr = body.title.ar.trim();
		product.brief = body.brief.en.trim();
		product.briefAr = body.brief.ar.trim();
		product.description = body.description.en.trim();
		product.descriptionAr = body.description.ar.trim();
		product.descriptionHtml = body.descriptionHtml.en.trim();
		product.descriptionHtmlAr = body.descriptionHtml.ar.trim();
		await this.productRepository.save(product);

		// Delete existing product categories to make sure new ones don't duplicate
		await this.productCategoryRepository.delete({
			product: {
				id: product.id,
			},
		});

		// Find the categories and create product categories.
		// This is to join the categories to its associated product.
		if (body.categories !== null && body.categories.length !== 0) {
			body.categories
				.filter((categoryUUID, index) => body.categories.indexOf(categoryUUID) === index)
				.forEach(async categoryUUID => {
					const category = await this.categoryRepository.findOneBy({ uuid: categoryUUID, });
					if (category === null) {
						return;
					}

					const productCategory = new ProductCategory();
					productCategory.product = product;
					productCategory.category = category;
					await this.productCategoryRepository.save(productCategory);
				});
		}

		return product;
	}

	/**
	 * Updates a product's slug
	 *
	 * @param uuid
	 * @param body
	 * @returns
	 */
	async updateProductSlug(uuid: string, body: UpdateProductSlugDto): Promise<Product> {
		this.logger.log(`Updating product slug: ${uuid}`);

		// Check if a product already exists by the same slug
		if (body.slug !== null) {
			const productBySlug = await this.productRepository.findOneBy({
				slug: body.slug.trim().toLowerCase(),
			});

			// Make sure we don't create another product with the same slug
			if (productBySlug !== null && productBySlug.uuid !== uuid) {
				throw new BadRequestException({
					status: "fail",
					errors: {
						slug: "A product using the same slug already exists. Please use a different slug.",
					},
				});
			}
		}

		// Find the product
		const product = await this.productRepository.findOneBy({ uuid: uuid, });
		if (product === null) {
			throw new NotFoundException({
				status: "fail",
			});
		}

		// Update the product
		product.slug = generateSlug(body.slug);
		return this.productRepository.save(product);
	}

	/**
	 * Updates a product's status
	 *
	 * @param uuid
	 * @param body
	 * @returns
	 */
	async updateProductStatus(uuid: string, body: UpdateProductStatusDto): Promise<Product> {
		this.logger.log(`Updating product status: ${uuid}`);

		// Find the product
		const product = await this.productRepository.findOneBy({ uuid: uuid, });
		if (product === null) {
			throw new NotFoundException({
				status: "fail",
			});
		}

		// Create the status of the product
		let status = ProductStatus.DRAFT;
		switch (body.status) {
			case "ACTIVE":
				status = ProductStatus.ACTIVE;
				break;
			case "ARCHIVED":
				status = ProductStatus.ARCHIVED;
				break;
			case "DRAFT":
				status = ProductStatus.DRAFT;
				break;
			default: // do nothing
				break;
		}

		// Update the product
		product.status = status;
		return this.productRepository.save(product);
	}

	/**
	 * Deletes a product
	 *
	 * @param uuid
	 */
	async delete(uuid: string): Promise<void> {
		await this.productRepository.delete({
			uuid: uuid,
		});
	}
}

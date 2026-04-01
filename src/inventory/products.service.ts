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

import { CreateProductDto } from './dtos/CreateProductDto';
import { UpdateProductDto } from './dtos/UpdateProductDto';
import { UpdateProductSlugDto } from './dtos/UpdateProductSlugDto';
import { UpdateProductStatusDto } from './dtos/UpdateProductStatusDto';

import { Product } from './entities/product.entity';

import { ProductStatus } from './enums/ProductStatus';

@Injectable()
export class ProductsService {
	private readonly logger = new Logger(ProductsService.name);

	constructor(@InjectRepository(Product) private readonly productRepository: Repository<Product>) { }

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
		product.slug = body.slug.trim().toLowerCase();
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
		return this.productRepository.save(product);
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
		return this.productRepository.save(product);
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
		product.slug = body.slug.trim().toLowerCase();
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

import crypto from "node:crypto";

import {
	Injectable,
	Logger,
	NotFoundException,
} from "@nestjs/common";

import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";

import { getSkipAndTake } from "../common/pagination";

import { CreateProductVariantDto } from "./dtos/CreateProductVariantDto";
import { UpdateProductVariantDto } from "./dtos/UpdateProductVariantDto";

import { Product } from "./entities/product.entity";
import { ProductOptionValue } from "./entities/product-option-value.entity";
import { ProductVariant } from "./entities/product-variant.entity";
import { ProductVariantOptionValue } from "./entities/product-variant-option-value.entity";

@Injectable()
export class ProductVariantService {
	private readonly logger = new Logger(ProductVariantService.name);

	constructor(
		@InjectRepository(Product) private readonly productRepository: Repository<Product>,
		@InjectRepository(ProductOptionValue) private readonly productOptionValueRepository: Repository<ProductOptionValue>,
		@InjectRepository(ProductVariant) private readonly variantRepository: Repository<ProductVariant>,
		@InjectRepository(ProductVariantOptionValue) private readonly productVariantOptionValueRepository: Repository<ProductVariantOptionValue>,
	) { }

	/**
	 * Creates a new variant
	 *
	 * @param productUUID
	 * @param body
	 * @returns
	 */
	async createProductVariant(productUUID: string, body: CreateProductVariantDto): Promise<ProductVariant> {
		this.logger.log(`Attempting to create product variant for product: ${productUUID}`);

		// Find the product
		const product = await this.productRepository.findOneBy({ uuid: productUUID, });
		if (product === null) {
			throw new NotFoundException({
				status: "fail",
			});
		}

		// Create the product variant
		const variant = new ProductVariant();
		variant.uuid = crypto.randomUUID();
		variant.product = product;
		variant.title = body.title.en.trim();
		variant.titleAr = body.title.ar.trim();
		variant.sku = body.sku.trim();
		variant.barcode = body.barcode.trim();
		variant.price = body.price;
		variant.weight = body.weight;
		variant.dimensions = body.dimensions;
		await this.variantRepository.save(variant);

		// Find the product option values and create product variant option values
		// This is the join the product option values to its associated product variant.
		body.optionValues.forEach(async optionValueUUID => {
			const optionValue = await this.productOptionValueRepository.findOneBy({ uuid: optionValueUUID, });
			if (optionValue === null) {
				return;
			}

			const productVariantOptionValue = new ProductVariantOptionValue();
			productVariantOptionValue.uuid = crypto.randomUUID();
			productVariantOptionValue.variant = variant;
			productVariantOptionValue.optionValue = optionValue;
			await this.productVariantOptionValueRepository.save(productVariantOptionValue);
		});

		return variant;
	}

	/**
	 * Finds the variants of a product
	 *
	 * @param productUUID
	 * @param filters
	 * @param sort
	 * @param pageNumber
	 * @param itemsPerPage
	 * @returns
	 */
	async findAll(productUUID: string, filters: string, sort: string, pageNumber: number, itemsPerPage: number): Promise<Array<ProductVariant>> {
		this.logger.log(`Retrieving variants of product: ${productUUID}`);

		// Find the product
		const product = await this.productRepository.findOneBy({ uuid: productUUID, });
		if (product === null) {
			throw new NotFoundException({
				status: "fail",
			});
		}

		// Get pagination params
		const { skip, take } = getSkipAndTake(pageNumber, itemsPerPage);

		return this.variantRepository.find({
			where: {
				product: {
					id: product.id,
				},
			},
			skip: skip,
			take: take,
		});
	}

	/**
	 * Finds a variant
	 *
	 * @param uuid
	 * @returns
	 */
	async findOne(uuid: string): Promise<ProductVariant> {
		this.logger.log(`Retrieving variant: ${uuid}`);

		// Find the variant
		const variant = await this.variantRepository.findOneBy({ uuid: uuid, });
		if (variant === null) {
			throw new NotFoundException({
				status: "fail",
			});
		}
		return variant;
	}

	/**
	 * Updates a variant
	 *
	 * @param uuid
	 * @param body
	 * @returns
	 */
	async updateProductVariant(uuid: string, body: UpdateProductVariantDto): Promise<ProductVariant> {
		this.logger.log(`Updating variant: ${uuid}`);

		// Find the variant
		const variant = await this.variantRepository.findOneBy({ uuid: uuid, });
		if (variant === null) {
			throw new NotFoundException({
				status: "fail",
			});
		}

		// Update the variant
		variant.title = body.title.en.trim();
		variant.titleAr = body.title.ar.trim();
		variant.sku = body.sku.trim();
		variant.barcode = body.barcode.trim();
		variant.price = body.price;
		variant.weight = body.weight;
		variant.dimensions = body.dimensions;
		return this.variantRepository.save(variant);
	}

	/**
	 * Deletes a variant
	 *
	 * @param uuid
	 */
	async delete(uuid: string): Promise<void> {
		await this.productRepository.delete({
			uuid: uuid,
		});
	}
}

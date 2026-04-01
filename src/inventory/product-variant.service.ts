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
import { InventoryItem } from "./entities/inventory-item.entity";
import { InventoryLevel } from "./entities/inventory-level.entity";
import { Warehouse } from "./entities/warehouse.entity";

@Injectable()
export class ProductVariantService {
	private readonly logger = new Logger(ProductVariantService.name);

	constructor(
		@InjectRepository(Product) private readonly productRepository: Repository<Product>,
		@InjectRepository(ProductOptionValue) private readonly productOptionValueRepository: Repository<ProductOptionValue>,
		@InjectRepository(ProductVariant) private readonly variantRepository: Repository<ProductVariant>,
		@InjectRepository(ProductVariantOptionValue) private readonly productVariantOptionValueRepository: Repository<ProductVariantOptionValue>,
		@InjectRepository(InventoryItem) private readonly inventoryItemRepository: Repository<InventoryItem>,
		@InjectRepository(InventoryLevel) private readonly inventoryLevelRepository: Repository<InventoryLevel>,
		@InjectRepository(Warehouse) private readonly warehouseRepository: Repository<Warehouse>,
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
				error: "Failed to find the product. Please check and try again.",
			});
		}

		// Find the warehouse
		const warehouse = await this.warehouseRepository.findOneBy({ uuid: body.warehouse, });
		if (warehouse === null) {
			throw new NotFoundException({
				error: "Failed to find the warehouse. Please check and try again.",
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

		// Create the inventory item for the variant
		const inventoryItem = new InventoryItem();
		inventoryItem.uuid = crypto.randomUUID();
		inventoryItem.sku = body.sku.trim();
		inventoryItem.variant = variant;
		await this.inventoryItemRepository.save(inventoryItem);

		// Create the inventory level in the warehouse
		const inventoryLevel = new InventoryLevel();
		inventoryLevel.uuid = crypto.randomUUID();
		inventoryLevel.quantity = body.quantity;
		inventoryLevel.inventoryItem = inventoryItem;
		inventoryLevel.warehouse = warehouse;
		await this.inventoryLevelRepository.save(inventoryLevel);

		// Find the product option values and create product variant option values
		// This is the join the product option values to its associated product variant.
		if (body.optionValues !== null && body.optionValues.length !== 0) {
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
		}

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
	async findAll(productUUID: string, filters: string, sort: string, pageNumber: number = 1, itemsPerPage: number = 100): Promise<Array<ProductVariant>> {
		this.logger.log(`Retrieving variants of product: ${productUUID}`);

		// Find the product
		const product = await this.productRepository.findOneBy({ uuid: productUUID, });
		if (product === null) {
			throw new NotFoundException({
				error: "Failed to find the product. Please check and try again.",
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
				error: "Failed to find the variant. Please check and try again.",
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
				error: "Failed to find the variant. Please check and try again.",
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

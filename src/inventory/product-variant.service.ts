import crypto from "node:crypto";

import {
	BadRequestException,
	Inject,
	Injectable,
	Logger,
	NotFoundException,
} from "@nestjs/common";

import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";

import { getSkipAndTake } from "../common/pagination";

import { CreateProductVariantDto } from "./dtos/CreateProductVariantDto";
import { UpdateProductVariantDto } from "./dtos/UpdateProductVariantDto";
import { BulkStockUpdateDto, StockUpdateItemDto } from "./dtos/BulkStockUpdateDto";

import { Product } from "./entities/product.entity";
import { ProductOptionValue } from "./entities/product-option-value.entity";
import { ProductVariant } from "./entities/product-variant.entity";
import { ProductVariantOptionValue } from "./entities/product-variant-option-value.entity";
import { InventoryItem } from "./entities/inventory-item.entity";
import { InventoryLevel } from "./entities/inventory-level.entity";
import { Warehouse } from "./entities/warehouse.entity";

import { TranslationService } from "../translation/translation.service";
import { FieldTranslationType } from "../translation/enums/FieldTranslationType.enum";

import { chunkArray } from "../common/chunkArray";

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
		@Inject(TranslationService) private readonly translationService: TranslationService,
	) { }

	/**
	 * Creates a new variant
	 *
	 * @param productUUID
	 * @param body
	 * @returns
	 */
	async createProductVariant(productUUID: string, body: CreateProductVariantDto, skipTranslation: boolean = false): Promise<ProductVariant> {
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

		return this.saveProductVariant(product, warehouse, body, skipTranslation, false);
	}

	/**
	 * Creates or updates a variant for a specific product only.
	 * This is safer for procurement resync because SKU matches are scoped to the product.
	 */
	async createProductVariantForProduct(productUUID: string, body: CreateProductVariantDto, skipTranslation: boolean = false): Promise<ProductVariant> {
		this.logger.log(`Attempting to create product-scoped variant for product: ${productUUID}`);

		const product = await this.productRepository.findOneBy({ uuid: productUUID, });
		if (product === null) {
			throw new NotFoundException({
				error: "Failed to find the product. Please check and try again.",
			});
		}

		const warehouse = await this.warehouseRepository.findOneBy({ uuid: body.warehouse, });
		if (warehouse === null) {
			throw new NotFoundException({
				error: "Failed to find the warehouse. Please check and try again.",
			});
		}

		return this.saveProductVariant(product, warehouse, body, skipTranslation, true);
	}

	private async saveProductVariant(
		product: Product,
		warehouse: Warehouse,
		body: CreateProductVariantDto,
		skipTranslation: boolean,
		restrictToProduct: boolean,
	): Promise<ProductVariant> {
		const sku = body.sku.trim();
		const variantWhere = restrictToProduct
			? { sku: sku, product: { uuid: product.uuid } }
			: { sku: sku };

		let variant = await this.variantRepository.findOne({
			where: variantWhere,
			relations: ["inventoryItem"],
		});

		if (variant) {
			this.logger.log(`Updating variant with SKU: ${sku}`);
		} else {
			this.logger.log(`Creating new variant with SKU: ${sku}`);
			variant = new ProductVariant();
			variant.uuid = crypto.randomUUID();
			variant.product = product;
		}

		variant.titleEn = body.title.en.trim();
		variant.titleAr = body.title.ar.trim();
		variant.sku = sku;
		variant.barcode = body.barcode.trim();
		variant.cost = body.cost;
		variant.weight = body.weight;
		variant.dimensions = body.dimensions;
		variant.skuMeta = body.skuMeta ?? null;

		await this.variantRepository.save(variant);

		let inventoryItem = await this.inventoryItemRepository.findOne({
			where: { variant: { uuid: variant.uuid } },
		});

		if (!inventoryItem) {
			inventoryItem = new InventoryItem();
			inventoryItem.uuid = crypto.randomUUID();
			inventoryItem.variant = variant;
		}

		inventoryItem.sku = sku;
		await this.inventoryItemRepository.save(inventoryItem);

		let inventoryLevel = await this.inventoryLevelRepository.findOne({
			where: {
				inventoryItem: { uuid: inventoryItem.uuid },
				warehouse: { uuid: warehouse.uuid },
			},
			relations: ["inventoryItem", "warehouse"],
		});

		if (!inventoryLevel) {
			inventoryLevel = new InventoryLevel();
			inventoryLevel.uuid = crypto.randomUUID();
			inventoryLevel.inventoryItem = inventoryItem;
			inventoryLevel.warehouse = warehouse;
		}

		inventoryLevel.quantity = body.quantity;
		await this.inventoryLevelRepository.save(inventoryLevel);

		if (body.optionValues && Array.isArray(body.optionValues)) {
			const rows = await this.productVariantOptionValueRepository.find({
				where: { variant: { uuid: variant.uuid } },
				relations: { variant: true },
			});

			await this.productVariantOptionValueRepository.remove(rows);

			const uniqueOptionValues = [...new Set(body.optionValues)];

			for (const optionValueUUID of uniqueOptionValues) {
				const optionValue = await this.productOptionValueRepository.findOneBy({
					uuid: optionValueUUID,
				});

				if (!optionValue) continue;

				const relation = new ProductVariantOptionValue();
				relation.variant = variant;
				relation.optionValue = optionValue;

				await this.productVariantOptionValueRepository.save(relation);
			}
		}

		if (!skipTranslation) {
			await this.translationService.queueProductTranslation(product.uuid, 5000);
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
		const variant = await this.variantRepository.findOne({
			where: { uuid: uuid, },
			relations: {
				inventoryItem: {
					levels: true,
				},
			},
		});
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
		const variant = await this.variantRepository.findOne({ 
			where: {uuid: uuid},
			relations: {
				product: true
			}
		});
		if (variant === null) {
			throw new NotFoundException({
				error: "Failed to find the variant. Please check and try again.",
			});
		}

		const titleChanged = variant.titleEn !== body.title.en.trim();

		if (titleChanged) {
			await this.translationService.queueFieldTranslation(
				FieldTranslationType.VARIANT_TITLE,
				variant.uuid,
				variant?.product?.uuid,
				body.title.en.trim(),
				'en',
			);
		}

		// Update the variant
		variant.titleEn = body.title.en.trim();
		variant.titleAr = body.title.ar.trim();
		variant.sku = body.sku.trim();
		variant.barcode = body.barcode.trim();
		variant.cost = body.price;
		variant.weight = body.weight;
		variant.dimensions = body.dimensions;
		const savedVariant = await this.variantRepository.save(variant);

		if (body.quantity !== undefined && body.quantity !== null) {
			let inventoryItem = await this.inventoryItemRepository.findOne({
				where: { variant: { uuid: savedVariant.uuid } },
				relations: {
					levels: true,
				},
			});

			if (!inventoryItem) {
				inventoryItem = new InventoryItem();
				inventoryItem.uuid = crypto.randomUUID();
				inventoryItem.variant = savedVariant;
				inventoryItem.sku = savedVariant.sku;
			}

			inventoryItem.sku = savedVariant.sku;
			await this.inventoryItemRepository.save(inventoryItem);

			let inventoryLevel = Array.isArray(inventoryItem.levels) && inventoryItem.levels.length > 0
				? inventoryItem.levels[0]
				: null;

			if (!inventoryLevel) {
				const warehouse = await this.warehouseRepository.findOne({
					order: { id: "ASC" },
				});

				if (!warehouse) {
					throw new NotFoundException({
						error: "Failed to find a warehouse for this variant. Please create a warehouse first.",
					});
				}

				inventoryLevel = new InventoryLevel();
				inventoryLevel.uuid = crypto.randomUUID();
				inventoryLevel.inventoryItem = inventoryItem;
				inventoryLevel.warehouse = warehouse;
			}

			inventoryLevel.quantity = body.quantity;
			await this.inventoryLevelRepository.save(inventoryLevel);
		}

		return savedVariant;
	}

	/**
	 * Deletes a variant
	 *
	 * @param uuid
	 */
	async delete(uuid: string): Promise<void> {
		this.logger.log(`Deleting variant: ${uuid}`);

		const variant = await this.variantRepository.findOneBy({
			uuid: uuid,
		});

		if (variant === null) {
			throw new NotFoundException({
				error: "Failed to find the variant. Please check and try again.",
			});
		}

		await this.variantRepository.delete({
			uuid: uuid,
		});
	}

	/**
	 * Bulk update stock for multiple variants
	 * Used by external stock tracker service
	 */
	async bulkStockUpdate(dto: BulkStockUpdateDto): Promise<{
		success: number;
		failed: number;
		errors: Array<{ variantUuid: string; error: string }>;
	}> {
		this.logger.log(`Bulk stock update for ${dto.updates.length} variants`);

		const errors: Array<{ variantUuid: string; error: string }> = [];
		let success = 0;

		// Process updates in batches
		const batchSize = 20;
		const batches = chunkArray(dto.updates, batchSize);

		for (const batch of batches) {
			const promises = batch.map(async (update) => {
				try {
					await this.updateVariantStockInternal(update);
					success++;
				} catch (error: any) {
					errors.push({
						variantUuid: update.variantUuid,
						error: error.message,
					});
					this.logger.error(
						`Failed to update stock for variant ${update.variantUuid}: ${error.message}`,
					);
				}
			});

			await Promise.all(promises);
		}

		this.logger.log(
			`Bulk stock update complete: ${success} succeeded, ${errors.length} failed`,
		);

		return {
			success,
			failed: errors.length,
			errors,
		};
	}

	/**
	 * Internal method to update variant stock
	 */
	private async updateVariantStockInternal(update: StockUpdateItemDto): Promise<void> {
		const variant = await this.variantRepository.findOne({
			where: { uuid: update.variantUuid },
			relations: ['inventoryItem', 'inventoryItem.levels', 'inventoryItem.levels.warehouse'],
		});

		if (!variant) {
			throw new NotFoundException(`Variant ${update.variantUuid} not found`);
		}

		if (!variant.inventoryItem) {
			throw new BadRequestException(`Variant ${update.variantUuid} has no inventory item`);
		}

		// Find or create inventory level for the warehouse
		let level = variant.inventoryItem.levels.find(
			(l) => l.warehouse?.uuid === update.warehouseUuid,
		);

		if (!level) {
			// Create new inventory level for this warehouse
			const warehouse = await this.warehouseRepository.findOne({
				where: { uuid: update.warehouseUuid },
			});

			if (!warehouse) {
				throw new NotFoundException(`Warehouse ${update.warehouseUuid} not found`);
			}

			level = new InventoryLevel();
			level.uuid = crypto.randomUUID();
			level.inventoryItem = variant.inventoryItem;
			level.warehouse = warehouse;
			level.quantity = 0;
		}

		level.quantity = update.quantity;
		await this.inventoryLevelRepository.save(level);

		// If stock is 0, update product status if needed
		if (update.quantity === 0) {
			const product = await this.productRepository.findOne({
				where: { id: variant.productId },
			});

			if (product && product.status === 'active') {
				this.logger.log(`Variant ${update.variantUuid} stock set to 0`);
			}
		}
	}

}

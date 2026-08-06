import * as crypto from "node:crypto";

import {
	BadRequestException,
	Inject,
	Injectable,
	InternalServerErrorException,
	Logger,
	NotFoundException
} from '@nestjs/common';

import { Job } from "bullmq";

import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';

import { S3Service } from "../common/s3.service";
import { FileService } from "../common/file.service";
import { ImageThumbnailService } from "../common/image-thumbnail.service";

import { getSkipAndTake } from "../common/pagination";
import { generateSlug } from "../common/slug";
import { sortProducts } from "../common/product-variant-filter";

import { CreateProductDto } from './dtos/CreateProductDto';
import { UpdateProductDto } from './dtos/UpdateProductDto';
import { UpdateProductSlugDto } from './dtos/UpdateProductSlugDto';
import { UpdateProductStatusDto } from './dtos/UpdateProductStatusDto';
import { UpdateProductFeaturedImageDto } from "./dtos/UpdateProductFeaturedImageDto";

import { ProductStatus } from './enums/ProductStatus.enum';
import { ProductSort } from "./enums/ProductSort.enum";
import { AttachmentMediaType } from "./enums/AttachmentMediaType.enum";
import { CurrencyCode } from "./enums/CurrencyCode.enum";

import { Category } from "./entities/category.entity";
import { Product } from './entities/product.entity';
import { ProductCategory } from "./entities/product-category.entity";
import { ProductVariant } from "./entities/product-variant.entity";
import { ProductVariantImage } from "./entities/product-variant-image.entity";

import { TranslationService } from "../translation/translation.service";
import { FieldTranslationType } from "../translation/enums/FieldTranslationType.enum";
import { Customer } from "src/customers/entities/customer.entity";
import { ProductView } from "./entities/product-view.entity";
import { QueueService } from "src/queue/queue.service";
import { QueueName } from "src/queue/enums/QueueTypes.enum";
import { ProductCategoryResyncJobData } from "src/queue/types";
import { Campaign } from "src/campaigns/entities/campaign.entity";
import { ProductAttachment } from "./entities/product-attachment.entity";
import { PricingService } from "src/pricing/pricing.service";

@Injectable()
export class ProductsService {
	private readonly logger = new Logger(ProductsService.name);

	// Determine the search column based on the language
	TSV_TITLE_COLUMNS_MAP: Record<string, string> = {
		"en": "product.tsv_title_en",
		"ar": "product.tsv_title_ar",
	};

	// Get the config language
	CONFIG_LANGUAGE_MAP: Record<string, string> = {
		"en": "english",
		"ar": "arabic",
	};

	constructor(
		@Inject(FileService) private readonly fileService: FileService,
		@Inject(ImageThumbnailService) private readonly imageThumbnailService: ImageThumbnailService,
		@Inject(PricingService) private readonly pricingService: PricingService,
		@Inject(QueueService) private readonly queueService: QueueService,
		@Inject(S3Service) private readonly s3Service: S3Service,
		@Inject(TranslationService) private readonly translationService: TranslationService,
		@InjectRepository(Campaign) private readonly campaignRepository: Repository<Campaign>,
		@InjectRepository(Category) private readonly categoryRepository: Repository<Category>,
		@InjectRepository(Product) private readonly productRepository: Repository<Product>,
		@InjectRepository(ProductAttachment) private readonly productAttachmentRepository: Repository<ProductAttachment>,
		@InjectRepository(ProductCategory) private readonly productCategoryRepository: Repository<ProductCategory>,
		@InjectRepository(ProductVariant) private readonly productVariantRepository: Repository<ProductVariant>,
		@InjectRepository(ProductVariantImage) private readonly productImageVariantImageRepository: Repository<ProductVariantImage>,
		@InjectRepository(ProductView) private readonly productViewRepository: Repository<ProductView>,
	) { }

	private chunkArray<T>(items: T[], chunkSize: number): T[][] {
		const chunks: T[][] = [];
		for (let i = 0; i < items.length; i += chunkSize) {
			chunks.push(items.slice(i, i + chunkSize));
		}
		return chunks;
	}

	private async getCategoryMaps(): Promise<{
		byUuid: Map<string, Pick<Category, "id" | "uuid" | "parentId">>;
		byId: Map<number, Pick<Category, "id" | "uuid" | "parentId">>;
	}> {
		const categories = await this.categoryRepository.find({
			select: {
				id: true,
				uuid: true,
				parentId: true,
			},
		});

		return {
			byUuid: new Map(categories.map((category) => [category.uuid, category])),
			byId: new Map(categories.map((category) => [category.id, category])),
		};
	}

	private async expandCategoryUuidsWithAncestors(
		categoryUuids: string[],
		categoryMaps?: {
			byUuid: Map<string, Pick<Category, "id" | "uuid" | "parentId">>;
			byId: Map<number, Pick<Category, "id" | "uuid" | "parentId">>;
		},
	): Promise<string[]> {
		const uniqueInputUuids = [...new Set(categoryUuids)];
		if (uniqueInputUuids.length === 0) {
			return [];
		}

		const maps = categoryMaps ?? await this.getCategoryMaps();
		const byUuid = maps.byUuid;
		const byId = maps.byId;
		const expandedUuids = new Set<string>();

		for (const categoryUuid of uniqueInputUuids) {
			let current = byUuid.get(categoryUuid);
			if (!current) {
				continue;
			}

			while (current) {
				expandedUuids.add(current.uuid);
				current = current.parentId ? byId.get(current.parentId) : undefined;
			}
		}

		return [...expandedUuids];
	}

	private async recalculateCategoryProductsCount(categoryIds: number[]): Promise<void> {
		if (categoryIds.length === 0) return;
		await this.categoryRepository
			.createQueryBuilder()
			.update(Category)
			.set({
				productsCount: () => `(SELECT COUNT(*) FROM product_categories WHERE product_categories.category_id = categories.id)`,
			})
			.whereInIds(categoryIds)
			.execute();
	}

	private async syncProductCategories(
		product: Product,
		categoryUuids: string[],
		categoryMaps?: {
			byUuid: Map<string, Pick<Category, "id" | "uuid" | "parentId">>;
			byId: Map<number, Pick<Category, "id" | "uuid" | "parentId">>;
		},
	): Promise<void> {
		const oldProductCategories = await this.productCategoryRepository.find({
			where: { product: { id: product.id } },
			relations: { category: true },
		});
		const oldCategoryIds = oldProductCategories
			.map((pc) => pc.category?.id)
			.filter((id): id is number => id !== undefined);

		await this.productCategoryRepository.delete({
			product: { id: product.id },
		});

		const expandedCategoryUuids = await this.expandCategoryUuidsWithAncestors(categoryUuids, categoryMaps);

		const newCategoryIds: number[] = [];
		if (expandedCategoryUuids.length > 0) {
			const categories = await this.categoryRepository.findBy({
				uuid: In(expandedCategoryUuids),
			});
			const categoriesByUuid = new Map(categories.map((category) => [category.uuid, category]));
			for (const categoryUUID of expandedCategoryUuids) {
				const category = categoriesByUuid.get(categoryUUID);
				if (!category) continue;
				const productCategory = new ProductCategory();
				productCategory.product = product;
				productCategory.category = category;
				await this.productCategoryRepository.save(productCategory);
				newCategoryIds.push(category.id);
			}
		}

		const allAffectedCategoryIds = [...new Set([...oldCategoryIds, ...newCategoryIds])];
		await this.recalculateCategoryProductsCount(allAffectedCategoryIds);
	}

	async enqueueProductCategoriesResync(body: {
		scope?: "all" | "selected";
		productUuids?: string[];
	}): Promise<{
		jobId: string;
		status: "queued";
		scope: "all" | "selected";
		productsCount: number;
	}> {
		const scope = body.scope ?? "selected";
		if (scope === "all") {
			if (body.productUuids?.length) {
				throw new BadRequestException({
					message: "productUuids is not allowed when scope is all",
				});
			}

			const products = await this.productRepository.find({
				select: { uuid: true },
			});
			const productUuids = products.map((product) => product.uuid);
			if (!productUuids.length) {
				throw new BadRequestException({
					message: "No products found for category resync",
				});
			}

			const queued = await this.queueService.addProductCategoryResyncJob(productUuids);
			return {
				...queued,
				scope,
				productsCount: productUuids.length,
			};
		}

		const productUuids = body.productUuids ?? [];
		if (!productUuids.length) {
			throw new BadRequestException({
				message: "productUuids must be a non-empty array when scope is selected",
			});
		}

		const queued = await this.queueService.addProductCategoryResyncJob(productUuids);
		return {
			...queued,
			scope,
			productsCount: productUuids.length,
		};
	}

	async getProductCategoriesResyncJob(jobId: string): Promise<{
		jobId: string;
		status: "queued" | "active" | "completed" | "failed" | "not_found";
		progress?: string | number | boolean | object;
		result?: any;
		failedReason?: string | null;
	}> {
		const job = await this.queueService.getJob(
			QueueName.PRODUCT_CATEGORY_RESYNC,
			jobId
		) as Job<ProductCategoryResyncJobData> | null;

		if (!job) {
			return { jobId, status: "not_found" };
		}

		const state = await job.getState();
		const statusMap: Record<string, "queued" | "active" | "completed" | "failed"> = {
			waiting: "queued",
			delayed: "queued",
			paused: "queued",
			active: "active",
			completed: "completed",
			failed: "failed",
		};

		return {
			jobId,
			status: statusMap[state] ?? "queued",
			progress: job.progress,
			result: job.returnvalue,
			failedReason: job.failedReason ?? null,
		};
	}

	async resyncProductCategoriesByProducts(productUuids: string[] = []): Promise<{
		processed: number;
		updated: number;
		skipped: number;
		failed: number;
		failedProducts: Array<{ productUuid: string; error: string; }>;
	}> {
		this.logger.log(`Resyncing product categories with ancestor chain`);

		const categoryMaps = await this.getCategoryMaps();
		let updated = 0;
		let skipped = 0;
		let failed = 0;
		const failedProducts: Array<{ productUuid: string; error: string; }> = [];
		const uniqueProductUuids = [...new Set(productUuids)];
		const productUuidChunks = this.chunkArray(uniqueProductUuids, 200);
		let processed = 0;

		for (const productUuidChunk of productUuidChunks) {
			const products = await this.productRepository.find({
				select: {
					id: true,
					uuid: true,
				},
				relations: {
					productCategories: {
						category: true,
					},
				},
				where: {
					uuid: In(productUuidChunk),
				},
			});
			processed += products.length;

			for (const product of products) {
				try {
					const existingCategoryUuids = (product.productCategories ?? [])
						.map((productCategory) => productCategory.category?.uuid)
						.filter((uuid): uuid is string => Boolean(uuid));

					const expandedCategoryUuids = await this.expandCategoryUuidsWithAncestors(existingCategoryUuids, categoryMaps);
					const existingSet = new Set(existingCategoryUuids);
					const expandedSet = new Set(expandedCategoryUuids);
					const hasSameCategories = existingSet.size === expandedSet.size
						&& [...existingSet].every((uuid) => expandedSet.has(uuid));

					if (hasSameCategories) {
						skipped += 1;
						continue;
					}

					await this.syncProductCategories(product, existingCategoryUuids, categoryMaps);
					updated += 1;
				} catch (error) {
					failed += 1;
					failedProducts.push({
						productUuid: product.uuid,
						error: error instanceof Error ? error.message : "Unknown error",
					});
				}
			}
		}

		return {
			processed,
			updated,
			skipped,
			failed,
			failedProducts,
		};
	}

	/**
	 * Populates each product with its cheapest variant
	 *
	 * @param products
	 * @returns
	 */
	async __populateWithCheapestVariant(products: Array<Product>): Promise<Array<Product>> {
		if (!Array.isArray(products) || products.length === 0) {
			return [];
		}

		// Map the products to product ids.
		const productIds = products.map(product => product.id).sort((productIdA, productIdB) => productIdB - productIdA);

		// Find the cheapest variant of each product
		let variants: Array<ProductVariant> = [];
		if (Array.isArray(productIds) && productIds.length !== 0) {
			variants = await this.productVariantRepository.createQueryBuilder('variant')
				.cache(true)
				.setFindOptions({
					relationLoadStrategy: "query",
				})
				.leftJoinAndSelect("variant.images", "images")
				.where('variant.product_id IN (:...productIds)', {
					productIds: productIds,
				})
				.distinctOn(['variant.product_id'])
				.orderBy('variant.product_id', 'ASC')
				.addOrderBy('variant.cost_amount', 'ASC')
				.getMany();
		}

		// Create a map of product to variant
		const variantsMap = Object.fromEntries(
			variants.map(variant => [variant.productId, variant]),
		);

		// Attach the variants to each product.
		return products
			.filter(product => variantsMap[product.id] !== undefined)
			.map(product => {
				product.variants = [
					variantsMap[product.id],
				];
				return product;
			});
	}

	/**
	 * Populates each product with its most expensive variants
	 *
	 * @param products
	 * @returns
	 */
	async __populateWithPriciestVariant(products: Array<Product>): Promise<Array<Product>> {
		if (!Array.isArray(products) || products.length === 0) {
			return [];
		}

		// Map the products to product ids.
		const productIds = products.map(product => product.id).sort((productIdA, productIdB) => productIdB - productIdA);

		// Find the cheapest variant of each product
		let variants: Array<ProductVariant> = [];
		if (Array.isArray(productIds) && productIds.length !== 0) {
			variants = await this.productVariantRepository.createQueryBuilder('variant')
				.cache(true)
				.setFindOptions({
					relationLoadStrategy: "query",
				})
				.leftJoinAndSelect("variant.images", "images")
				.where('variant.product_id IN (:...productIds)', {
					productIds: productIds,
				})
				.distinctOn(['variant.product_id'])
				.orderBy('variant.product_id', 'ASC')
				.addOrderBy('variant.cost_amount', 'DESC')
				.getMany();
		}

		// Create a map of product to variant
		const variantsMap = Object.fromEntries(
			variants.map(variant => [variant.productId, variant]),
		);

		// Attach the variants to each product.
		return products
			.filter(product => variantsMap[product.id] !== undefined)
			.map(product => {
				product.variants = [
					variantsMap[product.id],
				];
				return product;
			});
	}

	/**
	 * Creates a new product
	 *
	 * @param body
	 * @returns
	 */
	async createProduct(body: CreateProductDto): Promise<Product> {
		this.logger.log(`Attempting to create product: ${body.title.en}`);

		let product: Product | null = null;

		// Check if a product already exists by the same procurement id
		if (body.procurementId !== null) {
			product = await this.productRepository.findOne({
				relationLoadStrategy: "query",
				where: {
					procurementId: body.procurementId,
				},
			});
		}

		if (product) {
			this.logger.log(`Updating existing product with procurement id: ${body.procurementId}`);
		} else {
			// CREATE new product
			this.logger.log(`Creating new product: ${body.title.en}`);
			product = new Product();
			product.uuid = crypto.randomUUID();
			product.status = ProductStatus.DRAFT; // Save products as draft
			product.publishedAt = new Date();
		}

		product.slug = generateSlug(body.slug);
		product.titleEn = body.title.en.trim();
		product.titleAr = body.title.ar.trim();
		product.briefEn = body.brief.en.trim();
		product.briefAr = body.brief.ar.trim();
		product.descriptionEn = body.description.en.trim();
		product.descriptionAr = body.description.ar.trim();
		product.descriptionHtmlEn = body.descriptionHtml.en.trim();
		product.descriptionHtmlAr = body.descriptionHtml.ar.trim();
		product.shopId = body.shopId ?? null;
		product.shopName = body.shopName ?? null;
		product.procurementId = body.procurementId ?? null;

		await this.productRepository.save(product);

		// Find the categories and create product categories.
		// This is to join the categories to its associated product.
		if (body.categories !== null && Array.isArray(body.categories)) {
			await this.syncProductCategories(product, body.categories);
		}

		return product;
	}

	/**
	 * Registers a product view
	 *
	 * @param customer
	 * @param product
	 * @returns
	 */
	async registerProductView(customer: Customer, product: Product): Promise<ProductView> {
		this.logger.log(`Registering a product view`);

		// Check if an existing view exists
		const existingProductView = await this.productViewRepository.findOne({
			where: {
				customer: { id: customer.id, },
				product: { id: product.id, },
			},
		});

		// Update the existing view
		if (existingProductView) {
			existingProductView.viewsCount += 1;
			return this.productViewRepository.save(existingProductView);
		}

		// Create a new view
		const productView = new ProductView();
		productView.uuid = crypto.randomUUID();
		productView.customer = customer;
		productView.product = product;
		productView.viewsCount = 1;
		return this.productViewRepository.save(productView);
	}

	/**
	 * Finds products that have at least one variant without skuMeta.
	 */
	async findProductsWithVariantsMissingSkuMeta(status?: ProductStatus): Promise<{
		totalMissingSkuVariants: number;
		totalProducts: number;
		data: Array<{
			uuid: string;
			name: string;
			procurementId: string | null;
			totalVariants: number;
			missingSkuVariants: number;
		}>;
	}> {
		this.logger.log(`Retrieving products with variants missing skuMeta`);

		const query = this.productRepository.createQueryBuilder("product")
			.setFindOptions({
				relationLoadStrategy: "query",
			})
			.leftJoin("product.variants", "variant")
			.select("product.uuid", "uuid")
			.addSelect("product.titleEn", "name")
			.addSelect("product.procurementId", "procurementId")
			.addSelect("COUNT(variant.id)", "totalVariants")
			.addSelect(
				"SUM(CASE WHEN variant.skuMeta IS NULL THEN 1 ELSE 0 END)",
				"missingSkuVariants",
			)
			.groupBy("product.id")
			.addGroupBy("product.uuid")
			.addGroupBy("product.titleEn")
			.having("SUM(CASE WHEN variant.skuMeta IS NULL THEN 1 ELSE 0 END) > 0")
			.orderBy("product.id", "DESC");

		if (status) {
			query.andWhere("product.status = :status", { status });
		}

		const rows = await query.getRawMany<{
			uuid: string;
			name: string;
			procurementId: string | null;
			totalVariants: string;
			missingSkuVariants: string;
		}>();

		const data = rows.map((row) => ({
			uuid: row.uuid,
			name: row.name,
			procurementId: row.procurementId ?? null,
			totalVariants: Number(row.totalVariants ?? 0),
			missingSkuVariants: Number(row.missingSkuVariants ?? 0),
		}));

		return {
			totalMissingSkuVariants: data.reduce((sum, item) => sum + item.missingSkuVariants, 0),
			totalProducts: data.length,
			data,
		};
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
	findAllUncached(filters: string, sort: ProductSort, pageNumber: number = 1, itemsPerPage: number = 100): Promise<Array<Product>> {
		this.logger.log(`Retrieving products uncached`);

		// Get pagination params
		const { skip, take } = getSkipAndTake(pageNumber, itemsPerPage);

		// Parse the filters
		let f: {
			slug?: string,
			query?: string,
		} = {};
		try {
			f = JSON.parse(filters);
		} catch {
			this.logger.warn("Unable to parse filters. Please check the documentation and try again.");
		}

		// Returns products by category
		if (f.slug !== undefined) {
			return this.findAllByCategoryUncached(f.slug, pageNumber, itemsPerPage);
		}

		// Returns products by query
		if (f.query !== undefined) {
			return this.searchProductsUncached(f.query, "en", ProductSort.BestMatch, pageNumber, itemsPerPage);
		}

		// Find the products
		return this.productRepository.find({
			relationLoadStrategy: "query",
			relations: {
				productCategories: {
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
	 * Finds a list of products
	 *
	 * @param filters
	 * @param currency
	 * @param sort
	 * @param pageNumber
	 * @param itemsPerPage
	 * @returns
	 */
	async findAll(filters: string, currency: CurrencyCode, sort: ProductSort, pageNumber: number = 1, itemsPerPage: number = 100): Promise<Array<Product>> {
		this.logger.log(`Retrieving products for graphql`);

		// To make sure we don't always show the latest products on the homepage, we need to return random products.
		// This will be done by making page number a random value between 2 and 100 on the default request
		if (pageNumber === 1) {
			pageNumber = Math.max(2, Math.floor(Math.random() * 100));
		}

		// Find products based on the sort order
		let products: Array<Product> = [];
		switch (sort) {
			case ProductSort.BestMatch:
				products = await this.__getBestMatchProducts(pageNumber, itemsPerPage);
				break;
			case ProductSort.BestSellers:
				products = await this.__getBestSellersProducts(pageNumber, itemsPerPage);
				break;
			case ProductSort.MostFavorited:
				products = await this.__getMostFavoritedProducts(pageNumber, itemsPerPage);
				break;
			case ProductSort.NewArrivals:
				products = await this.__getNewArrivalsProducts(pageNumber, itemsPerPage);
				break;
			case ProductSort.MostRated:
				products = await this.__getMostRatedProducts(pageNumber, itemsPerPage);
				break;
			case ProductSort.PriceHighToLow:
				products = await this.__getPriceHighToLowProducts(pageNumber, itemsPerPage);
				break;
			case ProductSort.PriceLowToHigh:
				products = await this.__getPriceLowToHighProducts(pageNumber, itemsPerPage);
				break;
			default: // do nothing
				break;
		}

		// Due to random page, sometimes we overshoot the page number,
		// so as fallback we should show products from page number 2
		if (Array.isArray(products) && products.length === 0) {
			return this.findAll(filters, currency, sort, 2, itemsPerPage);
		}

		// Attach the campaign against each product
		return this.__findCampaignsAndPrices(products, currency, sort);
	}

	/**
	 * Returns a list of best matched products
	 *
	 * @param pageNumber
	 * @param itemsPerPage
	 * @returns
	 */
	async __getBestMatchProducts(pageNumber: number = 1, itemsPerPage: number = 24): Promise<Array<Product>> {
		this.logger.log(`Retrieving best matched products, pageNumber: ${pageNumber}, itemsPerPage: ${itemsPerPage}`);

		// Get pagination params
		const { skip, take } = getSkipAndTake(pageNumber, itemsPerPage);

		// Find all the active products and cache the result
		const products = await this.productRepository.find({
			cache: true,
			relationLoadStrategy: "query",
			where: {
				status: ProductStatus.ACTIVE,
			},
			relations: {
				productCategories: {
					category: true,
				},
			},
			order: {
				id: "DESC",
			},
			skip: skip,
			take: take,
		});

		return this.__populateWithCheapestVariant(products);
	}

	/**
	 * Returns a list of most viewed products
	 *
	 * @param pageNumber
	 * @param itemsPerPage
	 * @returns
	 */
	async __getMostViewedProducts(pageNumber: number = 1, itemsPerPage: number = 100): Promise<Array<Product>> {
		this.logger.log(`Retrieving most popular products by views, pageNumber=${pageNumber}, itemsPerPage=${itemsPerPage}`);

		// Get pagination params
		const { skip, take } = getSkipAndTake(pageNumber, itemsPerPage);

		// Returns a list of products based on the number of views
		const products = await this.productRepository.find({
			cache: true,
			relationLoadStrategy: "query",
			where: {
				status: ProductStatus.ACTIVE,
			},
			relations: {
				productCategories: {
					category: true,
				},
			},
			order: {
				viewsCount: "DESC",
			},
			skip: skip,
			take: take,
		});

		return this.__populateWithCheapestVariant(products);
	}

	/**
	 * Returns a list of best selling products
	 *
	 * @param pageNumber
	 * @param itemsPerPage
	 * @returns
	 */
	async __getBestSellersProducts(pageNumber: number = 1, itemsPerPage: number = 24): Promise<Array<Product>> {
		this.logger.log(`Retrieving best seller products, pageNumber: ${pageNumber}, itemsPerPage: ${itemsPerPage}`);

		// Get pagination params
		const { skip, take } = getSkipAndTake(pageNumber, itemsPerPage);

		// Find all the active products and cache the result
		const products = await this.productRepository.find({
			cache: true,
			relationLoadStrategy: "query",
			where: {
				status: ProductStatus.ACTIVE,
			},
			relations: {
				productCategories: {
					category: true,
				},
			},
			order: {
				salesCount: "DESC",
			},
			skip: skip,
			take: take,
		});

		return this.__populateWithCheapestVariant(products);
	}

	/**
	 * Returns a list of most favorited products
	 *
	 * @param pageNumber
	 * @param itemsPerPage
	 * @returns
	 */
	async __getMostFavoritedProducts(pageNumber: number = 1, itemsPerPage: number = 24): Promise<Array<Product>> {
		this.logger.log(`Retrieving most favorited products, pageNumber: ${pageNumber}, itemsPerPage: ${itemsPerPage}`);

		// Get pagination params
		const { skip, take } = getSkipAndTake(pageNumber, itemsPerPage);

		// Find all the active products and cache the result
		const products = await this.productRepository.find({
			cache: true,
			relationLoadStrategy: "query",
			where: {
				status: ProductStatus.ACTIVE,
			},
			relations: {
				productCategories: {
					category: true,
				},
			},
			order: {
				likesCount: "DESC",
			},
			skip: skip,
			take: take,
		});

		return this.__populateWithCheapestVariant(products);
	}

	/**
	 * Returns a list of newly arrived products
	 *
	 * @param pageNumber
	 * @param itemsPerPage
	 * @returns
	 */
	async __getNewArrivalsProducts(pageNumber: number = 1, itemsPerPage: number = 24): Promise<Array<Product>> {
		this.logger.log(`Retrieving newly arrived products, pageNumber: ${pageNumber}, itemsPerPage: ${itemsPerPage}`);

		// Get pagination params
		const { skip, take } = getSkipAndTake(pageNumber, itemsPerPage);

		// Find all the active products and cache the result
		const products = await this.productRepository.find({
			cache: true,
			relationLoadStrategy: "query",
			where: {
				status: ProductStatus.ACTIVE,
			},
			relations: {
				productCategories: {
					category: true,
				},
			},
			order: {
				id: "DESC",
			},
			skip: skip,
			take: take,
		});

		return this.__populateWithCheapestVariant(products);
	}

	/**
	 * Returns a list of most rated products
	 *
	 * @param pageNumber
	 * @param itemsPerPage
	 * @returns
	 */
	async __getMostRatedProducts(pageNumber: number = 1, itemsPerPage: number = 24): Promise<Array<Product>> {
		this.logger.log(`Retrieving most rated products, pageNumber: ${pageNumber}, itemsPerPage: ${itemsPerPage}`);

		// Get pagination params
		const { skip, take } = getSkipAndTake(pageNumber, itemsPerPage);

		// Find all the active products and cache the result
		const products = await this.productRepository.find({
			cache: true,
			relationLoadStrategy: "query",
			where: {
				status: ProductStatus.ACTIVE,
			},
			relations: {
				productCategories: {
					category: true,
				},
			},
			order: {
				ratingAvg: "DESC",
			},
			skip: skip,
			take: take,
		});

		return this.__populateWithCheapestVariant(products);
	}

	/**
	 * Returns a list of products with their prices high to low
	 *
	 * @param pageNumber
	 * @param itemsPerPage
	 */
	async __getPriceHighToLowProducts(pageNumber: number = 1, itemsPerPage: number = 24): Promise<Array<Product>> {
		this.logger.log(`Retrieving high to low products, pageNumber: ${pageNumber}, itemsPerPage: ${itemsPerPage}`);

		// Get pagination params
		const { skip, take } = getSkipAndTake(pageNumber, itemsPerPage);

		// Find all the active products and cache the result
		const products = await this.productRepository.find({
			cache: true,
			relationLoadStrategy: "query",
			where: {
				status: ProductStatus.ACTIVE,
			},
			relations: {
				productCategories: {
					category: true,
				},
			},
			order: {
				id: "DESC",
			},
			skip: skip,
			take: take,
		});

		return this.__populateWithPriciestVariant(products);
	}

	/**
	 * Returns a list of products with their prices high to low
	 *
	 * @param pageNumber
	 * @param itemsPerPage
	 */
	async __getPriceLowToHighProducts(pageNumber: number = 1, itemsPerPage: number = 24): Promise<Array<Product>> {
		this.logger.log(`Retrieving low to high products, pageNumber: ${pageNumber}, itemsPerPage: ${itemsPerPage}`);

		// Get pagination params
		const { skip, take } = getSkipAndTake(pageNumber, itemsPerPage);

		// Find all the active products and cache the result
		const products = await this.productRepository.find({
			cache: true,
			relationLoadStrategy: "query",
			where: {
				status: ProductStatus.ACTIVE,
			},
			relations: {
				productCategories: {
					category: true,
				},
			},
			order: {
				id: "DESC",
			},
			skip: skip,
			take: take,
		});

		return this.__populateWithCheapestVariant(products);
	}

	/**
	 * Returns the estimated count of products
	 *
	 * @returns
	 */
	countAll(): Promise<number> {
		return this.productRepository.count({
			cache: true,
		});
	}

	/**
	 * Returns all products for export
	 *
	 * @param pagesCount
	 * @returns
	 */
	async findAllForExport(pagesCount: number): Promise<Array<Product>> {
		this.logger.log(`Finding all products for export in pages`);

		/**
		 * The resulting products in the list
		 */
		let res: Array<Product> = [];

		/**
		 * Pagination params
		 */
		let pageNumber = 1,
			itemsPerPage = 24;

		while (pageNumber <= pagesCount) {
			this.logger.log(`Retrieving products on page: ${pageNumber}`);

			// Get the pagination
			const { skip, take } = getSkipAndTake(pageNumber, itemsPerPage);

			// Fetch the products
			let products = await this.productRepository.find({
				relationLoadStrategy: "query",
				where: {
					status: ProductStatus.ACTIVE,
				},
				relations: {
					productCategories: {
						category: true,
					},
				},
				order: {
					id: "DESC",
				},
				skip: skip,
				take: take,
			});

			// Map the products to product ids
			const productIds = products.map(product => product.id).sort((productIdA, productIdB) => productIdB - productIdA);

			// Find the cheapest variant of each product
			let variants: Array<ProductVariant> = [];
			if (Array.isArray(productIds) && productIds.length !== 0) {
				variants = await this.productVariantRepository.createQueryBuilder('variant')
					.setFindOptions({
						relationLoadStrategy: "query",
					})
					.where('variant.product_id IN (:...productIds)', {
						productIds: productIds,
					})
					.distinctOn(['variant.product_id'])
					.orderBy('variant.product_id', 'ASC')
					.addOrderBy('variant.cost_amount', 'ASC')
					.getMany();
			}

			// Map the variants to their products
			const variantsMap = Object.fromEntries(
				variants.map(variant => [variant.productId, variant]),
			);

			// Assing the variants to each product.
			products = products
				.filter(product => variantsMap[product.id] !== undefined)
				.map(product => {
					product.variants = [
						variantsMap[product.id],
					];
					return product;
				});

			// Add the products to the result
			res = res.concat(products);

			// Break the loop at the end
			if (products.length < itemsPerPage) {
				break;
			}

			this.logger.log(`Retrieved ${products.length} on pageNumber: ${pageNumber}`);

			// Increment the page number
			pageNumber += 1;
		}

		return res;
	}

	async findAllByCategoryForExport(category: Category, pagesCount: number): Promise<Array<Product>> {
		this.logger.log(`Finding all product for export in pages using category: ${category.uuid}`);

		/**
		 * The resulting products in the list
		 */
		let res: Array<Product> = [];

		/**
		 * Pagination params
		 */
		let pageNumber = 1,
			itemsPerPage = 24;

		while (pageNumber <= pagesCount) {
			this.logger.log(`Retrieving products on page: ${pageNumber}`);

			// Get the pagination
			const { skip, take } = getSkipAndTake(pageNumber, itemsPerPage);

			// Fetch the products
			let products = await this.productRepository.createQueryBuilder("product")
				.setFindOptions({
					relationLoadStrategy: "query",
				})

				// Load all categories
				.leftJoinAndSelect("product.productCategories", "productCategory")
				.leftJoinAndSelect("productCategory.category", "category")

				// Filter by category
				.innerJoin("product.productCategories", "filterProductCategories")
				.innerJoin("filterProductCategories.category", "filterCategory")

				.where("filterCategory.id = :id", {
					id: category.id,
				})
				.andWhere("product.status = :status", { status: ProductStatus.ACTIVE, })
				.distinct(true)
				.orderBy("product.id", "DESC")
				.skip(skip)
				.take(take)
				.getMany();

			// Map the products to product ids
			const productIds = products.map(product => product.id).sort((productIdA, productIdB) => productIdB - productIdA);

			// Find the cheapest variant of each product
			let variants: Array<ProductVariant> = [];
			if (Array.isArray(productIds) && productIds.length !== 0) {
				variants = await this.productVariantRepository.createQueryBuilder('variant')
					.setFindOptions({
						relationLoadStrategy: "query",
					})
					.where('variant.product_id IN (:...productIds)', {
						productIds: productIds,
					})
					.distinctOn(['variant.product_id'])
					.orderBy('variant.product_id', 'ASC')
					.addOrderBy('variant.cost_amount', 'ASC')
					.getMany();
			}

			// Map the variants to their products
			const variantsMap = Object.fromEntries(
				variants.map(variant => [variant.productId, variant]),
			);

			// Assing the variants to each product.
			products = products
				.filter(product => variantsMap[product.id] !== undefined)
				.map(product => {
					product.variants = [
						variantsMap[product.id],
					];
					return product;
				});

			// Add the products to the result
			res = res.concat(products);

			// Break the loop at the end
			if (products.length < itemsPerPage) {
				break;
			}

			this.logger.log(`Retrieved ${products.length} on pageNumber: ${pageNumber}`);

			// Increment the page number
			pageNumber += 1;
		}

		return res;
	}

	/**
	 * Finds a list of products in a specific category
	 *
	 * @param categorySlug
	 * @param pageNumber
	 * @param itemsPerPage
	 * @returns
	 */
	async findAllByCategoryUncached(categorySlug: string, pageNumber: number = 1, itemsPerPage: number = 100): Promise<Array<Product>> {
		this.logger.log(`Retrieving products uncached by category slug: ${categorySlug}`);

		// Find the category, return empty array if there is not category
		const category = await this.categoryRepository.findOne({
			cache: true,
			where: {
				slug: categorySlug,
			},
		});

		if (category === null) {
			return [];
		}

		// Get pagination params
		const { skip, take } = getSkipAndTake(pageNumber, itemsPerPage);

		// Find the products in the desired category
		return this.productRepository.createQueryBuilder("product")
			.setFindOptions({
				relationLoadStrategy: "query",
			})

			// Many-to-many join
			.innerJoinAndSelect("product.productCategories", "productCategory")
			.innerJoinAndSelect("productCategory.category", "category")

			.where("category.id = :id", {
				id: category.id,
			})
			.andWhere("product.status = :status", { status: ProductStatus.ACTIVE, })
			.distinct(true)
			.orderBy("product.id", "DESC")
			.skip(skip)
			.take(take)
			.getMany();
	}

	/**
	 * Finds a list of products in a specific category
	 *
	 * @param slug
	 * @param currency
	 * @param sort
	 * @param pageNumber
	 * @param itemsPerPage
	 * @returns
	 */
	async findAllByCategory(slug: string, currency: CurrencyCode, sort: ProductSort, pageNumber: number = 1, itemsPerPage: number = 100): Promise<Array<Product>> {
		this.logger.log(`Retrieving products by category slug: ${slug}`);

		// Find the category, return empty array if there is no category against the slug
		const category = await this.categoryRepository.findOne({
			cache: true,
			where: {
				slug: slug,
			},
		});

		// Return empty products as fallback, if the category doesn't exist
		if (category === null) {
			return [];
		}

		// Find products based on the sort order
		let products: Array<Product> = [];
		switch (sort) {
			case ProductSort.BestMatch:
				products = await this.__getBestMatchProductsInCategory(category, pageNumber, itemsPerPage);
				break;
			case ProductSort.BestSellers:
				products = await this.__getBestSellerProductsInCategory(category, pageNumber, itemsPerPage);
				break;
			case ProductSort.MostFavorited:
				products = await this.__getMostFavoritedProductsInCategory(category, pageNumber, itemsPerPage);
				break;
			case ProductSort.NewArrivals:
				products = await this.__getNewArrivalsProductsInCategory(category, pageNumber, itemsPerPage);
				break;
			case ProductSort.MostRated:
				products = await this.__getMostRatedProductsInCategory(category, pageNumber, itemsPerPage);
				break;
			case ProductSort.PriceHighToLow:
				products = await this.__getPriceHighToLowProductsInCategory(category, pageNumber, itemsPerPage);
				break;
			case ProductSort.PriceLowToHigh:
				products = await this.__getPriceLowToHighProductsInCategory(category, pageNumber, itemsPerPage);
				break;
			default: // do nothing
				break;
		}

		// Attach the campaign against each product
		return this.__findCampaignsAndPrices(products, currency, sort);
	}

	/**
	 * Finds a list of products using a list of category slugs
	 *
	 * @param slugs
	 * @param currency
	 * @param sort
	 * @param pageNumber
	 * @param itemsPerPage
	 * @returns
	 */
	async findAllByCategories(slugs: Array<String>, currency: CurrencyCode, sort: ProductSort, pageNumber: number = 1, itemsPerPage: number = 100): Promise<Array<Product>> {
		this.logger.log(`Retrieving products by categories, categories: ${slugs.join(', ')}, pageNumber=${pageNumber}, itemsPerPage=${itemsPerPage}`);

		// Find the categories using their slugs
		const categories = await this.categoryRepository.find({
			cache: true,
			where: {
				slug: In(slugs),
			},
			skip: 0,
			take: 10,
		});

		// Returns empty products as fallback, if the categories doesn't exist
		if (!Array.isArray(categories) || categories.length === 0) {
			return [];
		}

		// Map categories to their ids
		const categoryIds: Array<Category['id']> = categories.map(category => category.id).sort((idA, idB) => idA - idB);
		if (!Array.isArray(categoryIds) || categoryIds.length === 0) {
			return [];
		}

		// Find products based on sort order
		let products: Array<Product> = [];
		switch (sort) {
			case ProductSort.BestMatch:
				products = await this.__getBestMatchProductsInCategories(categoryIds, pageNumber, itemsPerPage);
				break;
			case ProductSort.BestSellers:
				products = await this.__getBestSellersProductsInCategories(categoryIds, pageNumber, itemsPerPage);
				break;
			case ProductSort.MostFavorited:
				products = await this.__getMostFavoritedProductsInCategories(categoryIds, pageNumber, itemsPerPage);
				break;
			case ProductSort.NewArrivals:
				products = await this.__getNewArrivalsProductsInCategories(categoryIds, pageNumber, itemsPerPage);
				break;
			case ProductSort.MostRated:
				products = await this.__getMostRatedProductsInCategories(categoryIds, pageNumber, itemsPerPage);
				break;
			case ProductSort.PriceHighToLow:
				products = await this.__getPriceHighToLowProductsInCategories(categoryIds, pageNumber, itemsPerPage);
				break;
			case ProductSort.PriceLowToHigh:
				products = await this.__getPriceLowToHighProductsInCategories(categoryIds, pageNumber, itemsPerPage);
				break;
			default: // do nothing
				break;
		}

		// Attach the campaign against each product
		return this.__findCampaignsAndPrices(products, currency, sort);
	}

	/**
	 * Get the best matched products in the categories
	 *
	 * @param categoryIds
	 * @param pageNumber
	 * @param itemsPerPage
	 * @returns
	 */
	async __getBestMatchProductsInCategories(categoryIds: Array<Category['id']>, pageNumber: number, itemsPerPage: number): Promise<Array<Product>> {
		if (!Array.isArray(categoryIds) || categoryIds.length === 0) {
			return [];
		}

		// Get pagination params
		const { skip, take } = getSkipAndTake(pageNumber, itemsPerPage);

		// Find the products in the desired category
		const products = await this.productRepository.createQueryBuilder("product")
			.cache(true)
			.setFindOptions({
				relationLoadStrategy: "query",
			})

			// Load all categories
			.leftJoinAndSelect("product.productCategories", "productCategory")
			.leftJoinAndSelect("productCategory.category", "category")

			// Filter by category
			.innerJoin("product.productCategories", "filterProductCategories")
			.innerJoin("filterProductCategories.category", "filterCategory")

			.where("filterCategory.id IN (:...categoryIds)", {
				categoryIds: categoryIds,
			})
			.andWhere("product.status = :status", { status: ProductStatus.ACTIVE, })
			.distinct(true)
			.orderBy("product.id", "DESC")
			.skip(skip)
			.take(take)
			.getMany();

		return this.__populateWithCheapestVariant(products);
	}

	/**
	 * Get the best seller products in the categories
	 *
	 * @param categoryIds
	 * @param pageNumber
	 * @param itemsPerPage
	 * @returns
	 */
	async __getBestSellersProductsInCategories(categoryIds: Array<Category['id']>, pageNumber: number, itemsPerPage: number): Promise<Array<Product>> {
		if (!Array.isArray(categoryIds) || categoryIds.length === 0) {
			return [];
		}

		// Get pagination params
		const { skip, take } = getSkipAndTake(pageNumber, itemsPerPage);

		// Find the products in the desired category
		const products = await this.productRepository.createQueryBuilder("product")
			.cache(true)
			.setFindOptions({
				relationLoadStrategy: "query",
			})

			// Load all categories
			.leftJoinAndSelect("product.productCategories", "productCategory")
			.leftJoinAndSelect("productCategory.category", "category")

			// Filter by category
			.innerJoin("product.productCategories", "filterProductCategories")
			.innerJoin("filterProductCategories.category", "filterCategory")

			.where("filterCategory.id IN (:...categoryIds)", {
				categoryIds: categoryIds,
			})
			.andWhere("product.status = :status", { status: ProductStatus.ACTIVE, })
			.distinct(true)
			.orderBy("product.salesCount", "DESC")
			.skip(skip)
			.take(take)
			.getMany();

		return this.__populateWithCheapestVariant(products);
	}

	/**
	 * Get the most favorited products in the categories
	 *
	 * @param categoryIds
	 * @param pageNumber
	 * @param itemsPerPage
	 * @returns
	 */
	async __getMostFavoritedProductsInCategories(categoryIds: Array<Category['id']>, pageNumber: number, itemsPerPage: number): Promise<Array<Product>> {
		if (!Array.isArray(categoryIds) || categoryIds.length === 0) {
			return [];
		}

		// Get pagination params
		const { skip, take } = getSkipAndTake(pageNumber, itemsPerPage);

		// Find the products in the desired category
		const products = await this.productRepository.createQueryBuilder("product")
			.cache(true)
			.setFindOptions({
				relationLoadStrategy: "query",
			})

			// Load all categories
			.leftJoinAndSelect("product.productCategories", "productCategory")
			.leftJoinAndSelect("productCategory.category", "category")

			// Filter by category
			.innerJoin("product.productCategories", "filterProductCategories")
			.innerJoin("filterProductCategories.category", "filterCategory")

			.where("filterCategory.id IN (:...categoryIds)", {
				categoryIds: categoryIds,
			})
			.andWhere("product.status = :status", { status: ProductStatus.ACTIVE, })
			.distinct(true)
			.orderBy("product.likesCount", "DESC")
			.skip(skip)
			.take(take)
			.getMany();

		return this.__populateWithCheapestVariant(products);
	}

	/**
	 * Get the newly arrived products in the categories
	 *
	 * @param categoryIds
	 * @param pageNumber
	 * @param itemsPerPage
	 * @returns
	 */
	async __getNewArrivalsProductsInCategories(categoryIds: Array<Category['id']>, pageNumber: number, itemsPerPage: number): Promise<Array<Product>> {
		if (!Array.isArray(categoryIds) || categoryIds.length === 0) {
			return [];
		}

		// Get pagination params
		const { skip, take } = getSkipAndTake(pageNumber, itemsPerPage);

		// Find the products in the desired category
		const products = await this.productRepository.createQueryBuilder("product")
			.cache(true)
			.setFindOptions({
				relationLoadStrategy: "query",
			})

			// Load all categories
			.leftJoinAndSelect("product.productCategories", "productCategory")
			.leftJoinAndSelect("productCategory.category", "category")

			// Filter by category
			.innerJoin("product.productCategories", "filterProductCategories")
			.innerJoin("filterProductCategories.category", "filterCategory")

			.where("filterCategory.id IN (:...categoryIds)", {
				categoryIds: categoryIds,
			})
			.andWhere("product.status = :status", { status: ProductStatus.ACTIVE, })
			.distinct(true)
			.orderBy("product.id", "DESC")
			.skip(skip)
			.take(take)
			.getMany();

		return this.__populateWithCheapestVariant(products);
	}

	/**
	 * Get the most rated products in the categories
	 *
	 * @param categoryIds
	 * @param pageNumber
	 * @param itemsPerPage
	 * @returns
	 */
	async __getMostRatedProductsInCategories(categoryIds: Array<Category['id']>, pageNumber: number, itemsPerPage: number): Promise<Array<Product>> {
		if (!Array.isArray(categoryIds) || categoryIds.length === 0) {
			return [];
		}

		// Get pagination params
		const { skip, take } = getSkipAndTake(pageNumber, itemsPerPage);

		// Find the products in the desired category
		const products = await this.productRepository.createQueryBuilder("product")
			.cache(true)
			.setFindOptions({
				relationLoadStrategy: "query",
			})

			// Load all categories
			.leftJoinAndSelect("product.productCategories", "productCategory")
			.leftJoinAndSelect("productCategory.category", "category")

			// Filter by category
			.innerJoin("product.productCategories", "filterProductCategories")
			.innerJoin("filterProductCategories.category", "filterCategory")

			.where("filterCategory.id IN (:...categoryIds)", {
				categoryIds: categoryIds,
			})
			.andWhere("product.status = :status", { status: ProductStatus.ACTIVE, })
			.distinct(true)
			.orderBy("product.ratingAvg", "DESC")
			.skip(skip)
			.take(take)
			.getMany();

		return this.__populateWithCheapestVariant(products);
	}

	/**
	 * Get the price high to low products in the categories
	 *
	 * @param categoryIds
	 * @param pageNumber
	 * @param itemsPerPage
	 * @returns
	 */
	async __getPriceHighToLowProductsInCategories(categoryIds: Array<Category['id']>, pageNumber: number, itemsPerPage: number): Promise<Array<Product>> {
		if (!Array.isArray(categoryIds) || categoryIds.length === 0) {
			return [];
		}

		// Get pagination params
		const { skip, take } = getSkipAndTake(pageNumber, itemsPerPage);

		// Find the products in the desired category
		const products = await this.productRepository.createQueryBuilder("product")
			.cache(true)
			.setFindOptions({
				relationLoadStrategy: "query",
			})

			// Load all categories
			.leftJoinAndSelect("product.productCategories", "productCategory")
			.leftJoinAndSelect("productCategory.category", "category")

			// Filter by category
			.innerJoin("product.productCategories", "filterProductCategories")
			.innerJoin("filterProductCategories.category", "filterCategory")

			.where("filterCategory.id IN (:...categoryIds)", {
				categoryIds: categoryIds,
			})
			.andWhere("product.status = :status", { status: ProductStatus.ACTIVE, })
			.distinct(true)
			.orderBy("product.id", "DESC")
			.skip(skip)
			.take(take)
			.getMany();

		return this.__populateWithPriciestVariant(products);
	}

	/**
	 * Get the price low to high products in the categories
	 *
	 * @param categoryIds
	 * @param pageNumber
	 * @param itemsPerPage
	 * @returns
	 */
	async __getPriceLowToHighProductsInCategories(categoryIds: Array<Category['id']>, pageNumber: number, itemsPerPage: number): Promise<Array<Product>> {
		if (!Array.isArray(categoryIds) || categoryIds.length === 0) {
			return [];
		}

		// Get pagination params
		const { skip, take } = getSkipAndTake(pageNumber, itemsPerPage);

		// Find the products in the desired category
		const products = await this.productRepository.createQueryBuilder("product")
			.cache(true)
			.setFindOptions({
				relationLoadStrategy: "query",
			})

			// Load all categories
			.leftJoinAndSelect("product.productCategories", "productCategory")
			.leftJoinAndSelect("productCategory.category", "category")

			// Filter by category
			.innerJoin("product.productCategories", "filterProductCategories")
			.innerJoin("filterProductCategories.category", "filterCategory")

			.where("filterCategory.id IN (:...categoryIds)", {
				categoryIds: categoryIds,
			})
			.andWhere("product.status = :status", { status: ProductStatus.ACTIVE, })
			.distinct(true)
			.orderBy("product.id", "DESC")
			.skip(skip)
			.take(take)
			.getMany();

		return this.__populateWithCheapestVariant(products);
	}

	/**
	 * Finds and attaches the best campaign to the product
	 *
	 * @param product
	 * @param currency
	 * @returns
	 */
	async __findCampaignAndPrices(product: Product, currency: CurrencyCode): Promise<Product> {
		// Find the campaign
		const campaign = await this.__getProductCampaign(product);
		if (campaign !== null) {
			product.campaign = campaign;
		}

		// Set the base price and discounted price of each variant
		product.variants = await Promise.all(
			product.variants.map(async variant => {
				// Apply base price on the variant
				variant.price = await this.pricingService.applyPriceOnProductVariant(product, variant, campaign, currency, false);

				// Apply discounted price on the variant
				variant.discountedPrice = await this.pricingService.applyPriceOnProductVariant(product, variant, campaign, currency, true);

				return variant;
			})
		);

		return product;
	}

	/**
	 * Finds and attaches the best campaign to each product in the array.
	 *
	 * @brief The best campaign is the one that provides the best discount
	 *
	 * @param products
	 * @param currency
	 * @param sort
	 * @returns
	 */
	async __findCampaignsAndPrices(products: Array<Product>, currency: CurrencyCode, sort: ProductSort): Promise<Array<Product>> {
		if (!Array.isArray(products) || products.length === 0) {
			return [];
		}

		// Find campaign, base price and discounted price
		const res = await Promise.all(
			products.map(async product => {
				// Find the campaign against the product
				const campaign = await this.__getProductCampaign(product);
				if (campaign !== null) {
					product.campaign = campaign;
				}

				// Apply base price on the first variant of the product
				product.variants[0].price = await this.pricingService.applyPriceOnProductVariant(product, product.variants[0], campaign, currency, false);

				// Apply discounted price on the first variant of the product
				product.variants[0].discountedPrice = await this.pricingService.applyPriceOnProductVariant(product, product.variants[0], campaign, currency, true);

				return product;
			})
		);

		// Sort and return the results
		return sortProducts(res, sort);
	}

	/**
	 * Attach the campaign to each product in the array
	 *
	 * @param products
	 * @param campaign
	 * @param currency
	 * @param sort
	 * @returns
	 */
	async __attachCampaignAndPrices(products: Array<Product>, campaign: Campaign, currency: CurrencyCode, sort: ProductSort): Promise<Array<Product>> {
		if (!Array.isArray(products) || products.length === 0) {
			return [];
		}

		// Attach campaign, base price and discounted price
		const res = await Promise.all(
			products.map(async product => {
				// Attach the campaign against the product
				if (campaign !== null) {
					product.campaign = campaign;
				}

				// Apply base price on the first variant of the product
				product.variants[0].price = await this.pricingService.applyPriceOnProductVariant(product, product.variants[0], campaign, currency, false);

				// Apply discounted price on the first variant of the product
				product.variants[0].discountedPrice = await this.pricingService.applyPriceOnProductVariant(product, product.variants[0], campaign, currency, true);

				return product;
			})
		);

		// Sort and return the results
		return sortProducts(res, sort);
	}

	/**
	 * Finds a campaign for the product
	 *
	 * @param product
	 * @returns
	 */
	async __getProductCampaign(product: Product): Promise<Campaign | null> {
		if (product === null || !Array.isArray(product.productCategories) || product.productCategories.length === 0) {
			return null;
		}

		// Find the categories ids of the product
		const categoryIds = product.productCategories.map(entry => entry.category.id).sort((idA, idB) => idA - idB);
		if (categoryIds.length === 0) {
			return null;
		}

		// Find the campaign with maximum discount
		const campaign = await this.campaignRepository.createQueryBuilder("campaign")
			.cache(true)
			.setFindOptions({
				relationLoadStrategy: "query",
			})
			.innerJoin("campaign.campaignCategories", "campaignCategory")
			.innerJoin("campaignCategory.category", "category")
			.where("category.id IN (:...categoryIds)", {
				categoryIds: categoryIds,
			})
			.orderBy("campaign.discountPercentage", "DESC")
			.getOne();

		// Make sure we have have valid campaign against the product
		if (campaign === null || campaign.finishesAt === null || new Date().getTime() >= new Date(campaign.finishesAt).getTime()) {
			return null;
		}

		return campaign;
	}

	/**
	 * Get the best matched products in the category
	 *
	 * @param category
	 * @param pageNumber
	 * @param itemsPerPage
	 * @returns
	 */
	async __getBestMatchProductsInCategory(category: Category, pageNumber: number, itemsPerPage: number): Promise<Array<Product>> {
		if (category === null) {
			return [];
		}

		// Get pagination params
		const { skip, take } = getSkipAndTake(pageNumber, itemsPerPage);

		// Find the products in the desired category
		const products = await this.productRepository.createQueryBuilder("product")
			.cache(true)
			.setFindOptions({
				relationLoadStrategy: "query",
			})

			// Load all categories
			.leftJoinAndSelect("product.productCategories", "productCategory")
			.leftJoinAndSelect("productCategory.category", "category")

			// Filter by category
			.innerJoin("product.productCategories", "filterProductCategories")
			.innerJoin("filterProductCategories.category", "filterCategory")

			.where("filterCategory.id = :id", {
				id: category.id,
			})
			.andWhere("product.status = :status", { status: ProductStatus.ACTIVE, })
			.distinct(true)
			.orderBy("product.id", "DESC")
			.skip(skip)
			.take(take)
			.getMany();

		return this.__populateWithCheapestVariant(products);
	}

	/**
	 * Get the products with most sales in the category
	 *
	 * @param category
	 * @param pageNumber
	 * @param itemsPerPage
	 * @returns
	 */
	async __getBestSellerProductsInCategory(category: Category, pageNumber: number, itemsPerPage: number): Promise<Array<Product>> {
		if (category === null) {
			return [];
		}

		// Get pagination params
		const { skip, take } = getSkipAndTake(pageNumber, itemsPerPage);

		// Find the products in the desired category
		const products = await this.productRepository.createQueryBuilder("product")
			.cache(true)
			.setFindOptions({
				relationLoadStrategy: "query",
			})

			// Load all categories
			.leftJoinAndSelect("product.productCategories", "productCategory")
			.leftJoinAndSelect("productCategory.category", "category")

			// Filter by category
			.innerJoin("product.productCategories", "filterProductCategories")
			.innerJoin("filterProductCategories.category", "filterCategory")

			.where("filterCategory.id = :id", {
				id: category.id,
			})
			.andWhere("product.status = :status", { status: ProductStatus.ACTIVE, })
			.distinct(true)
			.orderBy("product.salesCount", "DESC")
			.skip(skip)
			.take(take)
			.getMany();

		return this.__populateWithCheapestVariant(products);
	}

	/**
	 * Get the products with most likes count in a category
	 *
	 * @param category
	 * @param pageNumber
	 * @param itemsPerPage
	 * @returns
	 */
	async __getMostFavoritedProductsInCategory(category: Category, pageNumber: number, itemsPerPage: number): Promise<Array<Product>> {
		if (category === null) {
			return [];
		}

		// Get pagination params
		const { skip, take } = getSkipAndTake(pageNumber, itemsPerPage);

		// Find the products in the desired category
		const products = await this.productRepository.createQueryBuilder("product")
			.cache(true)
			.setFindOptions({
				relationLoadStrategy: "query",
			})

			// Load all categories
			.leftJoinAndSelect("product.productCategories", "productCategory")
			.leftJoinAndSelect("productCategory.category", "category")

			// Filter by category
			.innerJoin("product.productCategories", "filterProductCategories")
			.innerJoin("filterProductCategories.category", "filterCategory")

			.where("filterCategory.id = :id", {
				id: category.id,
			})
			.andWhere("product.status = :status", { status: ProductStatus.ACTIVE, })
			.distinct(true)
			.orderBy("product.likesCount", "DESC")
			.skip(skip)
			.take(take)
			.getMany();

		return this.__populateWithCheapestVariant(products);
	}

	/**
	 * Get the newly arrived products in a category
	 *
	 * @param category
	 * @param pageNumber
	 * @param itemsPerPage
	 * @returns
	 */
	async __getNewArrivalsProductsInCategory(category: Category, pageNumber: number, itemsPerPage: number): Promise<Array<Product>> {
		if (category === null) {
			return [];
		}

		// Get pagination params
		const { skip, take } = getSkipAndTake(pageNumber, itemsPerPage);

		// Find the products in the desired category
		const products = await this.productRepository.createQueryBuilder("product")
			.cache(true)
			.setFindOptions({
				relationLoadStrategy: "query",
			})

			// Load all categories
			.leftJoinAndSelect("product.productCategories", "productCategory")
			.leftJoinAndSelect("productCategory.category", "category")

			// Filter by category
			.innerJoin("product.productCategories", "filterProductCategories")
			.innerJoin("filterProductCategories.category", "filterCategory")

			.where("filterCategory.id = :id", {
				id: category.id,
			})
			.andWhere("product.status = :status", { status: ProductStatus.ACTIVE, })
			.distinct(true)
			.orderBy("product.id", "DESC")
			.skip(skip)
			.take(take)
			.getMany();

		return this.__populateWithCheapestVariant(products);
	}

	/**
	 * Get the most rated products in the category
	 *
	 * @param category
	 * @param pageNumber
	 * @param itemsPerPage
	 * @returns
	 */
	async __getMostRatedProductsInCategory(category: Category, pageNumber: number, itemsPerPage: number): Promise<Array<Product>> {
		if (category === null) {
			return [];
		}

		// Get pagination params
		const { skip, take } = getSkipAndTake(pageNumber, itemsPerPage);

		// Find the products in the desired category
		const products = await this.productRepository.createQueryBuilder("product")
			.cache(true)
			.setFindOptions({
				relationLoadStrategy: "query",
			})

			// Load all categories
			.leftJoinAndSelect("product.productCategories", "productCategory")
			.leftJoinAndSelect("productCategory.category", "category")

			// Filter by category
			.innerJoin("product.productCategories", "filterProductCategories")
			.innerJoin("filterProductCategories.category", "filterCategory")

			.where("filterCategory.id = :id", {
				id: category.id,
			})
			.andWhere("product.status = :status", { status: ProductStatus.ACTIVE, })
			.distinct(true)
			.orderBy("product.ratingAvg", "DESC")
			.skip(skip)
			.take(take)
			.getMany();

		return this.__populateWithCheapestVariant(products);
	}

	/**
	 * Get the most expensive products in the category
	 *
	 * @param category
	 * @param pageNumber
	 * @param itemsPerPage
	 * @returns
	 */
	async __getPriceHighToLowProductsInCategory(category: Category, pageNumber: number, itemsPerPage: number): Promise<Array<Product>> {
		if (category === null) {
			return [];
		}

		// Get pagination params
		const { skip, take } = getSkipAndTake(pageNumber, itemsPerPage);

		// Find the products in the desired category
		const products = await this.productRepository.createQueryBuilder("product")
			.cache(true)
			.setFindOptions({
				relationLoadStrategy: "query",
			})

			// Load all categories
			.leftJoinAndSelect("product.productCategories", "productCategory")
			.leftJoinAndSelect("productCategory.category", "category")

			// Filter by category
			.innerJoin("product.productCategories", "filterProductCategories")
			.innerJoin("filterProductCategories.category", "filterCategory")

			.where("filterCategory.id = :id", {
				id: category.id,
			})
			.andWhere("product.status = :status", { status: ProductStatus.ACTIVE, })
			.distinct(true)
			.orderBy("product.id", "DESC")
			.skip(skip)
			.take(take)
			.getMany();

		return this.__populateWithPriciestVariant(products);
	}

	/**
	 * Get the least expensive products in the category
	 *
	 * @param category
	 * @param pageNumber
	 * @param itemsPerPage
	 * @returns
	 */
	async __getPriceLowToHighProductsInCategory(category: Category, pageNumber: number, itemsPerPage: number): Promise<Array<Product>> {
		if (category === null) {
			return [];
		}

		// Get pagination params
		const { skip, take } = getSkipAndTake(pageNumber, itemsPerPage);

		// Find the products in the desired category
		const products = await this.productRepository.createQueryBuilder("product")
			.cache(true)
			.setFindOptions({
				relationLoadStrategy: "query",
			})

			// Load all categories
			.leftJoinAndSelect("product.productCategories", "productCategory")
			.leftJoinAndSelect("productCategory.category", "category")

			// Filter by category
			.innerJoin("product.productCategories", "filterProductCategories")
			.innerJoin("filterProductCategories.category", "filterCategory")

			.where("filterCategory.id = :id", {
				id: category.id,
			})
			.andWhere("product.status = :status", { status: ProductStatus.ACTIVE, })
			.distinct(true)
			.orderBy("product.id", "DESC")
			.skip(skip)
			.take(take)
			.getMany();

		return this.__populateWithCheapestVariant(products);
	}

	/**
	 * Returns a list of recently viewed products by a customer
	 *
	 * @param customer
	 * @param currency
	 * @param pageNumber
	 * @param itemsPerPage
	 * @returns
	 */
	async getRecentlyViewedProducts(customer: Customer, currency: CurrencyCode, pageNumber: number = 1, itemsPerPage: number = 100): Promise<Array<Product>> {
		this.logger.log(`Retrieving a list of recenty viewed products`);

		// Get pagination params
		const { skip, take } = getSkipAndTake(pageNumber, itemsPerPage);

		// Get the most recently viewed items
		const productViews = await this.productViewRepository.find({
			where: {
				customer: {
					id: customer.id,
				},
			},
			relations: {
				product: {
					productCategories: {
						category: true,
					},
				},
			},
			order: {
				updatedAt: "DESC",
			},
			skip: skip,
			take: take,
		});

		// Create a list of products
		let products: Array<Product> = productViews.map(view => view.product);
		if (!Array.isArray(products) || products.length === 0) {
			return [];
		}

		// Populate with the cheapest variant
		products = await this.__populateWithCheapestVariant(products);
		if (!Array.isArray(products) || products.length === 0) {
			return [];
		}

		// Attach the products with the associated campaign
		return this.__findCampaignsAndPrices(products, currency, ProductSort.BestMatch);
	}

	/**
	 * Returns products in the featured campaign
	 *
	 * @param currency
	 * @param sort
	 * @param pageNumber
	 * @param itemsPerPage
	 * @returns
	 */
	async getProductsInFeaturedCampaign(currency: CurrencyCode, sort: ProductSort, pageNumber: number = 1, itemsPerPage: number = 24): Promise<Array<Product>> {
		this.logger.log(`Retrieving a list of products in featured campaign`);

		// Find the featured campaign
		const campaign = await this.campaignRepository.findOne({
			cache: true,
			relationLoadStrategy: "query",
			where: {
				isActive: true,
				isFeatured: true,
			},
			relations: {
				campaignCategories: {
					category: true,
				},
			},
		});

		// Make sure the campaign exists and isn't expired
		if (campaign === null || campaign.finishesAt === null || new Date().getTime() >= new Date(campaign.finishesAt).getTime()) {
			return [];
		}

		// Find products based on the sort order
		let products: Array<Product> = [];
		switch (sort) {
			case ProductSort.BestMatch:
				products = await this.__getBestMatchProductsInCampaign(campaign, pageNumber, itemsPerPage)
				break;
			case ProductSort.BestSellers:
				products = await this.__getBestSellersProductsInCampaign(campaign, pageNumber, itemsPerPage);
				break;
			case ProductSort.MostFavorited:
				products = await this.__getMostFavoritedProductsInCampaign(campaign, pageNumber, itemsPerPage);
				break;
			case ProductSort.NewArrivals:
				products = await this.__getNewArrivalsProductsInCampaign(campaign, pageNumber, itemsPerPage);
				break;
			case ProductSort.MostRated:
				products = await this.__getMostRatedProductsInCampaign(campaign, pageNumber, itemsPerPage);
				break;
			case ProductSort.PriceHighToLow:
				products = await this.__getPriceHighToLowProductsInCampaign(campaign, pageNumber, itemsPerPage);
				break;
			case ProductSort.PriceLowToHigh:
				products = await this.__getPriceLowToHighProductsInCampaign(campaign, pageNumber, itemsPerPage);
				break;
			default: // do nothing
				break;
		}

		// Attach the campaign against each product
		return this.__attachCampaignAndPrices(products, campaign, currency, sort);
	}

	/**
	 * Returns the products in the campaign
	 *
	 * @param slug
	 * @param currency
	 * @param sort
	 * @param pageNumber
	 * @param itemsPerPage
	 * @returns
	 */
	async getProductsInCampaign(slug: string, currency: CurrencyCode, sort: ProductSort, pageNumber: number = 1, itemsPerPage: number = 100): Promise<Array<Product>> {
		this.logger.log(`Retrieving a list of products by campaign: ${slug}`);

		// Find the campaign by slug
		const campaign = await this.campaignRepository.findOne({
			cache: true,
			relationLoadStrategy: "query",
			where: { slug: slug, },
			relations: {
				campaignCategories: {
					category: true,
				},
			},
		});

		// Make sure the campaign exists and isn't expired
		if (campaign === null || campaign.finishesAt === null || new Date().getTime() >= new Date(campaign.finishesAt).getTime()) {
			return [];
		}

		// Find products based on the sort order
		let products: Array<Product> = [];
		switch (sort) {
			case ProductSort.BestMatch:
				products = await this.__getBestMatchProductsInCampaign(campaign, pageNumber, itemsPerPage)
				break;
			case ProductSort.BestSellers:
				products = await this.__getBestSellersProductsInCampaign(campaign, pageNumber, itemsPerPage);
				break;
			case ProductSort.MostFavorited:
				products = await this.__getMostFavoritedProductsInCampaign(campaign, pageNumber, itemsPerPage);
				break;
			case ProductSort.NewArrivals:
				products = await this.__getNewArrivalsProductsInCampaign(campaign, pageNumber, itemsPerPage);
				break;
			case ProductSort.MostRated:
				products = await this.__getMostRatedProductsInCampaign(campaign, pageNumber, itemsPerPage);
				break;
			case ProductSort.PriceHighToLow:
				products = await this.__getPriceHighToLowProductsInCampaign(campaign, pageNumber, itemsPerPage);
				break;
			case ProductSort.PriceLowToHigh:
				products = await this.__getPriceLowToHighProductsInCampaign(campaign, pageNumber, itemsPerPage);
				break;
			default: // do nothing
				break;
		}

		// Attach the campaign against each product
		return this.__attachCampaignAndPrices(products, campaign, currency, sort);
	}

	/**
	 * Get the best matched products in campaign
	 *
	 * @param campaign
	 * @param pageNumber
	 * @param itemsPerPage
	 * @returns
	 */
	async __getBestMatchProductsInCampaign(campaign: Campaign, pageNumber: number = 1, itemsPerPage: number = 24): Promise<Array<Product>> {
		this.logger.log(`Retrieving a list of products in campaign: ${campaign.name}, sort: ${ProductSort.BestMatch}`);

		if (campaign === null || !Array.isArray(campaign.campaignCategories) || campaign.campaignCategories.length === 0) {
			return [];
		}

		// Map the categories
		const categoryIds: Array<Category['id']> = campaign.campaignCategories.map(entry => entry.category.id).sort((idA, idB) => idA - idB);
		if (!Array.isArray(categoryIds) || categoryIds.length === 0) {
			return [];
		}

		// Get pagination params
		const { skip, take } = getSkipAndTake(pageNumber, itemsPerPage);

		// Find the products in the desired category
		const products = await this.productRepository.createQueryBuilder("product")
			.cache(true)
			.setFindOptions({
				relationLoadStrategy: "query",
			})

			// Load all categories
			.leftJoinAndSelect("product.productCategories", "productCategory")
			.leftJoinAndSelect("productCategory.category", "category")

			// Filter by category
			.innerJoin("product.productCategories", "filterProductCategories")
			.innerJoin("filterProductCategories.category", "filterCategory")

			.where("filterCategory.id IN (:...categoryIds)", {
				categoryIds: categoryIds,
			})
			.andWhere("product.status = :status", { status: ProductStatus.ACTIVE, })
			.distinct(true)
			.orderBy("product.id", "DESC")
			.skip(skip)
			.take(take)
			.getMany();

		return this.__populateWithCheapestVariant(products);
	}

	/**
	 * Get the products with most sales in a campaign
	 *
	 * @param campaign
	 * @param pageNumber
	 * @param itemsPerPage
	 * @returns
	 */
	async __getBestSellersProductsInCampaign(campaign: Campaign, pageNumber: number = 1, itemsPerPage: number = 24): Promise<Array<Product>> {
		this.logger.log(`Retrieving a list of products in campaign: ${campaign.name}, sort: ${ProductSort.BestSellers}`);

		if (campaign === null || !Array.isArray(campaign.campaignCategories) || campaign.campaignCategories.length === 0) {
			return [];
		}

		// Map the categories
		const categoryIds: Array<Category['id']> = campaign.campaignCategories.map(entry => entry.category.id).sort((idA, idB) => idA - idB);
		if (!Array.isArray(categoryIds) || categoryIds.length === 0) {
			return [];
		}

		// Get pagination params
		const { skip, take } = getSkipAndTake(pageNumber, itemsPerPage);

		// Find the products in the desired category
		const products = await this.productRepository.createQueryBuilder("product")
			.cache(true)
			.setFindOptions({
				relationLoadStrategy: "query",
			})

			// Load all categories
			.leftJoinAndSelect("product.productCategories", "productCategory")
			.leftJoinAndSelect("productCategory.category", "category")

			// Filter by category
			.innerJoin("product.productCategories", "filterProductCategories")
			.innerJoin("filterProductCategories.category", "filterCategory")

			.where("filterCategory.id IN (:...categoryIds)", {
				categoryIds: categoryIds,
			})
			.andWhere("product.status = :status", { status: ProductStatus.ACTIVE, })
			.distinct(true)
			.orderBy("product.salesCount", "DESC")
			.skip(skip)
			.take(take)
			.getMany();

		return this.__populateWithCheapestVariant(products);
	}

	/**
	 * Get the products with most likes count in a campaign
	 *
	 * @param campaign
	 * @param pageNumber
	 * @param itemsPerPage
	 * @returns
	 */
	async __getMostFavoritedProductsInCampaign(campaign: Campaign, pageNumber: number = 1, itemsPerPage: number = 24): Promise<Array<Product>> {
		this.logger.log(`Retrieving a list of products in campaign: ${campaign.name}, sort: ${ProductSort.MostFavorited}`);

		if (campaign === null || !Array.isArray(campaign.campaignCategories) || campaign.campaignCategories.length === 0) {
			return [];
		}

		// Map the categories
		const categoryIds: Array<Category['id']> = campaign.campaignCategories.map(entry => entry.category.id).sort((idA, idB) => idA - idB);
		if (!Array.isArray(categoryIds) || categoryIds.length === 0) {
			return [];
		}

		// Get pagination params
		const { skip, take } = getSkipAndTake(pageNumber, itemsPerPage);

		// Find the products in the desired category
		const products = await this.productRepository.createQueryBuilder("product")
			.cache(true)
			.setFindOptions({
				relationLoadStrategy: "query",
			})

			// Load all categories
			.leftJoinAndSelect("product.productCategories", "productCategory")
			.leftJoinAndSelect("productCategory.category", "category")

			// Filter by category
			.innerJoin("product.productCategories", "filterProductCategories")
			.innerJoin("filterProductCategories.category", "filterCategory")

			.where("filterCategory.id IN (:...categoryIds)", {
				categoryIds: categoryIds,
			})
			.andWhere("product.status = :status", { status: ProductStatus.ACTIVE, })
			.distinct(true)
			.orderBy("product.likesCount", "DESC")
			.skip(skip)
			.take(take)
			.getMany();

		return this.__populateWithCheapestVariant(products);
	}

	/**
	 * Get the newly arrived products in a campaign
	 *
	 * @param campaign
	 * @param pageNumber
	 * @param itemsPerPage
	 * @returns
	 */
	async __getNewArrivalsProductsInCampaign(campaign: Campaign, pageNumber: number = 1, itemsPerPage: number = 24): Promise<Array<Product>> {
		this.logger.log(`Retrieving a list of products in campaign: ${campaign.name}, sort: ${ProductSort.NewArrivals}`);

		if (campaign === null || !Array.isArray(campaign.campaignCategories) || campaign.campaignCategories.length === 0) {
			return [];
		}

		// Map the categories
		const categoryIds: Array<Category['id']> = campaign.campaignCategories.map(entry => entry.category.id).sort((idA, idB) => idA - idB);
		if (!Array.isArray(categoryIds) || categoryIds.length === 0) {
			return [];
		}

		// Get pagination params
		const { skip, take } = getSkipAndTake(pageNumber, itemsPerPage);

		// Find the products in the desired category
		const products = await this.productRepository.createQueryBuilder("product")
			.cache(true)
			.setFindOptions({
				relationLoadStrategy: "query",
			})

			// Load all categories
			.leftJoinAndSelect("product.productCategories", "productCategory")
			.leftJoinAndSelect("productCategory.category", "category")

			// Filter by category
			.innerJoin("product.productCategories", "filterProductCategories")
			.innerJoin("filterProductCategories.category", "filterCategory")

			.where("filterCategory.id IN (:...categoryIds)", {
				categoryIds: categoryIds,
			})
			.andWhere("product.status = :status", { status: ProductStatus.ACTIVE, })
			.distinct(true)
			.orderBy("product.id", "DESC")
			.skip(skip)
			.take(take)
			.getMany();

		return this.__populateWithCheapestVariant(products);
	}

	/**
	 * Get the most rated products in the category
	 *
	 * @param campaign
	 * @param pageNumber
	 * @param itemsPerPage
	 * @returns
	 */
	async __getMostRatedProductsInCampaign(campaign: Campaign, pageNumber: number = 1, itemsPerPage: number = 24): Promise<Array<Product>> {
		this.logger.log(`Retrieving a list of products in campaign: ${campaign.name}, sort: ${ProductSort.MostRated}`);

		if (campaign === null || !Array.isArray(campaign.campaignCategories) || campaign.campaignCategories.length === 0) {
			return [];
		}

		// Map the categories
		const categoryIds: Array<Category['id']> = campaign.campaignCategories.map(entry => entry.category.id).sort((idA, idB) => idA - idB);
		if (!Array.isArray(categoryIds) || categoryIds.length === 0) {
			return [];
		}

		// Get pagination params
		const { skip, take } = getSkipAndTake(pageNumber, itemsPerPage);

		// Find the products in the desired category
		const products = await this.productRepository.createQueryBuilder("product")
			.cache(true)
			.setFindOptions({
				relationLoadStrategy: "query",
			})

			// Load all categories
			.leftJoinAndSelect("product.productCategories", "productCategory")
			.leftJoinAndSelect("productCategory.category", "category")

			// Filter by category
			.innerJoin("product.productCategories", "filterProductCategories")
			.innerJoin("filterProductCategories.category", "filterCategory")

			.where("filterCategory.id IN (:...categoryIds)", {
				categoryIds: categoryIds,
			})
			.andWhere("product.status = :status", { status: ProductStatus.ACTIVE, })
			.distinct(true)
			.orderBy("product.ratingAvg", "DESC")
			.skip(skip)
			.take(take)
			.getMany();

		return this.__populateWithCheapestVariant(products);
	}

	/**
	 * Get the most expensive products in the category
	 *
	 * @param campaign
	 * @param pageNumber
	 * @param itemsPerPage
	 * @returns
	 */
	async __getPriceHighToLowProductsInCampaign(campaign: Campaign, pageNumber: number = 1, itemsPerPage: number = 24): Promise<Array<Product>> {
		this.logger.log(`Retrieving a list of products in campaign: ${campaign.name}, sort: ${ProductSort.PriceHighToLow}`);

		if (campaign === null || !Array.isArray(campaign.campaignCategories) || campaign.campaignCategories.length === 0) {
			return [];
		}

		// Map the categories
		const categoryIds: Array<Category['id']> = campaign.campaignCategories.map(entry => entry.category.id).sort((idA, idB) => idA - idB);
		if (!Array.isArray(categoryIds) || categoryIds.length === 0) {
			return [];
		}

		// Get pagination params
		const { skip, take } = getSkipAndTake(pageNumber, itemsPerPage);

		// Find the products in the desired category
		const products = await this.productRepository.createQueryBuilder("product")
			.cache(true)
			.setFindOptions({
				relationLoadStrategy: "query",
			})

			// Load all categories
			.leftJoinAndSelect("product.productCategories", "productCategory")
			.leftJoinAndSelect("productCategory.category", "category")

			// Filter by category
			.innerJoin("product.productCategories", "filterProductCategories")
			.innerJoin("filterProductCategories.category", "filterCategory")

			.where("filterCategory.id IN (:...categoryIds)", {
				categoryIds: categoryIds,
			})
			.andWhere("product.status = :status", { status: ProductStatus.ACTIVE, })
			.distinct(true)
			.orderBy("product.id", "DESC")
			.skip(skip)
			.take(take)
			.getMany();

		return this.__populateWithPriciestVariant(products);
	}

	/**
	 * Get the least expensive products in the category
	 *
	 * @param campaign
	 * @param pageNumber
	 * @param itemsPerPage
	 * @returns
	 */
	async __getPriceLowToHighProductsInCampaign(campaign: Campaign, pageNumber: number = 1, itemsPerPage: number = 24): Promise<Array<Product>> {
		this.logger.log(`Retrieving a list of products in campaign: ${campaign.name}, sort: ${ProductSort.PriceLowToHigh}`);

		if (campaign === null || !Array.isArray(campaign.campaignCategories) || campaign.campaignCategories.length === 0) {
			return [];
		}

		// Map the categories
		const categoryIds: Array<Category['id']> = campaign.campaignCategories.map(entry => entry.category.id).sort((idA, idB) => idA - idB);
		if (!Array.isArray(categoryIds) || categoryIds.length === 0) {
			return [];
		}

		// Get pagination params
		const { skip, take } = getSkipAndTake(pageNumber, itemsPerPage);

		// Find the products in the desired category
		const products = await this.productRepository.createQueryBuilder("product")
			.cache(true)
			.setFindOptions({
				relationLoadStrategy: "query",
			})

			// Load all categories
			.leftJoinAndSelect("product.productCategories", "productCategory")
			.leftJoinAndSelect("productCategory.category", "category")

			// Filter by category
			.innerJoin("product.productCategories", "filterProductCategories")
			.innerJoin("filterProductCategories.category", "filterCategory")

			.where("filterCategory.id IN (:...categoryIds)", {
				categoryIds: categoryIds,
			})
			.andWhere("product.status = :status", { status: ProductStatus.ACTIVE, })
			.distinct(true)
			.orderBy("product.id", "DESC")
			.skip(skip)
			.take(take)
			.getMany();

		return this.__populateWithCheapestVariant(products);
	}

	/**
	 * Searches a product for a language
	 *
	 * @param query
	 * @param language
	 * @param sort
	 * @param pageNumber
	 * @param itemsPerPage
	 * @returns
	 */
	async searchProductsUncached(query: string, language: string, sort: ProductSort = ProductSort.BestMatch, pageNumber: number = 1, itemsPerPage: number = 100): Promise<Array<Product>> {
		this.logger.log(`Searching for products uncached, query: ${query}, language: ${language}`);

		// Clean the search query
		const searchQuery = query.trim().split(/\s+/).map(w => `${w}:*`).join(' & ');

		// Normalize the short code
		if (language !== undefined && language !== null) {
			language = language.toLowerCase().trim();
		} else {
			language = "en";
		}

		// Get pagination params
		const { skip, take } = getSkipAndTake(pageNumber, itemsPerPage);

		let products: Array<Product> = [];

		switch (sort) {
			case ProductSort.BestMatch:
				return this.productRepository.createQueryBuilder("product")
					.setFindOptions({
						relationLoadStrategy: "query",
					})

					// Only join products that actually have categories
					.innerJoinAndSelect("product.productCategories", "productCategory")
					.innerJoinAndSelect("productCategory.category", "category")

					// Search Filter
					.where(`${this.TSV_TITLE_COLUMNS_MAP[language]} @@ to_tsquery(:configLanguage, :searchQuery)`, {
						configLanguage: this.CONFIG_LANGUAGE_MAP[language],
						searchQuery: searchQuery,
					})

					.distinct(true)
					.orderBy("product.id", "DESC")
					.skip(skip)
					.take(take)
					.getMany();

			case ProductSort.PriceLowToHigh:
				// Subquery to sort variants of a product by minimum price
				const leastExpensiveVariantQuery = this.productRepository
					.manager.createQueryBuilder(ProductVariant, 'v')
					.select('MIN(v.cost_amount)', 'minCostAmount')
					.where('v.product_id = product.id')
					.getQuery();

				return this.productRepository.createQueryBuilder('product')
					.setFindOptions({
						relationLoadStrategy: "query",
					})

					// Populate product categories
					.leftJoinAndSelect('product.productCategories', 'productCategories')
					.leftJoinAndSelect('productCategories.category', 'category')

					// Search Filter
					.where(`${this.TSV_TITLE_COLUMNS_MAP[language]} @@ to_tsquery(:configLanguage, :searchQuery)`, {
						configLanguage: this.CONFIG_LANGUAGE_MAP[language],
						searchQuery: searchQuery,
					})

					// Add the subquery result as a virtual column for sorting
					.addSelect(`(${leastExpensiveVariantQuery})`, 'least_expensive_variant_price')

					// Order by the virtual column and handle pagination
					.orderBy('least_expensive_variant_price', 'ASC')
					.take(take)
					.skip(skip)
					.getMany();

			case ProductSort.PriceHighToLow:
				const mostExpensiveVariantQuery = this.productRepository
					.manager.createQueryBuilder(ProductVariant, 'v')
					.select('MAX(v.cost_amount)', 'maxCostAmount')
					.where('v.product_id = product.id')
					.getQuery();

				return this.productRepository.createQueryBuilder('product')
					.setFindOptions({
						relationLoadStrategy: "query",
					})

					// Populate product categories
					.leftJoinAndSelect('product.productCategories', 'productCategories')
					.leftJoinAndSelect('productCategories.category', 'category')

					// Search Filter
					.where(`${this.TSV_TITLE_COLUMNS_MAP[language]} @@ to_tsquery(:configLanguage, :searchQuery)`, {
						configLanguage: this.CONFIG_LANGUAGE_MAP[language],
						searchQuery: searchQuery,
					})

					// Add the subquery result as a virtual column for sorting
					.addSelect(`(${mostExpensiveVariantQuery})`, 'most_expensive_variant_price')

					// Order by the virtual column and handle pagination
					.orderBy('most_expensive_variant_price', 'DESC')
					.take(take)
					.skip(skip)
					.getMany();

			default: // do nothing
				break;
		}

		return [];
	}

	/**
	 * Searches a product for a language
	 *
	 * @param query
	 * @param language
	 * @param currency
	 * @param sort
	 * @param pageNumber
	 * @param itemsPerPage
	 * @returns
	 */
	async searchProducts(query: string, language: string, currency: CurrencyCode, sort: ProductSort = ProductSort.BestMatch, pageNumber: number = 1, itemsPerPage: number = 100): Promise<Array<Product>> {
		this.logger.log(`Searching for products, query: ${query}, language: ${language}`);

		// Clean the search query
		const searchQuery = query.trim().split(/\s+/).map(w => `${w}:*`.toLowerCase()).join(' & ');

		// Normalize the short code
		if (language !== undefined && language !== null) {
			language = language.toLowerCase().trim();
		} else {
			language = "en";
		}

		// Search the products based on the sort order
		let products: Array<Product> = [];
		switch (sort) {
			case ProductSort.BestMatch:
				products = await this.__searchProductsBestMatch(searchQuery, language, pageNumber, itemsPerPage);
				break;
			case ProductSort.PriceLowToHigh:
				products = await this.__searchProductsPriceLowToHigh(searchQuery, language, pageNumber, itemsPerPage);
				break;
			case ProductSort.PriceHighToLow:
				products = await this.__searchProductsPriceHighToLow(searchQuery, language, pageNumber, itemsPerPage);
				break;
			case ProductSort.BestSellers:
				products = await this.__searchProductsBestSellers(searchQuery, language, pageNumber, itemsPerPage);
				break;
			case ProductSort.MostFavorited:
				products = await this.__searchProductsMostFavorited(searchQuery, language, pageNumber, itemsPerPage);
				break;
			case ProductSort.NewArrivals:
				products = await this.__searchProductsNewArrivals(searchQuery, language, pageNumber, itemsPerPage);
				break;
			case ProductSort.MostRated:
				products = await this.__searchProductsMostRated(searchQuery, language, pageNumber, itemsPerPage);
				break;
			default: // do nothing
				break;
		}

		// Attach the campaign against each product
		return this.__findCampaignsAndPrices(products, currency, sort);
	}

	/**
	 * Searches products by best-match sort order
	 *
	 * @param searchQuery
	 * @param language
	 * @param pageNumber
	 * @param itemsPerPage
	 * @returns
	 */
	async __searchProductsBestMatch(searchQuery: string, language: string, pageNumber: number = 1, itemsPerPage: number = 24): Promise<Array<Product>> {
		this.logger.log(`Searching the best matched products, pageNumber: ${pageNumber}, itemsPerPage: ${itemsPerPage}`);

		// Get pagination params
		const { skip, take } = getSkipAndTake(pageNumber, itemsPerPage);

		// Search the products and cache the results
		const products = await this.productRepository.createQueryBuilder("product")
			.cache(true)
			.setFindOptions({
				relationLoadStrategy: "query",
			})

			// Only join products that actually have categories
			.innerJoinAndSelect("product.productCategories", "productCategory")
			.innerJoinAndSelect("productCategory.category", "category")

			// Search Filter
			.where(`${this.TSV_TITLE_COLUMNS_MAP[language]} @@ to_tsquery(:configLanguage, :searchQuery)`, {
				configLanguage: this.CONFIG_LANGUAGE_MAP[language],
				searchQuery: searchQuery,
			})

			// Filter active products
			.andWhere("product.status = :status", { status: ProductStatus.ACTIVE, })

			.distinct(true)
			.orderBy("product.id", "DESC")
			.skip(skip)
			.take(take)
			.getMany();

		return this.__populateWithCheapestVariant(products);
	}

	/**
	 * Searches products by price:low-to-high sort order
	 *
	 * @param searchQuery
	 * @param language
	 * @param pageNumber
	 * @param itemsPerPage
	 * @returns
	 */
	async __searchProductsPriceLowToHigh(searchQuery: string, language: string, pageNumber: number = 1, itemsPerPage: number = 24): Promise<Array<Product>> {
		this.logger.log(`Searching the products, with price low-to-high, pageNumber: ${pageNumber}, itemsPerPage: ${itemsPerPage}`);

		// Get pagination params
		const { skip, take } = getSkipAndTake(pageNumber, itemsPerPage);

		// Subquery to sort variants of a product by minimum price
		const leastExpensiveVariantQuery = this.productRepository.manager.createQueryBuilder(ProductVariant, 'v')
			.select('MIN(v.cost_amount)', 'minCostAmount')
			.where('v.product_id = product.id')
			.getQuery();

		// Search the products and cache the results
		const products = await this.productRepository.createQueryBuilder('product')
			.cache(true)
			.setFindOptions({
				relationLoadStrategy: "query",
			})

			// Populate product categories
			.leftJoinAndSelect('product.productCategories', 'productCategories')
			.leftJoinAndSelect('productCategories.category', 'category')

			// Search Filter
			.where(`${this.TSV_TITLE_COLUMNS_MAP[language]} @@ to_tsquery(:configLanguage, :searchQuery)`, {
				configLanguage: this.CONFIG_LANGUAGE_MAP[language],
				searchQuery: searchQuery,
			})

			// Filter active products
			.andWhere("product.status = :status", { status: ProductStatus.ACTIVE, })

			// Add the subquery result as a virtual column for sorting
			.addSelect(`(${leastExpensiveVariantQuery})`, 'least_expensive_variant_price')

			// Order by the virtual column and handle pagination
			.orderBy('least_expensive_variant_price', 'ASC')
			.take(take)
			.skip(skip)
			.getMany();

		return this.__populateWithCheapestVariant(products);
	}

	/**
	 * Searches products by price:high-to-low sort order
	 *
	 * @param searchQuery
	 * @param language
	 * @param pageNumber
	 * @param itemsPerPage
	 * @returns
	 */
	async __searchProductsPriceHighToLow(searchQuery: string, language: string, pageNumber: number = 1, itemsPerPage: number = 24): Promise<Array<Product>> {
		this.logger.log(`Searching the products, with price high-to-low, pageNumber: ${pageNumber}, itemsPerPage: ${itemsPerPage}`);

		// FIXME: For some reason, we don't get any variants for the first page of any query, so we need to increment it to 2nd page
		pageNumber = Math.max(2, pageNumber + 1);

		// Get pagination params
		const { skip, take } = getSkipAndTake(pageNumber, itemsPerPage);

		// Subquery to sort variants of a product by maximum price
		const mostExpensiveVariantQuery = this.productRepository.manager.createQueryBuilder(ProductVariant, 'v')
			.select('MAX(v.cost_amount)', 'maxCostAmount')
			.where('v.product_id = product.id')
			.getQuery();

		// Search the products and cache the results
		const products = await this.productRepository.createQueryBuilder('product')
			.cache(true)
			.setFindOptions({
				relationLoadStrategy: "query",
			})

			// Populate product categories
			.leftJoinAndSelect('product.productCategories', 'productCategories')
			.leftJoinAndSelect('productCategories.category', 'category')

			// Search Filter
			.where(`${this.TSV_TITLE_COLUMNS_MAP[language]} @@ to_tsquery(:configLanguage, :searchQuery)`, {
				configLanguage: this.CONFIG_LANGUAGE_MAP[language],
				searchQuery: searchQuery,
			})

			// Filter active products
			.andWhere("product.status = :status", { status: ProductStatus.ACTIVE, })

			// Add the subquery result as a virtual column for sorting
			.addSelect(`(${mostExpensiveVariantQuery})`, 'most_expensive_variant_price')

			// Order by the virtual column and handle pagination
			.orderBy('most_expensive_variant_price', 'DESC')
			.take(take)
			.skip(skip)
			.getMany();

		return this.__populateWithPriciestVariant(products);
	}

	/**
	 * Searches products by best sellers sort order
	 *
	 * @param searchQuery
	 * @param language
	 * @param pageNumber
	 * @param itemsPerPage
	 * @returns
	 */
	async __searchProductsBestSellers(searchQuery: string, language: string, pageNumber: number = 1, itemsPerPage: number = 24): Promise<Array<Product>> {
		this.logger.log(`Searching the best seller products, pageNumber: ${pageNumber}, itemsPerPage: ${itemsPerPage}`);

		// Get pagination params
		const { skip, take } = getSkipAndTake(pageNumber, itemsPerPage);

		// Search the products and cache the results
		const products = await this.productRepository.createQueryBuilder("product")
			.cache(true)
			.setFindOptions({
				relationLoadStrategy: "query",
			})

			// Only join products that actually have categories
			.innerJoinAndSelect("product.productCategories", "productCategory")
			.innerJoinAndSelect("productCategory.category", "category")

			// Search Filter
			.where(`${this.TSV_TITLE_COLUMNS_MAP[language]} @@ to_tsquery(:configLanguage, :searchQuery)`, {
				configLanguage: this.CONFIG_LANGUAGE_MAP[language],
				searchQuery: searchQuery,
			})

			// Filter active products
			.andWhere("product.status = :status", { status: ProductStatus.ACTIVE, })

			.distinct(true)
			.orderBy("product.salesCount", "DESC")
			.skip(skip)
			.take(take)
			.getMany();

		return this.__populateWithCheapestVariant(products);
	}

	/**
	 * Searches products by most favorited sort order
	 *
	 * @param searchQuery
	 * @param language
	 * @param pageNumber
	 * @param itemsPerPage
	 * @returns
	 */
	async __searchProductsMostFavorited(searchQuery: string, language: string, pageNumber: number = 1, itemsPerPage: number = 24): Promise<Array<Product>> {
		this.logger.log(`Searching the most favorited products, pageNumber: ${pageNumber}, itemsPerPage: ${itemsPerPage}`);

		// Get pagination params
		const { skip, take } = getSkipAndTake(pageNumber, itemsPerPage);

		// Search the products and cache the results
		const products = await this.productRepository.createQueryBuilder("product")
			.cache(true)
			.setFindOptions({
				relationLoadStrategy: "query",
			})

			// Only join products that actually have categories
			.innerJoinAndSelect("product.productCategories", "productCategory")
			.innerJoinAndSelect("productCategory.category", "category")

			// Search Filter
			.where(`${this.TSV_TITLE_COLUMNS_MAP[language]} @@ to_tsquery(:configLanguage, :searchQuery)`, {
				configLanguage: this.CONFIG_LANGUAGE_MAP[language],
				searchQuery: searchQuery,
			})

			// Filter active products
			.andWhere("product.status = :status", { status: ProductStatus.ACTIVE, })

			.distinct(true)
			.orderBy("product.likesCount", "DESC")
			.skip(skip)
			.take(take)
			.getMany();

		return this.__populateWithCheapestVariant(products);
	}

	/**
	 * Searches products by new arrivals sort order
	 *
	 * @param searchQuery
	 * @param language
	 * @param pageNumber
	 * @param itemsPerPage
	 * @returns
	 */
	async __searchProductsNewArrivals(searchQuery: string, language: string, pageNumber: number = 1, itemsPerPage: number = 24): Promise<Array<Product>> {
		this.logger.log(`Searching the newly arrived products, pageNumber: ${pageNumber}, itemsPerPage: ${itemsPerPage}`);

		// Get pagination params
		const { skip, take } = getSkipAndTake(pageNumber, itemsPerPage);

		// Search the products and cache the results
		const products = await this.productRepository.createQueryBuilder("product")
			.cache(true)
			.setFindOptions({
				relationLoadStrategy: "query",
			})

			// Only join products that actually have categories
			.innerJoinAndSelect("product.productCategories", "productCategory")
			.innerJoinAndSelect("productCategory.category", "category")

			// Search Filter
			.where(`${this.TSV_TITLE_COLUMNS_MAP[language]} @@ to_tsquery(:configLanguage, :searchQuery)`, {
				configLanguage: this.CONFIG_LANGUAGE_MAP[language],
				searchQuery: searchQuery,
			})

			// Filter active products
			.andWhere("product.status = :status", { status: ProductStatus.ACTIVE, })

			.distinct(true)
			.orderBy("product.id", "DESC")
			.skip(skip)
			.take(take)
			.getMany();

		return this.__populateWithCheapestVariant(products);
	}

	/**
	 * Searches products by most rated sort order
	 *
	 * @param searchQuery
	 * @param language
	 * @param pageNumber
	 * @param itemsPerPage
	 * @returns
	 */
	async __searchProductsMostRated(searchQuery: string, language: string, pageNumber: number = 1, itemsPerPage: number = 24): Promise<Array<Product>> {
		this.logger.log(`Searching the most rated products, pageNumber: ${pageNumber}, itemsPerPage: ${itemsPerPage}`);

		// Get pagination params
		const { skip, take } = getSkipAndTake(pageNumber, itemsPerPage);

		// Search the products and cache the results
		const products = await this.productRepository.createQueryBuilder("product")
			.cache(true)
			.setFindOptions({
				relationLoadStrategy: "query",
			})

			// Only join products that actually have categories
			.innerJoinAndSelect("product.productCategories", "productCategory")
			.innerJoinAndSelect("productCategory.category", "category")

			// Search Filter
			.where(`${this.TSV_TITLE_COLUMNS_MAP[language]} @@ to_tsquery(:configLanguage, :searchQuery)`, {
				configLanguage: this.CONFIG_LANGUAGE_MAP[language],
				searchQuery: searchQuery,
			})

			// Filter active products
			.andWhere("product.status = :status", { status: ProductStatus.ACTIVE, })

			.distinct(true)
			.orderBy("product.ratingAvg", "DESC")
			.skip(skip)
			.take(take)
			.getMany();

		return this.__populateWithCheapestVariant(products);
	}

	/**
	 * Returns a list of recommended products
	 *
	 * @param customer
	 * @param slug
	 * @param currency
	 * @param pageNumber
	 * @param itemsPerPage
	 * @returns
	 */
	async getRecommendedProducts(customer: Customer, slug: string, currency: CurrencyCode, pageNumber: number = 1, itemsPerPage: number = 100): Promise<Array<Product>> {
		this.logger.log(`Retrieving a list of recommended products for product: ${slug}`);

		// Find some product views of the customer
		const productViews = await this.productViewRepository.find({
			cache: true,
			relationLoadStrategy: 'query',
			where: {
				customer: {
					id: customer.id,
				},
			},
			relations: {
				product: {
					productCategories: {
						category: true,
					},
				},
			},
			skip: 3,
			take: 3,
			order: {
				viewsCount: 'DESC',
			},
		});

		// Make sure we have enough products to recommend.
		if (!Array.isArray(productViews) || productViews.length === 0) {
			return [];
		}

		// Find a random view and use it to fetch recommended products.
		const randomView = productViews[Math.floor(Math.random() * productViews.length)];
		if (randomView === undefined || randomView === null || randomView.product === undefined || randomView.product === null) {
			return [];
		}

		// Make sure we have enough categories to fetch recommended products from
		if (!Array.isArray(randomView.product.productCategories) || randomView.product.productCategories.length === 0) {
			return [];
		}

		// Get pagination params
		const { skip, take } = getSkipAndTake(pageNumber, itemsPerPage);

		let products: Array<Product> = [];

		// Find the products in the same category
		if (randomView.product.productCategories[0].category !== undefined && randomView.product.productCategories[0].category !== null) {
			products = await this.productRepository.createQueryBuilder("product")
				.cache(true)
				.setFindOptions({
					relationLoadStrategy: "query",
				})

				// Load all categories
				.leftJoinAndSelect("product.productCategories", "productCategory")
				.leftJoinAndSelect("productCategory.category", "category")

				// Filter by category
				.innerJoin("product.productCategories", "filterProductCategories")
				.innerJoin("filterProductCategories.category", "filterCategory")

				.where("filterCategory.id = :id", {
					id: randomView.product.productCategories[0].category.id,
				})
				.andWhere('product.id != :productId', {
					productId: randomView.product.id,
				})
				.andWhere("product.status = :status", {
					status: ProductStatus.ACTIVE,
				})
				.distinct(true)
				.skip(skip)
				.take(take)
				.getMany();
		} else {
			// As a fallback find some products
			products = await this.productRepository.find({
				cache: true,
				relationLoadStrategy: "query",
				where: {
					status: ProductStatus.ACTIVE,
				},
				relations: {
					productCategories: {
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

		// Populate with the cheapest variant
		products = await this.__populateWithCheapestVariant(products);
		if (!Array.isArray(products) || products.length === 0) {
			return [];
		}

		return this.__findCampaignsAndPrices(products, currency, ProductSort.BestMatch);
	}

	/**
	 * Returns products by featured category
	 *
	 * @param currency
	 * @param sort
	 * @param pageNumber
	 * @param itemsPerPage
	 * @returns
	 */
	async getFeaturedProducts(currency: CurrencyCode, sort: ProductSort, pageNumber: number = 1, itemsPerPage: number = 100): Promise<Array<Product>> {
		this.logger.log(`Retrieving a list of featured products`);

		// Get the featured category
		const category = await this.categoryRepository.findOne({
			cache: true,
			where: {
				isFeaturedOnHomepage: true,
			},
		});

		// Get other products as fallback
		if (category === null) {
			return this.findAll("", currency, ProductSort.BestMatch, pageNumber, itemsPerPage);
		}

		// Find products based on the sort order
		let products: Array<Product> = [];
		switch (sort) {
			case ProductSort.BestMatch:
				products = await this.__getBestMatchProductsInCategory(category, pageNumber, itemsPerPage);
				break;
			case ProductSort.BestSellers:
				products = await this.__getBestSellerProductsInCategory(category, pageNumber, itemsPerPage);
				break;
			case ProductSort.MostFavorited:
				products = await this.__getMostFavoritedProductsInCategory(category, pageNumber, itemsPerPage);
				break;
			case ProductSort.NewArrivals:
				products = await this.__getNewArrivalsProductsInCategory(category, pageNumber, itemsPerPage);
				break;
			case ProductSort.MostRated:
				products = await this.__getMostRatedProductsInCategory(category, pageNumber, itemsPerPage);
				break;
			case ProductSort.PriceHighToLow:
				products = await this.__getPriceHighToLowProductsInCategory(category, pageNumber, itemsPerPage);
				break;
			case ProductSort.PriceLowToHigh:
				products = await this.__getPriceLowToHighProductsInCategory(category, pageNumber, itemsPerPage);
				break;
			default: // do nothing
				break;
		}

		// Attach the campaign against each product
		return this.__findCampaignsAndPrices(products, currency, sort);
	}

	/**
	 * Returns popular products
	 *
	 * @param currency
	 * @param sort
	 * @param pageNumber
	 * @param itemsPerPage
	 * @returns
	 */
	async getPopularProducts(currency: CurrencyCode, sort: ProductSort, pageNumber: number = 1, itemsPerPage: number = 100): Promise<Array<Product>> {
		this.logger.log(`Retrieving popular products`);

		// Find products based on the sort order
		let products: Array<Product> = [];
		switch (sort) {
			case ProductSort.MostViewed:
				products = await this.__getMostViewedProducts(pageNumber, itemsPerPage);
				break;
			case ProductSort.BestSellers:
				products = await this.__getBestSellersProducts(pageNumber, itemsPerPage);
				break;
			case ProductSort.MostFavorited:
				products = await this.__getMostFavoritedProducts(pageNumber, itemsPerPage);
				break;
			case ProductSort.MostRated:
				products = await this.__getMostRatedProducts(pageNumber, itemsPerPage);
				break;
			default: // do nothing
				break;
		}

		// Attach the campaign against each product
		return this.__findCampaignsAndPrices(products, currency, sort);
	}

	/**
	 * Returns the related products of a product
	 *
	 * @param slug
	 * @param currency
	 * @param pageNumber
	 * @param itemsPerPage
	 * @returns
	 */
	async getRelatedProducts(slug: string, currency: CurrencyCode, pageNumber: number = 1, itemsPerPage: number = 100): Promise<Array<Product>> {
		this.logger.log(`Retrieving related products, product: ${slug}`);

		// Find the source product
		const product = await this.productRepository.findOne({
			cache: true,
			relationLoadStrategy: "query",
			where: {
				slug: slug.toLowerCase().trim(),
				status: ProductStatus.ACTIVE,
			},
			relations: {
				productCategories: {
					category: true,
				},
			},
		});

		// We don't have a product, return empty list of products
		if (product === null) {
			return [];
		}

		// Get pagination params
		const { skip, take } = getSkipAndTake(pageNumber, itemsPerPage);

		let products: Array<Product> = [];

		// Find the products in the same category
		if (Array.isArray(product.productCategories) && product.productCategories.length !== 0 && product.productCategories[0].category !== null) {
			products = await this.productRepository.createQueryBuilder("product")
				.cache(true)
				.setFindOptions({
					relationLoadStrategy: "query",
				})

				// Load all categories
				.leftJoinAndSelect("product.productCategories", "productCategory")
				.leftJoinAndSelect("productCategory.category", "category")

				// Filter by category
				.innerJoin("product.productCategories", "filterProductCategories")
				.innerJoin("filterProductCategories.category", "filterCategory")

				.where("filterCategory.id = :id", {
					id: product.productCategories[0].category.id,
				})
				.andWhere("product.status = :status", {
					status: ProductStatus.ACTIVE,
				})
				.distinct(true)
				.skip(skip)
				.take(take)
				.getMany();
		} else {
			// As a fallback return all the products, if the product has been added but no category applied on it.
			products = await this.productRepository.find({
				cache: true,
				relationLoadStrategy: "query",
				where: {
					status: ProductStatus.ACTIVE,
				},
				relations: {
					productCategories: {
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

		// Populate with the cheapest variant
		products = await this.__populateWithCheapestVariant(products);
		if (!Array.isArray(products) || products.length === 0) {
			return [];
		}

		return this.__findCampaignsAndPrices(products, currency, ProductSort.BestMatch);
	}

	/**
	 * Finds a product by its uuid
	 *
	 * @param uuid
	 * @returns
	 */
	async findOneByUUID(uuid: string): Promise<Product> {
		this.logger.log(`Retrieving product by uuid: ${uuid}`);

		// Find the product
		const product = await this.productRepository.findOne({
			relationLoadStrategy: "query",
			where: { uuid: uuid, },
			relations: {
				attachments: true,
				options: {
					values: true,
				},
				variants: {
					optionValues: {
						optionValue: true,
					},
					inventoryItem: {
						levels: {
							warehouse: true,
						},
					},
					images: true,
				},
				productCategories: {
					category: true,
				},
				reviews: {
					customer: true,
					images: true,
				},
			},
		});

		if (product === null) {
			throw new NotFoundException({
				error: "Failed to find the product. Please check and try again.",
			});
		}

		return product;
	}

	/**
	 * Finds a product by its slug
	 *
	 * @param customer
	 * @param slug
	 * @param currency
	 * @returns
	 */
	async findOneBySlug(customer: Customer, slug: string, currency: CurrencyCode): Promise<Product> {
		this.logger.log(`Retrieving product by slug: ${slug} for customer: ${customer?.uuid ?? "N/A"}`);

		// Find the product
		const product = await this.productRepository.findOne({
			cache: true,
			relationLoadStrategy: "query",
			where: {
				slug: slug,
				status: ProductStatus.ACTIVE,
			},
			relations: {
				attachments: true,
				options: {
					values: true,
				},
				variants: {
					optionValues: {
						optionValue: true,
					},
					inventoryItem: {
						levels: {
							warehouse: true,
						},
					},
					images: true,
				},
				productCategories: {
					category: true,
				},
				reviews: {
					customer: true,
					images: true,
				},
			},
		});

		// Make sure the product exists
		if (product === null) {
			throw new NotFoundException({
				error: "Failed to find the product. Please check and try again.",
			});
		}

		// Make sure we have a campaign against the product
		const campaign = await this.__getProductCampaign(product);
		if (campaign !== null) {
			product.campaign = campaign;
		}

		// Register a view for the customer
		if (customer !== null && product !== null) {
			await this.registerProductView(customer, product);
		}

		// Increment the number of views on the product
		await this.productRepository.increment({ id: product.id, }, "viewsCount", 1);

		return this.__findCampaignAndPrices(product, currency);
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
		const product = await this.productRepository.findOne({
			relationLoadStrategy: "query",
			where: { uuid: uuid, },
		});

		if (product === null) {
			throw new NotFoundException({
				error: "Failed to find the product. Please check and try again.",
			});
		}

		if (product.titleEn !== body.title.en.trim()) {
			await this.translationService.queueFieldTranslation(
				FieldTranslationType.PRODUCT_TITLE,
				product.uuid,
				product.uuid,
				body.title.en.trim(),
				'en',
				1000,
			);
		}

		if (product.briefEn !== body.brief.en.trim()) {
			await this.translationService.queueFieldTranslation(
				FieldTranslationType.PRODUCT_BRIEF,
				product.uuid,
				product.uuid,
				body.brief.en.trim(),
				'en',
				1000,
			);
		}

		if (product.descriptionEn !== body.description.en.trim()) {
			await this.translationService.queueFieldTranslation(
				FieldTranslationType.PRODUCT_DESCRIPTION,
				product.uuid,
				product.uuid,
				body.description.en.trim(),
				'en',
				1000,
			);
		}

		// Update the product
		product.titleEn = body.title.en.trim();
		product.titleAr = body.title.ar.trim();
		product.briefEn = body.brief.en.trim();
		product.briefAr = body.brief.ar.trim();
		product.descriptionEn = body.description.en.trim();
		product.descriptionAr = body.description.ar.trim();
		product.descriptionHtmlEn = body.descriptionHtml.en.trim();
		product.descriptionHtmlAr = body.descriptionHtml.ar.trim();
		await this.productRepository.save(product);

		// Find the categories and create product categories.
		// This is to join the categories to its associated product.
		if (body.categories !== null && Array.isArray(body.categories)) {
			await this.syncProductCategories(product, body.categories);
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
			const productBySlug = await this.productRepository.findOne({
				relationLoadStrategy: "query",
				where: {
					slug: body.slug.trim().toLowerCase(),
				},
			});

			// Make sure we don't create another product with the same slug
			if (productBySlug !== null && productBySlug.uuid !== uuid) {
				throw new BadRequestException({
					errors: {
						slug: "A product using the same slug already exists. Please use a different slug.",
					},
				});
			}
		}

		// Find the product
		const product = await this.productRepository.findOne({
			relationLoadStrategy: "query",
			where: {
				uuid: uuid,
			},
		});

		if (product === null) {
			throw new NotFoundException({
				error: "Failed to find the product. Please check and try again.",
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
		const product = await this.productRepository.findOne({
			relationLoadStrategy: "query",
			where: { uuid: uuid, },
		});

		if (product === null) {
			throw new NotFoundException({
				error: "Failed to find the product. Please check and try again.",
			});
		}

		// Create the status of the product
		let status = ProductStatus.DRAFT;
		switch (body.status) {
			case "active":
				status = ProductStatus.ACTIVE;
				break;
			case "archived":
				status = ProductStatus.ARCHIVED;
				break;
			case "draft":
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
	 * Updates the featured images of the products
	 *
	 * @param uuid
	 * @param body``
	 * @returns
	 */
	async updateProductFeaturedImage(uuid: string, body: UpdateProductFeaturedImageDto): Promise<Product> {
		this.logger.log(`Updating product featured image: ${uuid}`);

		// Find the product
		const product = await this.productRepository.findOne({
			relationLoadStrategy: "query",
			where: { uuid: uuid, },
		});

		if (product === null) {
			throw new NotFoundException({
				error: "Failed to find the product. Please check and try again.",
			});
		}

		// Find the image
		const image = await this.productImageVariantImageRepository.findOne({
			where: { uuid: body.imageUUID, },
		});

		if (image === null) {
			throw new NotFoundException({
				error: "Failed to find the image. Please check and try again.",
			});
		}

		// Update the featured image and thumbnail
		product.featuredImageUrl = image.imageUrl;
		product.featuredThumbnailUrl = image.thumbnailUrl;
		return this.productRepository.save(product);
	}

	/**
	 * Updates the sizechart of a product
	 *
	 * @param uuid
	 * @param file
	 * @returns
	 */
	async updateProductSizechart(uuid: string, file: Express.Multer.File): Promise<Product> {
		this.logger.log(`Updating product size chart: ${uuid}`);

		// Find the product
		const product = await this.productRepository.findOne({
			relationLoadStrategy: "query",
			where: { uuid: uuid, },
		});

		if (product === null) {
			throw new NotFoundException({
				error: "Failed to find the product. Please check and try again.",
			});
		}

		// Generate a small image for the image
		const imagePath = await this.imageThumbnailService.generateImageWithoutCrop(file.path);

		// Upload the image to s3
		let imageParams: { key: string, url: string, } | null = null;
		try {
			imageParams = await this.s3Service.uploadPath("sizecharts", imagePath, "image/webp");
		} catch (err) {
			this.logger.error(err);
			throw new InternalServerErrorException({
				error: "Failed to upload the product sizechart image. Please try again.",
			});
		}

		// Delete the temporary files from the disk
		await this.fileService.deletePath(imagePath);
		await this.fileService.deleteFile(file);

		// Update the product with sizechart image
		product.sizechartUrl = imageParams.url;
		return this.productRepository.save(product);
	}

	/**
	 * Deletes the sizechart of a product
	 *
	 * @param uuid
	 */
	async deleteProductSizechart(uuid: string): Promise<void> {
		this.logger.log(`Deleting product size chart: ${uuid}`);

		// Find the product
		const product = await this.productRepository.findOne({
			relationLoadStrategy: "query",
			where: { uuid: uuid, },
		});

		if (product === null) {
			throw new NotFoundException({
				error: "Failed to find the product. Please check and try again.",
			});
		}

		// Delete the sizechart
		try {
			// Format the key using the sizechart url
			let key = product.sizechartUrl;
			if (key !== undefined && key !== null && key.startsWith('s3://')) {
				key = key.substring(5);
			}
			await this.s3Service.deleteFile(key);
		} catch (err) {
			this.logger.error(err);
		}

		product.sizechartUrl = "";
		await this.productRepository.save(product);
	}

	/**
	 * Creates a product attachment
	 *
	 * @param uuid
	 * @param files
	 * @returns
	 */
	async createProductAttachments(uuid: string, files: Array<Express.Multer.File>): Promise<Array<ProductAttachment>> {
		this.logger.log(`Attaching images to product: ${uuid}`);

		// Make sure we have enough attachments
		if (!Array.isArray(files) || files.length === 0) {
			throw new BadRequestException({
				errors: {
					files: "Please upload valid images.",
				},
			});
		}

		// Find the product
		const product = await this.productRepository.findOne({
			relationLoadStrategy: "query",
			where: { uuid: uuid, },
		});

		if (product === null) {
			throw new NotFoundException({
				error: "Failed to find the product. Please check and try again.",
			});
		}

		// Upload each file and create an attachment
		return Promise.all(
			files.map(async file => {
				// Generate a small image for the attachment
				const imagePath = await this.imageThumbnailService.generateImageWithoutCrop(file.path);

				// Upload the image to s3
				let imageParams: { key: string, url: string, } | null = null;
				try {
					imageParams = await this.s3Service.uploadPath("attachments", imagePath, "image/webp");
				} catch (err) {
					this.logger.error(err);
					throw new InternalServerErrorException({
						error: "Failed to upload the product attachment. Please try again.",
					});
				}

				// Delete the temporary files from the disk
				await this.fileService.deletePath(imagePath);
				await this.fileService.deleteFile(file);

				// Create an attachment entry
				const attachment = new ProductAttachment();
				attachment.uuid = crypto.randomUUID();
				attachment.product = product;
				attachment.mediaUrl = imageParams.url;
				attachment.mediaType = AttachmentMediaType.Image;
				return this.productAttachmentRepository.save(attachment);
			})
		);
	}

	/**
	 * Retrieves a list of product attachments
	 *
	 * @param uuid
	 * @returns
	 */
	async getProductAttachments(uuid: string): Promise<Array<ProductAttachment>> {
		this.logger.log(`Retrieving product attachments for product: ${uuid}`);

		// Find the product
		const product = await this.productRepository.findOne({
			relationLoadStrategy: "query",
			where: { uuid: uuid, },
		});

		if (product === null) {
			throw new NotFoundException({
				error: "Failed to find the product. Please check and try again.",
			});
		}

		return this.productAttachmentRepository.findBy({
			product: {
				id: product.id,
			},
		});
	}

	/**
	 * Deletes a product attachment
	 *
	 * @param uuid
	 */
	async deleteProductAttachment(uuid: string): Promise<void> {
		this.logger.log(`Deleting product attachment: ${uuid}`);

		// Find the attachment
		const attachment = await this.productAttachmentRepository.findOne({
			where: {
				uuid: uuid,
			},
		});

		if (attachment === null) {
			throw new NotFoundException({
				error: "Failed to find the attachment. Please check and try again.",
			});
		}

		// Delete the attachment on s3
		try {
			// Format the key using the media url
			let key = attachment.mediaUrl;
			if (key !== undefined && key !== null && key.startsWith('s3://')) {
				key = key.substring(5);
			}
			await this.s3Service.deleteFile(key);
		} catch (err) {
			this.logger.error(err);
		}

		// Delete the attachment
		await this.productAttachmentRepository.delete({
			uuid: uuid,
		});
	}

	/**
	 * Deletes a product
	 *
	 * @param uuid
	 */
	async delete(uuid: string): Promise<void> {
		const product = await this.productRepository.findOne({
			where: { uuid },
			relations: { productCategories: { category: true } },
		});

		const categoryIds = (product?.productCategories ?? [])
			.map((pc) => pc.category?.id)
			.filter((id): id is number => id !== undefined);

		await this.productRepository.delete({ uuid });

		await this.recalculateCategoryProductsCount(categoryIds);
	}
}

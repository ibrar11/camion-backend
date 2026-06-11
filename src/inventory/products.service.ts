import * as crypto from "node:crypto";

import {
	BadRequestException,
	Inject,
	Injectable,
	Logger,
	NotFoundException
} from '@nestjs/common';
import { Job } from "bullmq";

import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';

import { getSkipAndTake } from "../common/pagination";
import { generateSlug } from "../common/slug";

import { CreateProductDto } from './dtos/CreateProductDto';
import { UpdateProductDto } from './dtos/UpdateProductDto';
import { UpdateProductSlugDto } from './dtos/UpdateProductSlugDto';
import { UpdateProductStatusDto } from './dtos/UpdateProductStatusDto';
import { UpdateProductFeaturedImageDto } from "./dtos/UpdateProductFeaturedImageDto";

import { ProductStatus } from './enums/ProductStatus.enum';
import { ProductSort } from "./enums/ProductSort.enum";

import { Category } from "./entities/category.entity";
import { Product } from './entities/product.entity';
import { ProductCategory } from "./entities/product-category.entity";
import { ProductVariant } from "./entities/product-variant.entity";
import { ProductVariantImage } from "./entities/product-variant-image.entity";
import {
	formatProductVariants
} from "../common/product-variant-filter";

import { TranslationService } from "../translation/translation.service";
import { FieldTranslationType } from "../translation/enums/FieldTranslationType.enum";
import { Customer } from "src/customers/entities/customer.entity";
import { ProductView } from "./entities/product-view.entity";
import { QueueService } from "src/queue/queue.service";
import { QueueName } from "src/queue/enums/QueueTypes.enum";
import { ProductCategoryResyncJobData } from "src/queue/types";

@Injectable()
export class ProductsService {
	private readonly logger = new Logger(ProductsService.name);

	constructor(
		@Inject(TranslationService) private readonly translationService: TranslationService,
		@InjectRepository(Category) private readonly categoryRepository: Repository<Category>,
		@InjectRepository(Product) private readonly productRepository: Repository<Product>,
		@InjectRepository(ProductCategory) private readonly productCategoryRepository: Repository<ProductCategory>,
		@InjectRepository(ProductVariant) private readonly productVariantRepository: Repository<ProductVariant>,
		@InjectRepository(ProductVariantImage) private readonly productImageVariantImageRepository: Repository<ProductVariantImage>,
		@InjectRepository(ProductView) private readonly productViewRepository: Repository<ProductView>,
		@Inject(QueueService) private readonly queueService: QueueService,
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

	private async syncProductCategories(
		product: Product,
		categoryUuids: string[],
		categoryMaps?: {
			byUuid: Map<string, Pick<Category, "id" | "uuid" | "parentId">>;
			byId: Map<number, Pick<Category, "id" | "uuid" | "parentId">>;
		},
	): Promise<void> {
		await this.productCategoryRepository.delete({
			product: { id: product.id },
		});

		const expandedCategoryUuids = await this.expandCategoryUuidsWithAncestors(categoryUuids, categoryMaps);
		if (expandedCategoryUuids.length === 0) {
			return;
		}

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
		}
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
	async __populateWithVariantsLowToHigh(products: Array<Product>): Promise<Array<Product>> {
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

		return formatProductVariants(products, ProductSort.PriceLowToHigh);
	}

	/**
	 * Populates each product with its most expensive variant
	 *
	 * @param products
	 * @returns
	 */
	async __populateWithVariantsHighToLow(products: Array<Product>): Promise<Array<Product>> {
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

		return formatProductVariants(products, ProductSort.PriceHighToLow);
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
		const existingView = await this.productViewRepository.findOne({
			where: {
				customer: { id: customer.id, },
				product: { id: product.id, },
			},
		});

		// Update the existing view
		if (existingView) {
			existingView.viewsCount += 1;
			return this.productViewRepository.save(existingView);
		}

		// Create a new view
		const view = new ProductView();
		view.uuid = crypto.randomUUID();
		view.customer = customer;
		view.product = product;
		view.viewsCount = 1;
		return this.productViewRepository.save(view);
	}

	/**
	 * Finds products that have at least one variant without skuMeta.
	 *
	 * @param pageNumber
	 * @param itemsPerPage
	 * @returns
	 */
	async findProductsWithVariantsMissingSkuMeta(
		pageNumber: number = 1,
		itemsPerPage: number = 100,
	): Promise<Array<Product>> {
		this.logger.log(`Retrieving products with variants missing skuMeta`);

		const { skip, take } = getSkipAndTake(pageNumber, itemsPerPage);

		return this.productRepository.createQueryBuilder("product")
			.setFindOptions({
				relationLoadStrategy: "query",
			})
			.leftJoinAndSelect("product.variants", "variant")
			.leftJoinAndSelect("product.productCategories", "productCategory")
			.leftJoinAndSelect("productCategory.category", "category")
			.where("variant.skuMeta IS NULL")
			.distinct(true)
			.orderBy("product.id", "DESC")
			.skip(skip)
			.take(take)
			.getMany();
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
	findAllUncached(filters: string, sort: ProductSort = ProductSort.Desc, pageNumber: number = 1, itemsPerPage: number = 100): Promise<Array<Product>> {
		this.logger.log(`Retrieving products uncached`);

		// Get pagination params
		const { skip, take } = getSkipAndTake(pageNumber, itemsPerPage);

		// Parse the filters
		let filtersObject: {
			slug?: string,
			query?: string,
		} = {};
		try {
			filtersObject = JSON.parse(filters);
		} catch {
			this.logger.warn("Unable to parse filters. Please check the documentation and try again.");
		}

		// Returns products by category
		if (filtersObject.slug !== undefined) {
			return this.findAllByCategoryUncached(filtersObject.slug, pageNumber, itemsPerPage);
		}

		// Returns products by query
		if (filtersObject.query !== undefined) {
			return this.searchProductsUncached(filtersObject.query, "en", ProductSort.BestMatch, pageNumber, itemsPerPage);
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
	 * @param sort
	 * @param pageNumber
	 * @param itemsPerPage
	 * @returns
	 */
	async findAll(filters: string, sort: ProductSort = ProductSort.Desc, pageNumber: number = 1, itemsPerPage: number = 100): Promise<Array<Product>> {
		this.logger.log(`Retrieving products for graphql`);

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

		return this.__populateWithVariantsLowToHigh(products);
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
	 * @param categorySlug
	 * @param pageNumber
	 * @param itemsPerPage
	 * @returns
	 */
	async findAllByCategory(categorySlug: string, pageNumber: number = 1, itemsPerPage: number = 100): Promise<Array<Product>> {
		this.logger.log(`Retrieving products by category slug: ${categorySlug}`);

		// Find the category, return empty array if there is no category against the slug
		const category = await this.categoryRepository.findOne({
			cache: true,
			where: {
				slug: categorySlug,
			},
		});

		// Get other products as fallback
		if (category === null) {
			return this.findAll("", ProductSort.Desc, pageNumber, itemsPerPage);
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

		return this.__populateWithVariantsLowToHigh(products);
	}

	/**
	 * Returns a list of recently viewed products by a customer
	 *
	 * @param customer
	 * @param pageNumber
	 * @param itemsPerPage
	 * @returns
	 */
	async getRecentlyViewedProducts(customer: Customer, pageNumber: number = 1, itemsPerPage: number = 100): Promise<Array<Product>> {
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
		const products: Array<Product> = productViews.map(view => view.product);

		return this.__populateWithVariantsLowToHigh(products);
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

		// Determine the search column based on the language
		const tsvTitleColumnsMap = {
			"en": "product.tsv_title_en",
			"ar": "product.tsv_title_ar",
		};

		// Get the config language
		const configLanguageMap = {
			"en": "english",
			"ar": "arabic",
		};

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
					.where(`${tsvTitleColumnsMap[language]} @@ to_tsquery(:configLanguage, :searchQuery)`, {
						configLanguage: configLanguageMap[language],
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
					.where(`${tsvTitleColumnsMap[language]} @@ to_tsquery(:configLanguage, :searchQuery)`, {
						configLanguage: configLanguageMap[language],
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
					.where(`${tsvTitleColumnsMap[language]} @@ to_tsquery(:configLanguage, :searchQuery)`, {
						configLanguage: configLanguageMap[language],
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
	 * @param sort
	 * @param pageNumber
	 * @param itemsPerPage
	 * @returns
	 */
	async searchProducts(query: string, language: string, sort: ProductSort = ProductSort.BestMatch, pageNumber: number = 1, itemsPerPage: number = 100): Promise<Array<Product>> {
		this.logger.log(`Searching for products, query: ${query}, language: ${language}`);

		// Clean the search query
		const searchQuery = query.trim().split(/\s+/).map(w => `${w}:*`.toLowerCase()).join(' & ');

		console.log(`searchQuery: ${searchQuery}`);

		// Determine the search column based on the language
		const tsvTitleColumnsMap = {
			"en": "product.tsv_title_en",
			"ar": "product.tsv_title_ar",
		};

		// Get the config language
		const configLanguageMap = {
			"en": "english",
			"ar": "arabic",
		};

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
				products = await this.productRepository.createQueryBuilder("product")
					.cache(true)
					.setFindOptions({
						relationLoadStrategy: "query",
					})

					// Only join products that actually have categories
					.innerJoinAndSelect("product.productCategories", "productCategory")
					.innerJoinAndSelect("productCategory.category", "category")

					// Search Filter
					.where(`${tsvTitleColumnsMap[language]} @@ to_tsquery(:configLanguage, :searchQuery)`, {
						configLanguage: configLanguageMap[language],
						searchQuery: searchQuery,
					})

					// Filter active products
					.andWhere("product.status = :status", { status: ProductStatus.ACTIVE, })

					.distinct(true)
					.orderBy("product.id", "DESC")
					.skip(skip)
					.take(take)
					.getMany();

				return this.__populateWithVariantsLowToHigh(products);

			case ProductSort.PriceLowToHigh:
				// Subquery to sort variants of a product by minimum price
				const leastExpensiveVariantQuery = this.productRepository.manager.createQueryBuilder(ProductVariant, 'v')
					.select('MIN(v.cost_amount)', 'minCostAmount')
					.where('v.product_id = product.id')
					.getQuery();

				products = await this.productRepository.createQueryBuilder('product')
					.cache(true)
					.setFindOptions({
						relationLoadStrategy: "query",
					})

					// Populate product categories
					.leftJoinAndSelect('product.productCategories', 'productCategories')
					.leftJoinAndSelect('productCategories.category', 'category')

					// Search Filter
					.where(`${tsvTitleColumnsMap[language]} @@ to_tsquery(:configLanguage, :searchQuery)`, {
						configLanguage: configLanguageMap[language],
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

				return this.__populateWithVariantsLowToHigh(products);

			case ProductSort.PriceHighToLow:
				const mostExpensiveVariantQuery = this.productRepository.manager.createQueryBuilder(ProductVariant, 'v')
					.select('MAX(v.cost_amount)', 'maxCostAmount')
					.where('v.product_id = product.id')
					.getQuery();

				products = await this.productRepository.createQueryBuilder('product')
					.cache(true)
					.setFindOptions({
						relationLoadStrategy: "query",
					})

					// Populate product categories
					.leftJoinAndSelect('product.productCategories', 'productCategories')
					.leftJoinAndSelect('productCategories.category', 'category')

					// Search Filter
					.where(`${tsvTitleColumnsMap[language]} @@ to_tsquery(:configLanguage, :searchQuery)`, {
						configLanguage: configLanguageMap[language],
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

				return this.__populateWithVariantsHighToLow(products);

			default: // do nothing
				break;
		}

		return [];
	}

	/**
	 * Returns a list of recommended products
	 *
	 * @param slug
	 * @param pageNumber
	 * @param itemsPerPage
	 * @returns
	 */
	async getRecommendedProducts(slug: string, pageNumber: number = 1, itemsPerPage: number = 100): Promise<Array<Product>> {
		this.logger.log(`Retrieving a list of recommended products for product: ${slug}`);

		// Find the source product with its categories
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
				.andWhere('product.id != :productId', {
					productId: product.id,
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

		return this.__populateWithVariantsLowToHigh(products);
	}

	/**
	 * Returns products by featured category
	 *
	 * @param pageNumber
	 * @param itemsPerPage
	 * @returns
	 */
	async getFeaturedProducts(pageNumber: number = 1, itemsPerPage: number = 100): Promise<Array<Product>> {
		this.logger.log(`Retrieving a list of featured products`);

		// Get pagination params
		const { skip, take } = getSkipAndTake(pageNumber, itemsPerPage);

		// Get the featured category
		const category = await this.categoryRepository.findOne({
			cache: true,
			where: {
				isFeaturedOnHomepage: true,
			},
		});

		// Get other products as fallback
		if (category === null) {
			return this.findAll("", ProductSort.Desc, pageNumber, itemsPerPage);
		}

		// Find the products in the desired category
		const products = await this.productRepository.createQueryBuilder("product")
			.cache(true)
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

		// Fallback to all products
		if (Array.isArray(products) && products.length === 0) {
			return this.findAll("", ProductSort.Desc, pageNumber, itemsPerPage);
		}

		return this.__populateWithVariantsLowToHigh(products);
	}

	/**
	 * Returns popular products
	 *
	 * @param pageNumber
	 * @param itemsPerPage
	 * @returns
	 */
	async getPopularProducts(pageNumber: number = 1, itemsPerPage: number = 100): Promise<Array<Product>> {
		this.logger.log(`Retrieving popular products`);

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

		return this.__populateWithVariantsLowToHigh(products);
	}

	/**
	 * Returns the related products of a product
	 *
	 * @param slug
	 * @param pageNumber
	 * @param itemsPerPage
	 * @returns
	 */
	async getRelatedProducts(slug: string, pageNumber: number = 1, itemsPerPage: number = 100): Promise<Array<Product>> {
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

		return this.__populateWithVariantsLowToHigh(products);
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
			cache: true,
			relationLoadStrategy: "query",
			where: { uuid: uuid, },
			relations: {
				options: {
					values: true,
				},
				variants: {
					optionValues: {
						optionValue: true,
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
	 * @returns
	 */
	async findOneBySlug(customer: Customer, slug: string): Promise<Product> {
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
				options: {
					values: true,
				},
				variants: {
					optionValues: {
						optionValue: true,
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

		// Register a view for the customer
		if (customer !== null && product !== null) {
			await this.registerProductView(customer, product);
		}

		// Increment the number of views on the product
		product.viewsCount += 1;
		await this.productRepository.save(product);

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

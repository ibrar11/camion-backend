import * as crypto from "node:crypto";

import {
	BadRequestException,
	Inject,
	Injectable,
	Logger,
	NotFoundException
} from '@nestjs/common';

import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { getSkipAndTake } from "../common/pagination";
import { generateSlug } from "../common/slug";

import { CreateProductDto } from './dtos/CreateProductDto';
import { UpdateProductDto } from './dtos/UpdateProductDto';
import { UpdateProductSlugDto } from './dtos/UpdateProductSlugDto';
import { UpdateProductStatusDto } from './dtos/UpdateProductStatusDto';

import { ProductStatus } from './enums/ProductStatus.enum';
import { ProductSort } from "./enums/ProductSort.enum";

import { Category } from "./entities/category.entity";
import { Product } from './entities/product.entity';
import { ProductCategory } from "./entities/product-category.entity";
import { ProductVariant } from "./entities/product-variant.entity";
import { sliceProductVariants } from "src/common/product-variant-filter";

import { TranslationService } from "../translation/translation.service";
import { FieldTranslationType } from "../translation/enums/FieldTranslationType.enum";

@Injectable()
export class ProductsService {
	private readonly logger = new Logger(ProductsService.name);

	constructor(
		@InjectRepository(Category) private readonly categoryRepository: Repository<Category>,
		@InjectRepository(Product) private readonly productRepository: Repository<Product>,
		@InjectRepository(ProductCategory) private readonly productCategoryRepository: Repository<ProductCategory>,
		@Inject(TranslationService) private readonly translationService: TranslationService,
	) { }

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
			product.status = ProductStatus.ACTIVE;
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
			// Remove old relations if updating
			await this.productCategoryRepository.delete({
				product: { id: product.id },
			});

			const uniqueCategories = [...new Set(body.categories)];

			for (const categoryUUID of uniqueCategories) {
				const category = await this.categoryRepository.findOneBy({ uuid: categoryUUID });

				if (!category) continue;

				const productCategory = new ProductCategory();
				productCategory.product = product;
				productCategory.category = category;

				await this.productCategoryRepository.save(productCategory);
			}
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
	async findAllUncached(filters: string, sort: ProductSort = ProductSort.Desc, pageNumber: number = 1, itemsPerPage: number = 100): Promise<Array<Product>> {
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

		const products = await this.productRepository.find({
			relationLoadStrategy: "query",
			relations: {
				variants: {
					images: true,
				},
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

		return sliceProductVariants(products);
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
				variants: {
					images: true,
				},
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

		return sliceProductVariants(products);
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
		const products = await this.productRepository.createQueryBuilder("product")
			.setFindOptions({
				relationLoadStrategy: "query",
			})

			// Populate variants and their specific option value mappings
			.leftJoinAndSelect('product.variants', 'variants')
			.leftJoinAndSelect('variants.images', 'images')

			// Many-to-many join
			.innerJoin("product.productCategories", "productCategory")
			.innerJoin("productCategory.category", "category")
			.where("category.id = :id", {
				id: category.id,
			})
			.andWhere("product.status = :status", { status: ProductStatus.ACTIVE, })
			.distinct(true)
			.orderBy("product.id", "DESC")
			.skip(skip)
			.take(take)
			.getMany();

		return sliceProductVariants(products);
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
		const products = await this.productRepository.createQueryBuilder("product")
			.cache(true)
			.setFindOptions({
				relationLoadStrategy: "query",
			})

			// Populate variants and their specific option value mappings
			.leftJoinAndSelect("product.variants", "variant")
			.leftJoinAndSelect("variant.images", "image")

			// Many-to-many join
			.innerJoin("product.productCategories", "productCategory")
			.innerJoin("productCategory.category", "category")
			.where("category.id = :id", {
				id: category.id,
			})
			.andWhere("product.status = :status", { status: ProductStatus.ACTIVE, })
			.distinct(true)
			.orderBy("product.id", "DESC")
			.skip(skip)
			.take(take)
			.getMany();

		return sliceProductVariants(products);
	}

	/**
	 * Returns a list of recently viewed products by a customer
	 *
	 * @param customerUUID
	 * @param pageNumber
	 * @param itemsPerPage
	 * @returns
	 */
	async getRecentlyViewedProducts(customerUUID: string, pageNumber: number = 1, itemsPerPage: number = 100): Promise<Array<Product>> {
		this.logger.log(`Retrieving a list of recenty viewed products`);

		// Get pagination params
		const { skip, take } = getSkipAndTake(pageNumber, itemsPerPage);

		const products = await this.productRepository.find({
			cache: true,
			relationLoadStrategy: "query",
			where: {
				status: ProductStatus.ACTIVE,
			},
			relations: {
				variants: {
					images: true,
				},
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

		return sliceProductVariants(products);
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

		// Language to title column name mapping
		const titleColumnMap: Record<string, string> = {
			"en": "product.titleEn",
			"ar": "product.titleAr",
		};

		// Language to description column name mapping
		const descriptionColumnMap: Record<string, string> = {
			"en": "product.descriptionEn",
			"ar": "product.descriptionAr",
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
					.setFindOptions({
						relationLoadStrategy: "query",
					})

					// Only join products that actually have categories
					.innerJoin("product.productCategories", "productCategory")
					.innerJoin("productCategory.category", "category")

					// Join variants and images (still optional)
					.leftJoinAndSelect("product.variants", "variant")
					.leftJoinAndSelect("variant.images", "image")

					// Filter by product text column
					.where(`${titleColumnMap[language]} ILIKE :query OR ${descriptionColumnMap[language]} ILIKE :query`, { query: `%${query}%` })

					.distinct(true)
					.orderBy("product.id", "DESC")
					.skip(skip)
					.take(take)
					.getMany();
				break;

			case ProductSort.PriceLowToHigh:
				// Subquery to sort variants of a product by minimum price
				const leastExpensiveVariantQuery = this.productRepository
					.manager.createQueryBuilder(ProductVariant, 'v')
					.select('MIN(v.cost_amount)', 'minCostAmount')
					.where('v.product_id = product.id')
					.getQuery();

				products = await this.productRepository.createQueryBuilder('product')
					.setFindOptions({
						relationLoadStrategy: "query",
					})

					// Populate variants and their specific option value mappings
					.leftJoinAndSelect('product.variants', 'variant')
					.leftJoinAndSelect('variant.images', 'image')

					// Populate product categories
					.leftJoinAndSelect('product.productCategories', 'productCategories')
					.leftJoinAndSelect('productCategories.category', 'category')

					// Search Filter
					// Filter by product text column
					.where(`${titleColumnMap[language]} ILIKE :query OR ${descriptionColumnMap[language]} ILIKE :query`, { query: `%${query}%` })

					// Add the subquery result as a virtual column for sorting
					.addSelect(`(${leastExpensiveVariantQuery})`, 'least_expensive_variant_price')

					// Order by the virtual column and handle pagination
					.orderBy('least_expensive_variant_price', 'ASC')
					.take(take)
					.skip(skip)
					.getMany();
				break;

			case ProductSort.PriceHighToLow:
				const mostExpensiveVariantQuery = this.productRepository
					.manager.createQueryBuilder(ProductVariant, 'v')
					.select('MAX(v.cost_amount)', 'maxCostAmount')
					.where('v.product_id = product.id')
					.getQuery();

				products = await this.productRepository.createQueryBuilder('product')
					.setFindOptions({
						relationLoadStrategy: "query",
					})

					// Populate variants and their specific option value mappings
					.leftJoinAndSelect('product.variants', 'variant')
					.leftJoinAndSelect('variant.images', 'image')

					// Populate product categories
					.leftJoinAndSelect('product.productCategories', 'productCategories')
					.leftJoinAndSelect('productCategories.category', 'category')

					// Search Filter
					// Filter by product text column
					.where(`${titleColumnMap[language]} ILIKE :query OR ${descriptionColumnMap[language]} ILIKE :query`, { query: `%${query}%` })

					// Add the subquery result as a virtual column for sorting
					.addSelect(`(${mostExpensiveVariantQuery})`, 'most_expensive_variant_price')

					// Order by the virtual column and handle pagination
					.orderBy('most_expensive_variant_price', 'DESC')
					.take(take)
					.skip(skip)
					.getMany();
				break;

			default: // do nothing
				break;
		}

		return sliceProductVariants(products);
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

		// Language to title column name mapping
		const titleColumnMap: Record<string, string> = {
			"en": "product.titleEn",
			"ar": "product.titleAr",
		};

		// Language to description column name mapping
		const descriptionColumnMap: Record<string, string> = {
			"en": "product.descriptionEn",
			"ar": "product.descriptionAr",
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
					.innerJoin("product.productCategories", "productCategory")
					.innerJoin("productCategory.category", "category")

					// Join variants and images (still optional)
					.leftJoinAndSelect("product.variants", "variant")
					.leftJoinAndSelect('variant.images', 'image')

					// Filter by product text column
					.where(`${titleColumnMap[language]} ILIKE :query OR ${descriptionColumnMap[language]} ILIKE :query`, { query: `%${query}%` })

					// Filter active products
					.andWhere("product.status = :status", { status: ProductStatus.ACTIVE, })

					.distinct(true)
					.orderBy("product.id", "DESC")
					.skip(skip)
					.take(take)
					.getMany();
				break;

			case ProductSort.PriceLowToHigh:
				// Subquery to sort variants of a product by minimum price
				const leastExpensiveVariantQuery = this.productRepository
					.manager.createQueryBuilder(ProductVariant, 'v')
					.select('MIN(v.cost_amount)', 'minCostAmount')
					.where('v.product_id = product.id')
					.getQuery();

				products = await this.productRepository.createQueryBuilder('product')
					.cache(true)
					.setFindOptions({
						relationLoadStrategy: "query",
					})

					// Populate variants and their specific option value mappings
					.leftJoinAndSelect('product.variants', 'variant')
					.leftJoinAndSelect('variant.images', 'image')

					// Populate product categories
					.leftJoinAndSelect('product.productCategories', 'productCategories')
					.leftJoinAndSelect('productCategories.category', 'category')

					// Search Filter
					// Filter by product text column
					.where(`${titleColumnMap[language]} ILIKE :query OR ${descriptionColumnMap[language]} ILIKE :query`, { query: `%${query}%` })

					// Filter active products
					.andWhere("product.status = :status", { status: ProductStatus.ACTIVE, })

					// Add the subquery result as a virtual column for sorting
					.addSelect(`(${leastExpensiveVariantQuery})`, 'least_expensive_variant_price')

					// Order by the virtual column and handle pagination
					.orderBy('least_expensive_variant_price', 'ASC')
					.take(take)
					.skip(skip)
					.getMany();
				break;

			case ProductSort.PriceHighToLow:
				const mostExpensiveVariantQuery = this.productRepository
					.manager.createQueryBuilder(ProductVariant, 'v')
					.select('MAX(v.cost_amount)', 'maxCostAmount')
					.where('v.product_id = product.id')
					.getQuery();

				products = await this.productRepository.createQueryBuilder('product')
					.cache(true)
					.setFindOptions({
						relationLoadStrategy: "query",
					})

					// Populate variants and their specific option value mappings
					.leftJoinAndSelect('product.variants', 'variant')
					.leftJoinAndSelect('variant.images', 'image')

					// Populate product categories
					.leftJoinAndSelect('product.productCategories', 'productCategories')
					.leftJoinAndSelect('productCategories.category', 'category')

					// Search Filter
					// Filter by product text column
					.where(`${titleColumnMap[language]} ILIKE :query OR ${descriptionColumnMap[language]} ILIKE :query`, { query: `%${query}%` })

					// Filter active products
					.andWhere("product.status = :status", { status: ProductStatus.ACTIVE, })

					// Add the subquery result as a virtual column for sorting
					.addSelect(`(${mostExpensiveVariantQuery})`, 'most_expensive_variant_price')

					// Order by the virtual column and handle pagination
					.orderBy('most_expensive_variant_price', 'DESC')
					.take(take)
					.skip(skip)
					.getMany();
				break;

			default: // do nothing
				break;
		}

		return sliceProductVariants(products);
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

				// Populate variants and their specific option value mappings
				.leftJoinAndSelect('product.variants', 'variant')
				.leftJoinAndSelect('variant.images', 'image')

				// Many-to-many join
				.innerJoin("product.productCategories", "productCategory")
				.innerJoin("productCategory.category", "category")

				.where("category.id = :id", {
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
					variants: {
						images: true,
					},
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

		return sliceProductVariants(products);
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

		// TODO: Return a list of featured products

		const products = await this.productRepository.find({
			cache: true,
			relationLoadStrategy: "query",
			where: {
				status: ProductStatus.ACTIVE,
			},
			relations: {
				variants: {
					images: true,
				},
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

		return sliceProductVariants(products);
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

		// TODO: Return a list of popular products

		const products = await this.productRepository.find({
			cache: true,
			relationLoadStrategy: "query",
			where: {
				status: ProductStatus.ACTIVE,
			},
			relations: {
				variants: {
					images: true,
				},
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

		return sliceProductVariants(products);
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

				// Populate variants and their specific option value mappings
				.leftJoinAndSelect('product.variants', 'variant')
				.leftJoinAndSelect('variant.images', 'image')

				// Many-to-many join
				.innerJoin("product.productCategories", "productCategory")
				.innerJoin("productCategory.category", "category")

				.where("category.id = :id", {
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
			// As a fallback return all the products, if the product has been added but no category applied on it.
			products = await this.productRepository.find({
				cache: true,
				relationLoadStrategy: "query",
				where: {
					status: ProductStatus.ACTIVE,
				},
				relations: {
					variants: {
						images: true,
					},
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

		return sliceProductVariants(products);
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
	 * @param slug
	 * @returns
	 */
	async findOneBySlug(slug: string): Promise<Product> {
		this.logger.log(`Retrieving product by slug: ${slug}`);

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

		// Delete existing product categories to make sure new ones don't duplicate
		await this.productCategoryRepository.delete({
			product: {
				id: product.id,
			},
		});

		// Find the categories and create product categories.
		// This is to join the categories to its associated product.
		if (body.categories !== null && Array.isArray(body.categories)) {
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

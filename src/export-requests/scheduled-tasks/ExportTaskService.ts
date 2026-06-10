import * as crypto from "node:crypto";
import * as fs from "node:fs";
import * as os from "node:os";
import * as path from "node:path";

import dayjs from "dayjs";

import { json2csv } from "json-2-csv";

import {
	Inject,
	Injectable,
	InternalServerErrorException,
	Logger,
} from "@nestjs/common";

import { Cron } from "@nestjs/schedule";

import { FileService } from "../../common/file.service";
import { S3Service } from "../../common/s3.service";

import { PricingService } from "../../pricing/pricing.service";

import { CustomerRole } from "../../customers/enums/CustomerRole";
import { ExportRequestFormat } from "../enums/ExportRequestFormat.enum";
import { ExportRequestStatus } from "../enums/ExportRequestStatus.enum";
import { CurrencyCode } from "../../inventory/enums/CurrencyCode.enum";

import { ExportRequest } from "../entities/export-request.entity";
import { ExportRequestsService } from "../export-requests.service";

import { Customer } from "../../customers/entities/customer.entity";
import { CustomersService } from "../../customers/customers.service";

import { Product } from "../../inventory/entities/product.entity";
import { ProductsService } from "../../inventory/products.service";

import { Category } from "../../inventory/entities/category.entity";
import { ProductCategory } from "../../inventory/entities/product-category.entity";

export type CustomerMinimal = {
	readonly uuid: string;
	readonly fullName: string;
	readonly emailAddress: string | null;
	readonly phoneNumber: string | null;
	readonly role: CustomerRole;
	readonly ordersCount: number;
	readonly createdAt: string;
	readonly updatedAt: string;
};

export type CategoryMinimal = {
	readonly uuid: string;
	readonly nameEn: string;
	readonly nameAr: string;
	readonly slug: string;
	readonly pricingFactor: number;
	readonly discountPercentage: number;
	readonly isFeatured: boolean;
};

export type ProductMinimal = {
	readonly uuid: string;
	readonly titleEn: string;
	readonly titleAr: string;
	readonly url: string;
	readonly cost: {
		amount: number;
		currencyCode: CurrencyCode;
	};
	readonly price: {
		amount: number;
		currencyCode: CurrencyCode;
	};
	readonly discountedPrice: {
		amount: number;
		currencyCode: CurrencyCode;
	};
	readonly category: CategoryMinimal;
	readonly subCategory: CategoryMinimal;
	readonly tertiaryCategory: CategoryMinimal;
};

@Injectable()
export class ExportTaskService {
	private readonly logger = new Logger(ExportTaskService.name);

	constructor(
		@Inject(S3Service) private readonly S3Service: S3Service,
		@Inject(FileService) private readonly fileService: FileService,
		@Inject(PricingService) private readonly pricingService: PricingService,
		@Inject(CustomersService) private readonly customersService: CustomersService,
		@Inject(ProductsService) private readonly productsService: ProductsService,
		@Inject(ExportRequestsService) private readonly exportRequestsService: ExportRequestsService,
	) { }

	@Cron("*/5 * * * *")
	async handleCron(): Promise<void> {
		this.logger.log(`Running cron task: ExportTaskService at ${new Date().toString()}`);

		// Get the last pending export request
		const exportRequest = await this.exportRequestsService.findOnePending();
		if (exportRequest === null) {
			this.logger.log(`Not export request found. Quitting the export task.`);
			return;
		}

		// Update he export request to processing
		await this.exportRequestsService.updateExportRequestStatus(exportRequest.uuid, {
			status: ExportRequestStatus.Processing,
		});

		try {
			// Handle the export request
			switch (exportRequest.format) {
				case ExportRequestFormat.CustomersCsv:
				case ExportRequestFormat.CustomersJson:
					await this.handleCustomersExportRequest(exportRequest);
					break;

				case ExportRequestFormat.ProductsCsv:
				case ExportRequestFormat.ProductsJson:
					await this.handleProductExportRequest(exportRequest);
					break;

				default: // do nothing
					break;
			}
		} catch (err) {
			this.logger.error(err);

			// Update the export request to stopped
			await this.exportRequestsService.updateExportRequestStatus(exportRequest.uuid, {
				status: ExportRequestStatus.Stopped,
			});
		}
	}

	/**
	 * Handles customers export
	 *
	 * @param exportRequest
	 */
	async handleCustomersExportRequest(exportRequest: ExportRequest): Promise<void> {
		// Find all the customers for export
		const customers: Array<Customer> = await this.customersService.findAllForExport(exportRequest.pagesCount);
		if (Array.isArray(customers) && customers.length === 0) {
			return;
		}

		// Map the customers to non-sensitive information
		const res: Array<CustomerMinimal> = customers.map(customer => ({
			uuid: customer.uuid,
			fullName: customer.fullName,
			emailAddress: customer.emailAddress ?? "",
			phoneNumber: customer.phoneNumber ?? "",
			role: customer.role,
			ordersCount: customer.ordersCount,
			createdAt: dayjs(customer.createdAt).toISOString(),
			updatedAt: dayjs(customer.updatedAt).toISOString(),
		}));

		// Save the data in csv or json
		switch (exportRequest.format) {
			case ExportRequestFormat.CustomersCsv:
				return this.handleCustomersCsvExport(exportRequest, res);

			case ExportRequestFormat.CustomersJson:
				return this.handleCustomersJsonExport(exportRequest, res);

			default: // do nothing
				break;
		}
	}

	/**
	 * Saves the customers as csv
	 *
	 * @param exportRequest
	 * @param customers
	 */
	async handleCustomersCsvExport(exportRequest: ExportRequest, customers: Array<CustomerMinimal>): Promise<void> {
		// Path of the output csv file
		const outputPath = path.join(os.tmpdir(), `${crypto.randomUUID()}.csv`);

		// Convert the customers array to csv
		const csv = json2csv(customers);

		// Write the csv to the output path
		fs.writeFileSync(outputPath, csv, "utf-8");

		// Upload the csv to s3
		let csvParams: { key: string, url: string } | null;
		try {
			csvParams = await this.S3Service.uploadPath("exports", outputPath, "text/csv");
		} catch (err) {
			this.logger.error(err);
			throw new InternalServerErrorException({
				error: "Failed to upload the csv file to s3. Please try again.",
			});
		}

		// Delete the temporary files
		await this.fileService.deletePath(outputPath);

		// Update the request export download url
		await this.exportRequestsService.updateExportRequestDownloadUrl(exportRequest.uuid, {
			downloadUrl: csvParams.url,
		});
	}

	/**
	 * Saves the customers as json
	 *
	 * @param exportRequest
	 * @param customers
	 */
	async handleCustomersJsonExport(exportRequest: ExportRequest, customers: Array<CustomerMinimal>): Promise<void> {
		// Path of the output json file
		const outputPath = path.join(os.tmpdir(), `${crypto.randomUUID()}.json`);

		// Convert the customer to json
		const json = JSON.stringify(customers, null, 2);

		// Write the json to the output path
		fs.writeFileSync(outputPath, json, "utf-8");

		// Upload the json to json
		let jsonParams: { key: string, url: string } | null;
		try {
			jsonParams = await this.S3Service.uploadPath("exports", outputPath, "application/json");
		} catch (err) {
			this.logger.error(err);
			throw new InternalServerErrorException({
				error: "Failed to upload the json file to s3. Please try again.",
			});
		}

		// Delete the temporary files
		await this.fileService.deletePath(outputPath);

		// Update the request export download url
		await this.exportRequestsService.updateExportRequestDownloadUrl(exportRequest.uuid, {
			downloadUrl: jsonParams.url,
		});
	}

	/**
	 * Handles products export
	 *
	 * @param exportRequest
	 */
	async handleProductExportRequest(exportRequest: ExportRequest): Promise<void> {
		// Empty category to make sure the final csv is valid
		const emptyCategory = {
			uuid: "",
			nameEn: "",
			nameAr: "",
			slug: "",
			pricingFactor: 0,
			discountPercentage: 0,
			isFeatured: false,
		};

		// Find all the products for export
		let products: Array<Product> = [];

		// Find the products by category
		if (exportRequest.category !== null) {
			products = await this.productsService.findAllByCategoryForExport(exportRequest.category, exportRequest.pagesCount);
		} else {
			products = await this.productsService.findAllForExport(exportRequest.pagesCount);
		}

		if (Array.isArray(products) && products.length === 0) {
			return;
		}

		// Map the products to non-sensitive information
		const res: Array<ProductMinimal> = await Promise.all(
			products.map(async product => {
				const categories = this.__getCategories(product.productCategories);

				// Get the first category
				let category: CategoryMinimal | null = null;
				if (categories !== null && categories.category !== null) {
					category = {
						uuid: categories.category.uuid,
						nameEn: categories.category.nameEn,
						nameAr: categories.category.nameAr,
						slug: categories.category.slug,
						pricingFactor: categories.category.pricingFactor,
						discountPercentage: categories.category.discountPercentage,
						isFeatured: categories.category.isFeatured,
					};
				}

				// Get the sub category
				let subCategory: CategoryMinimal | null = null;
				if (categories !== null && categories.subCategory !== null) {
					subCategory = {
						uuid: categories.subCategory.uuid,
						nameEn: categories.subCategory.nameEn,
						nameAr: categories.subCategory.nameAr,
						slug: categories.subCategory.slug,
						pricingFactor: categories.subCategory.pricingFactor,
						discountPercentage: categories.subCategory.discountPercentage,
						isFeatured: categories.subCategory.isFeatured,
					};
				}

				// Get the third category
				let tertiaryCategory: CategoryMinimal | null = null;
				if (categories !== null && categories.tertiaryCategory !== null) {
					tertiaryCategory = {
						uuid: categories.tertiaryCategory.uuid,
						nameEn: categories.tertiaryCategory.nameEn,
						nameAr: categories.tertiaryCategory.nameAr,
						slug: categories.tertiaryCategory.slug,
						pricingFactor: categories.tertiaryCategory.pricingFactor,
						discountPercentage: categories.tertiaryCategory.discountPercentage,
						isFeatured: categories.tertiaryCategory.isFeatured,
					};
				}

				return {
					uuid: product.uuid,
					titleEn: product.titleEn,
					titleAr: product.titleAr,
					url: `https://camion-app.com/en/shop/${product.slug}?variant=${product.variants[0].uuid}`, // TODO:
					cost: product.variants[0].cost,
					price: await this.pricingService.applyPriceOnProductVariant(product, product.variants[0], CurrencyCode.QAR, false),
					discountedPrice: await this.pricingService.applyPriceOnProductVariant(product, product.variants[0], CurrencyCode.QAR, true),
					category: category ?? emptyCategory,
					subCategory: subCategory ?? emptyCategory,
					tertiaryCategory: tertiaryCategory ?? emptyCategory,
				};
			})
		);

		// Save the data in csv or json
		switch (exportRequest.format) {
			case ExportRequestFormat.ProductsCsv:
				return this.handleProductsCsvExport(exportRequest, res);

			case ExportRequestFormat.ProductsJson:
				return this.handleProductsJsonExport(exportRequest, res);

			default: // do nothing
				break;
		}
	}

	/**
	 * Saves the products as csv
	 *
	 * @param exportRequest
	 * @param products
	 */
	async handleProductsCsvExport(exportRequest: ExportRequest, products: Array<ProductMinimal>): Promise<void> {
		// Path of the output csv file
		const outputPath = path.join(os.tmpdir(), `${crypto.randomUUID()}.csv`);

		// Convert the products to csv
		const csv = json2csv(products);

		// Write the csv to the output path
		fs.writeFileSync(outputPath, csv, "utf-8");

		// Upload the csv to s3
		let csvParams: { key: string, url: string } | null;
		try {
			csvParams = await this.S3Service.uploadPath("exports", outputPath, "text/csv");
		} catch (err) {
			this.logger.error(err);
			throw new InternalServerErrorException({
				error: "Failed to upload the csv file to s3. Please try again.",
			});
		}

		// Delete the temporary files
		await this.fileService.deletePath(outputPath);

		// Update the request export download url
		await this.exportRequestsService.updateExportRequestDownloadUrl(exportRequest.uuid, {
			downloadUrl: csvParams.url,
		});
	}

	/**
	 * Saves the products as json
	 *
	 * @param exportRequest
	 * @param products
	 */
	async handleProductsJsonExport(exportRequest: ExportRequest, products: Array<ProductMinimal>): Promise<void> {
		// Path of the output json file
		const outputPath = path.join(os.tmpdir(), `${crypto.randomUUID()}.json`);

		// Convert the products to json
		const json = JSON.stringify(products, null, 2);

		// Write the json to the output path
		fs.writeFileSync(outputPath, json, "utf-8");

		// Upload the json to json
		let jsonParams: { key: string, url: string } | null;
		try {
			jsonParams = await this.S3Service.uploadPath("exports", outputPath, "application/json");
		} catch (err) {
			this.logger.error(err);
			throw new InternalServerErrorException({
				error: "Failed to upload the json file to s3. Please try again.",
			});
		}

		// Delete the temporary files
		await this.fileService.deletePath(outputPath);

		// Update the request export download url
		await this.exportRequestsService.updateExportRequestDownloadUrl(exportRequest.uuid, {
			downloadUrl: jsonParams.url,
		});
	}

	/**
	 * Returns the categories of the product
	 *
	 * @param productCategories
	 * @returns
	 */
	__getCategories(productCategories: Array<ProductCategory>): {
		category: Category,
		subCategory: Category,
		tertiaryCategory: Category,
	} | null {
		// Find the main category
		const categoryEntry = productCategories.find(entry => entry.category.parentId === null);
		if (!categoryEntry || !categoryEntry.category) {
			return null;
		}

		// Find the sub category
		const subCategoryEntry = productCategories.find(entry => entry.category.parentId === categoryEntry.category.id);
		if (!subCategoryEntry || !subCategoryEntry.category) {
			return null;
		}

		// Find the tertiary category
		const tertiaryCategoryEntry = productCategories.find(entry => entry.category.parentId === subCategoryEntry.category.id);
		if (!tertiaryCategoryEntry || !tertiaryCategoryEntry.category) {
			return null;
		}

		return {
			category: categoryEntry.category,
			subCategory: subCategoryEntry.category,
			tertiaryCategory: tertiaryCategoryEntry.category,
		};
	};
}

import crypto from "node:crypto";

import {
	Injectable,
	Logger,
	NotFoundException,
} from "@nestjs/common";

import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";

import { getSkipAndTake } from "../common/pagination";

import { CreateProductOptionDto } from "./dtos/CreateProductOptionDto";
import { UpdateProductOptionDto } from "./dtos/UpdateProductOptionDto";

import { Product } from "./entities/product.entity";
import { ProductOption } from "./entities/product-option.entity";

@Injectable()
export class ProductOptionService {
	private readonly logger = new Logger(ProductOptionService.name);

	constructor(
		@InjectRepository(Product) private readonly productRepository: Repository<Product>,
		@InjectRepository(ProductOption) private readonly productOptionRepository: Repository<ProductOption>,
	) { }

	/**
	 * Creates a product option
	 *
	 * @param productUUID
	 * @param body
	 * @returns
	 */
	async createProductOption(productUUID: string, body: CreateProductOptionDto): Promise<ProductOption> {
		this.logger.log(`Attempting to create product option for product: ${productUUID}`);

		// Find the product
		const product = await this.productRepository.findOneBy({ uuid: productUUID, });
		if (product === null) {
			throw new NotFoundException({
				status: "fail",
			});
		}

		// Create the product option
		const productOption = new ProductOption();
		productOption.uuid = crypto.randomUUID();
		productOption.product = product;
		productOption.nameEn = body.name.en.trim();
		productOption.nameAr = body.name.ar.trim();
		productOption.position = body.position;
		return this.productOptionRepository.save(productOption);
	}

	/**
	 * Finds the product options of a product
	 *
	 * @param productUUID
	 * @param filters
	 * @param sort
	 * @param pageNumber
	 * @param itemsPerPage
	 * @returns
	 */
	async findAll(productUUID: string, filters: string, sort: string, pageNumber: number = 1, itemsPerPage: number = 100): Promise<Array<ProductOption>> {
		this.logger.log(`Retrieving product options of product: ${productUUID}`);

		// Find the product
		const product = await this.productRepository.findOneBy({ uuid: productUUID, });
		if (product === null) {
			throw new NotFoundException({
				status: "fail",
			});
		}

		// Get pagination params
		const { skip, take } = getSkipAndTake(pageNumber, itemsPerPage);

		return this.productOptionRepository.find({
			where: {
				product: { id: product.id, },
			},
			skip: skip,
			take: take,
		});
	}

	/**
	 * Finds a product option
	 *
	 * @param uuid
	 * @returns
	 */
	async findOne(uuid: string): Promise<ProductOption> {
		this.logger.log(`Retrieving product option: ${uuid}`);

		// Find the product option
		const productOption = await this.productOptionRepository.findOneBy({ uuid: uuid, });
		if (productOption === null) {
			throw new NotFoundException({
				status: "fail",
			});
		}
		return productOption;
	}

	/**
	 * Updates a product option
	 *
	 * @param uuid
	 * @param body
	 * @returns
	 */
	async updateProductOption(uuid: string, body: UpdateProductOptionDto): Promise<ProductOption> {
		this.logger.log(`Updating product option: ${uuid}`);

		// Find the product option
		const productOption = await this.productOptionRepository.findOneBy({ uuid: uuid, });
		if (productOption === null) {
			throw new NotFoundException({
				status: "fail",
			});
		}

		// Update the product option
		productOption.nameEn = body.name.en.trim();
		productOption.nameAr = body.name.ar.trim();
		productOption.position = body.position;
		return this.productOptionRepository.save(productOption);
	}

	/**
	 * Deletes a product option
	 *
	 * @param uuid
	 */
	async delete(uuid: string): Promise<void> {
		this.logger.log(`Deleting product option: ${uuid}`);

		await this.productOptionRepository.delete({
			uuid: uuid,
		});
	}
}

import crypto from "node:crypto";

import {
	Injectable,
	Logger,
	NotFoundException,
} from "@nestjs/common";

import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";

import { getSkipAndTake } from "../common/pagination";

import { CreateProductOptionValueDto } from "./dtos/CreateProductOptionValueDto";
import { UpdateProductOptionValueDto } from "./dtos/UpdateProductOptionValueDto";

import { ProductOption } from "./entities/product-option.entity";
import { ProductOptionValue } from "./entities/product-option-value.entity";

@Injectable()
export class ProductOptionValueService {
	private readonly logger = new Logger(ProductOptionValueService.name);

	constructor(
		@InjectRepository(ProductOption) private readonly productOptionRepository: Repository<ProductOption>,
		@InjectRepository(ProductOptionValue) private readonly productOptionValueRepository: Repository<ProductOptionValue>,
	) { }

	/**
	 * Creates a product option value
	 *
	 * @param productOptionUUID
	 * @param body
	 * @returns
	 */
	async createProductOptionValue(productOptionUUID: string, body: CreateProductOptionValueDto): Promise<ProductOptionValue> {
		this.logger.log(`Attempting to create a product option value for option: ${productOptionUUID}`);

		// Find the product option
		const productOption = await this.productOptionRepository.findOneBy({ uuid: productOptionUUID, });
		if (productOption === null) {
			throw new NotFoundException({
				error: "Failed to find the option. Please check and try again.",
			});
		}

		const normalizedValueEn = body.value.en.trim();

		// Try to find existing value by option + value
		let productOptionValue = await this.productOptionValueRepository.findOne({
			where: {
				option: { uuid: productOptionUUID },
				valueEn: normalizedValueEn,
			},
			relations: ["option"],
		});

		// UPDATE
		if (productOptionValue) {
			this.logger.log(`Updating existing option value: ${normalizedValueEn}`);
		} else {
			// CREATE
			this.logger.log(`Creating new option value: ${normalizedValueEn}`);
			productOptionValue = new ProductOptionValue();
			productOptionValue.uuid = crypto.randomUUID();
			productOptionValue.option = productOption;
		}

		// Common fields
		productOptionValue.valueEn = normalizedValueEn;
		productOptionValue.valueAr = body.value.ar.trim();
		productOptionValue.position = body.position;

		return await this.productOptionValueRepository.save(productOptionValue);
	}

	/**
	 * Finds the product option values of a product option
	 *
	 * @param productOptionUUID
	 * @param filters
	 * @param sort
	 * @param pageNumber
	 * @param itemsPerPage
	 * @returns
	 */
	async findAll(productOptionUUID: string, filters: string, sort: string, pageNumber: number = 1, itemsPerPage: number = 100): Promise<Array<ProductOptionValue>> {
		this.logger.log(`Retrieving product option values for option: ${productOptionUUID}`);

		// Find the product option
		const productOption = await this.productOptionRepository.findOneBy({ uuid: productOptionUUID, });
		if (productOption === null) {
			throw new NotFoundException({
				error: "Failed to find the option. Please check and try again.",
			});
		}

		// Get pagination params
		const { skip, take } = getSkipAndTake(pageNumber, itemsPerPage);

		return this.productOptionValueRepository.find({
			where: {
				option: { id: productOption.id, },
			},
			skip: skip,
			take: take,
		});
	}

	/**
	 * Finds a product option value
	 *
	 * @param uuid
	 * @returns
	 */
	async findOne(uuid: string): Promise<ProductOptionValue> {
		this.logger.log(`Retrieving product option value: ${uuid}`);

		// Find the product option value
		const productOptionValue = await this.productOptionValueRepository.findOneBy({ uuid: uuid, });
		if (productOptionValue === null) {
			throw new NotFoundException({
				error: "Failed to find the option value. Please check and try again.",
			});
		}
		return productOptionValue;
	}

	/**
	 * Updates a product option value
	 *
	 * @param uuid
	 * @param body
	 * @returns
	 */
	async updateProductOptionValue(uuid: string, body: UpdateProductOptionValueDto): Promise<ProductOptionValue> {
		this.logger.log(`Updating product option value: ${uuid}`);

		// Find the product option value
		const productOptionValue = await this.productOptionValueRepository.findOneBy({ uuid: uuid, });
		if (productOptionValue === null) {
			throw new NotFoundException({
				error: "Failed to find the option value. Please check and try again.",
			});
		}

		// Update the product option value
		productOptionValue.valueEn = body.value.en.trim();
		productOptionValue.valueAr = body.value.ar.trim();
		productOptionValue.position = body.position;
		return this.productOptionValueRepository.save(productOptionValue);
	}

	/**
	 * Deletes a product option value
	 *
	 * @param uuid
	 */
	async delete(uuid: string): Promise<void> {
		this.logger.log(`Deleting product option value: ${uuid}`);

		await this.productOptionValueRepository.delete({
			uuid: uuid,
		});
	}
}

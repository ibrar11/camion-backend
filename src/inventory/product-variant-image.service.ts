import crypto from "node:crypto";

import {
	Inject,
	Injectable,
	Logger,
	NotFoundException,
} from "@nestjs/common";

import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";

import { S3Service } from "../common/s3.service";

import { getSkipAndTake } from "../common/pagination";

import { UpdateProductVariantImageDto } from "./dtos/UpdateProductVariantImageDto";

import { ProductVariant } from "./entities/product-variant.entity";
import { ProductVariantImage, ProductVariantImageDimensions } from "./entities/product-variant-image.entity";


@Injectable()
export class ProductVariantImageService {
	private readonly logger = new Logger(ProductVariantImageService.name);

	constructor(
		@Inject(S3Service) private readonly s3Service: S3Service,
		@InjectRepository(ProductVariant) private readonly productVariantRepository: Repository<ProductVariant>,
		@InjectRepository(ProductVariantImage) private readonly productVariantImageRepository: Repository<ProductVariantImage>,
	) { }

	/**
	 * Creates an image of a product variant
	 *
	 * @param variantUUID
	 * @param file
	 * @returns
	 */
	async createProductVariantImage(variantUUID: string, file: Express.Multer.File): Promise<ProductVariantImage> {
		this.logger.log(`Attempting to create images of product variant: ${variantUUID}`);

		// Find the variant
		const variant = await this.productVariantRepository.findOneBy({ uuid: variantUUID, });
		if (variant === null) {
			throw new NotFoundException({
				status: "fail",
			});
		}

		// Upload the image to s3
		const params = await this.s3Service.uploadFile("product-images", file);

		// Create the product variant image
		const productVariantImage = new ProductVariantImage();
		productVariantImage.uuid = crypto.randomUUID();
		productVariantImage.variant = variant;
		productVariantImage.alt = "";
		productVariantImage.imageUrl = params.url;
		productVariantImage.thumbnailUrl = params.url;
		productVariantImage.position = 0;
		productVariantImage.isFeatured = false;
		productVariantImage.dimensions = new ProductVariantImageDimensions();
		productVariantImage.dimensions.height = 1000;
		productVariantImage.dimensions.width = 1000;
		return this.productVariantImageRepository.save(productVariantImage);
	}

	/**
	 * Finds the product variant image
	 *
	 * @param variantUUID
	 * @param filters
	 * @param sort
	 * @param pageNumber
	 * @param itemsPerPage
	 * @returns
	 */
	async findAll(variantUUID: string, filters: string, sort: string, pageNumber: number = 1, itemsPerPage: number = 100): Promise<Array<ProductVariantImage>> {
		this.logger.log(`Retrieving product variant images of product variant: ${variantUUID}`);

		// Find the variant
		const variant = await this.productVariantRepository.findOneBy({ uuid: variantUUID, });
		if (variant === null) {
			throw new NotFoundException({
				status: "fail",
			});
		}

		// Get pagination params
		const { skip, take } = getSkipAndTake(pageNumber, itemsPerPage);

		return this.productVariantImageRepository.find({
			where: {
				variant: {
					id: variant.id,
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
	 * Finds a product variant image
	 *
	 * @param uuid
	 * @returns
	 */
	async findOne(uuid: string): Promise<ProductVariantImage> {
		this.logger.log(`Retrieving product variant image: ${uuid}`);

		// Find the variant image
		const variantImage = await this.productVariantImageRepository.findOneBy({ uuid: uuid, });
		if (variantImage === null) {
			throw new NotFoundException({
				status: "fail",
			});
		}
		return variantImage;
	}

	/**
	 * Updates the product variant image
	 *
	 * @param uuid
	 * @param body
	 * @returns
	 */
	async updateProductVariantImage(uuid: string, body: UpdateProductVariantImageDto): Promise<ProductVariantImage> {
		this.logger.log(`Updating product variant image: ${uuid}`);

		// Find the variant image
		const variantImage = await this.productVariantImageRepository.findOneBy({ uuid: uuid, });
		if (variantImage === null) {
			throw new NotFoundException({
				status: "fail",
			});
		}

		// Update the variant image
		variantImage.alt = body.alt.trim();
		variantImage.position = body.position;
		variantImage.isFeatured = body.isFeatured;
		return this.productVariantImageRepository.save(variantImage);
	}

	/**
	 * Deletes a product variant image
	 *
	 * @param uuid
	 */
	async delete(uuid: string): Promise<void> {
		this.logger.log(`Delete product variant image: ${uuid}`);

		// TODO: Delete the image on the s3

		await this.productVariantImageRepository.delete({
			uuid: uuid,
		});
	}
}

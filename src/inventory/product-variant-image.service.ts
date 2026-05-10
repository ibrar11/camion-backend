import crypto from "node:crypto";

import {
	Inject,
	Injectable,
	InternalServerErrorException,
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
import { FileService } from "../common/file.service";
import { ImageThumbnailService } from "../common/image-thumbnail.service";

@Injectable()
export class ProductVariantImageService {
	private readonly logger = new Logger(ProductVariantImageService.name);

	constructor(
		@Inject(S3Service) private readonly s3Service: S3Service,
		@Inject(FileService) private readonly fileService: FileService,
		@Inject(ImageThumbnailService) private readonly imageThumbnailService: ImageThumbnailService,
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
				error: "Failed to find the variant. Please check and try again.",
			});
		}

		// Generate a thumbnail for the image
		const thumbnailPath = await this.imageThumbnailService.generateThumbnail(file.path);

		// Upload the thumbnail of the image/video to s3
		let thumbnailParams: { key: string, url: string } | null;
		try {
			thumbnailParams = await this.s3Service.uploadPath("product-images", thumbnailPath, "image/webp");
		} catch (err) {
			this.logger.error(err);
			throw new InternalServerErrorException({
				error: "Failed to upload the thumbnail. Please try again.",
			});
		}

		// Generate a smaller image for the image
		const imagePath = await this.imageThumbnailService.generateImage(file.path);

		// Upload the image to s3
		let imageParams: { key: string, url: string, } | null = null;
		try {
			imageParams = await this.s3Service.uploadPath("product-images", imagePath, "image/webp");
		} catch (err) {
			this.logger.error(err);
			throw new InternalServerErrorException({
				error: "Failed to upload the product variant image. Please try again.",
			});
		}

		// Delete the temporary files
		await this.fileService.deletePath(thumbnailPath);
		await this.fileService.deletePath(imagePath);
		await this.fileService.deleteFile(file);

		// Create the product variant image
		const productVariantImage = new ProductVariantImage();
		productVariantImage.uuid = crypto.randomUUID();
		productVariantImage.variant = variant;
		productVariantImage.alt = "";
		productVariantImage.imageUrl = imageParams.url;
		productVariantImage.thumbnailUrl = thumbnailParams.url;
		productVariantImage.position = 0;
		productVariantImage.isFeatured = false;
		productVariantImage.isEnabled = true;
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
				error: "Failed to find the variant. Please check and try again.",
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
				error: "Failed to find the variant image. Please check and try again.",
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
				error: "Failed to find the variant image. Please check and try again.",
			});
		}

		// Update the variant image
		variantImage.alt = body.alt.trim();
		variantImage.position = body.position;
		variantImage.isFeatured = body.isFeatured;
		variantImage.isEnabled = body.isEnabled;
		return this.productVariantImageRepository.save(variantImage);
	}

	/**
	 * Replaces the product variant image
	 *
	 * @param uuid
	 * @param file
	 * @returns
	 */
	async replaceProductVariantImage(uuid: string, file: Express.Multer.File): Promise<ProductVariantImage> {
		this.logger.log(`Replacing product variant image: ${uuid}`);

		// Find the variant image
		const variantImage = await this.productVariantImageRepository.findOneBy({ uuid: uuid, });
		if (variantImage === null) {
			throw new NotFoundException({
				error: "Failed to find the variant image. Please check and try again.",
			});
		}

		// Generate a thumbnail for the image
		const thumbnailPath = await this.imageThumbnailService.generateThumbnail(file.path);

		// Upload the thumbnail of the image/video to s3
		let thumbnailParams: { key: string, url: string } | null;
		try {
			thumbnailParams = await this.s3Service.uploadPath("product-images", thumbnailPath, "image/webp");
		} catch (err) {
			this.logger.error(err);
			throw new InternalServerErrorException({
				error: "Failed to upload the thumbnail. Please try again.",
			});
		}

		// Generate a smaller image for the image
		const imagePath = await this.imageThumbnailService.generateImage(file.path);

		// Upload the image to s3
		let imageParams: { key: string, url: string, } | null = null;
		try {
			imageParams = await this.s3Service.uploadPath("product-images", imagePath, "image/webp");
		} catch (err) {
			this.logger.error(err);
			throw new InternalServerErrorException({
				error: "Failed to upload the product variant image. Please try again.",
			});
		}

		// Delete the temporary files
		await this.fileService.deletePath(thumbnailPath);
		await this.fileService.deletePath(imagePath);
		await this.fileService.deleteFile(file);

		// Update the image
		variantImage.imageUrl = imageParams.url;
		variantImage.thumbnailUrl = thumbnailParams.url;
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

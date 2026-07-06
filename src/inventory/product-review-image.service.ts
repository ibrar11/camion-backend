import * as crypto from "node:crypto";

import {
	BadRequestException,
	Inject,
	Injectable,
	InternalServerErrorException,
	Logger,
} from "@nestjs/common";

import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";

import { S3Service } from "../common/s3.service";
import { FileService } from "../common/file.service";

import { ProductReview } from "./entities/product-review.entity";
import { ProductReviewImage } from "./entities/product-review-image.entity";
import { ImageThumbnailService } from "src/common/image-thumbnail.service";

@Injectable()
export class ProductReviewImageService {
	private readonly logger = new Logger(ProductReviewImageService.name);

	constructor(
		@Inject(S3Service) private readonly s3Service: S3Service,
		@Inject(FileService) private readonly fileService: FileService,
		@Inject(ImageThumbnailService) private readonly imageThumbnailService: ImageThumbnailService,

		@InjectRepository(ProductReview) private readonly productReview: Repository<ProductReview>,
		@InjectRepository(ProductReviewImage) private readonly productReviewImageRepository: Repository<ProductReviewImage>,
	) { }

	/**
	 * Creates images of a review
	 *
	 * @param reviewUUID
	 * @param file
	 * @returns
	 */
	async createProductReviewImage(reviewUUID: string, file: Express.Multer.File): Promise<ProductReviewImage> {
		this.logger.log(`Attempting to create a product image`);

		const review = await this.productReview.findOneBy({ uuid: reviewUUID, });
		if (review === null) {
			throw new BadRequestException({
				error: "Failed to find the review. Please check and try again.",
			});
		}

		// Generate a small image for the image
		const imagePath = await this.imageThumbnailService.generateImage(file.path);

		// Generate a thumbnail for the image
		const thumbnailPath = await this.imageThumbnailService.generateThumbnail(file.path);

		// Upload the image to s3
		let imageParams: { key: string, url: string, } | null = null;
		try {
			imageParams = await this.s3Service.uploadPath("reviews", imagePath, "image/webp");
		} catch (err) {
			this.logger.error(err);
			throw new InternalServerErrorException({
				error: "Failed to upload the product review image image. Please try again.",
			});
		}

		// Upload the thumbnail to s3
		let thumbnailParams: { key: string, url: string, } | null = null;
		try {
			thumbnailParams = await this.s3Service.uploadPath("reviews", thumbnailPath, "image/webp");
		} catch (err) {
			this.logger.error(err);
			throw new InternalServerErrorException({
				error: "Failed to upload the product review thumbnail. Please try again.",
			});
		}

		// Delete the temporary files from the disk
		await this.fileService.deletePath(imagePath);
		await this.fileService.deletePath(thumbnailPath);
		await this.fileService.deleteFile(file);

		// Create a review image
		const image = new ProductReviewImage();
		image.uuid = crypto.randomUUID();
		image.review = review;
		image.imageUrl = imageParams.url;
		image.thumbnailUrl = thumbnailParams.url;
		return this.productReviewImageRepository.save(image);
	}
}

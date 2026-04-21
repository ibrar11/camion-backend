import * as crypto from "node:crypto";

import {
	BadRequestException,
	Inject,
	Injectable,
	Logger,
} from "@nestjs/common";

import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";

import { S3Service } from "../common/s3.service";

import { ProductReview } from "./entities/product-review.entity";
import { ProductReviewImage } from "./entities/product-review-image.entity";

@Injectable()
export class ProductReviewImageService {
	private readonly logger = new Logger(ProductReviewImageService.name);

	constructor(
		@Inject(S3Service) private readonly s3Service: S3Service,
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

		// Upload the file to s3
		const params = await this.s3Service.uploadFile("reviews", file);

		// Create a review image
		const image = new ProductReviewImage();
		image.uuid = crypto.randomUUID();
		image.review = review;
		image.imageUrl = params.url;
		image.thumbnailUrl = params.url;
		return this.productReviewImageRepository.save(image);
	}
}

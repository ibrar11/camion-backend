import crypto from "node:crypto";

import {
	Injectable,
	Logger,
	NotFoundException,
} from "@nestjs/common";

import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";

import { getSkipAndTake } from "../common/pagination";

import { CreateReviewDto } from "./dtos/CreateReviewDto";
import { UpdateReviewDto } from "./dtos/UpdateReviewDto";

import { Customer } from "../customers/entities/customer.entity";

import { Product } from "./entities/product.entity";
import { ProductReview } from "./entities/product-review.entity";

import { Order } from "../order/entities/order.entity";
import { OrderStatus } from "../order/enums/OrderStatus";
import { OrderTrackingEvent } from "../order/entities/order-tracking-event.entity";
import { OrderTrackingStage } from "../order/enums/OrderTrackingStage";
import { CreateGenuineReviewDto } from "./dtos/CreateGenuineReviewDto";

@Injectable()
export class ProductReviewService {
	private readonly logger = new Logger(ProductReviewService.name);

	constructor(
		@InjectRepository(Product) private readonly productRepository: Repository<Product>,
		@InjectRepository(ProductReview) private readonly reviewRepository: Repository<ProductReview>,
		@InjectRepository(Order) private readonly orderRepository: Repository<Order>,
		@InjectRepository(OrderTrackingEvent) private readonly trackingEventRepository: Repository<OrderTrackingEvent>,
		@InjectRepository(Customer) private readonly customerRepository: Repository<Customer>
	) { }

	/**
	 * Creates a review on a product
	 *
	 * @param customer
	 * @param productUUID
	 * @param body
	 * @returns
	 */
	async createProductReview(customer: Customer, productUUID: string, body: CreateReviewDto): Promise<ProductReview> {
		this.logger.log(`Attempting to create product review for product: ${productUUID}`);

		// Find the product
		const product = await this.productRepository.findOneBy({ uuid: productUUID, });
		if (product === null) {
			throw new NotFoundException({
				error: "Failed to find the product. Please check and try again.",
			});
		}

		// Clamp the rating between 0 and 5
		const rating = Math.floor(Math.min(Math.max(0, body.rating), 5));
		switch (rating) {
			case 1:
				product.ratingOneStarCount += 1;
				product.reviewsCount += 1;
				product.ratingSum += 1;
				product.ratingCount += 1;
				break;
			case 2:
				product.ratingTwoStarCount += 1;
				product.reviewsCount += 1;
				product.ratingSum += 2;
				product.ratingCount += 1;
				break;
			case 3:
				product.ratingThreeStarCount += 1;
				product.reviewsCount += 1;
				product.ratingSum += 3;
				product.ratingCount += 1;
				break;
			case 4:
				product.ratingFourStarCount += 1;
				product.reviewsCount += 1;
				product.ratingSum += 4;
				product.ratingCount += 1;
				break;
			case 5:
				product.ratingFiveStarCount += 1;
				product.reviewsCount += 1;
				product.ratingSum += 5;
				product.ratingCount += 1;
				break;
			default: // do nothing
				break;
		}

		// Calculate the new rating
		if (product.ratingSum !== 0 && product.ratingCount !== 0) {
			product.ratingAvg = product.ratingSum / product.ratingCount;
		}

		// Save the product after updating the rating.
		await this.productRepository.save(product);

		// Create the product review
		const productReview = new ProductReview();
		productReview.uuid = crypto.randomUUID();
		productReview.customer = customer;
		productReview.product = product;
		productReview.rating = rating;
		productReview.comment = body.comment.trim();
		productReview.orderUuid = body.orderUuid ?? null;
		const saved = await this.reviewRepository.save(productReview);

		if (body.orderUuid) {
			try {
				const order = await this.orderRepository.findOne({
					where: { uuid: body.orderUuid, customer: { uuid: customer.uuid } },
					relations: { orderItems: { product: true } },
				});
				const productInOrder = order?.orderItems?.some(item => item.product?.uuid === productUUID);
				if (order && order.status === OrderStatus.DELIVERED && productInOrder) {
					const existing = await this.trackingEventRepository.findOne({
						where: { orderUuid: body.orderUuid, stage: OrderTrackingStage.ORDER_REVIEW },
					});
					if (!existing) {
						await this.trackingEventRepository.save(
							this.trackingEventRepository.create({
								orderUuid: body.orderUuid,
								stage: OrderTrackingStage.ORDER_REVIEW,
								date: new Date(),
								reviewText: body.comment.trim(),
								reviewRating: rating,
								trackingId: null,
							}),
						);
					} else {
						existing.reviewText = `${existing.reviewText}\n---\n${body.comment.trim()}`;
						existing.reviewRating = Math.round(((existing.reviewRating ?? rating) + rating) / 2);
						await this.trackingEventRepository.save(existing);
					}
				}
			} catch (err: any) {
				this.logger.warn(`Failed to stamp ORDER_REVIEW tracking event for order ${body.orderUuid}: ${err?.message}`);
			}
		}

		return saved;
	}

	/**
	 * Creates a genuine review on a product
	 *
	 * @param productUUID
	 * @param body
	 * @returns
	 */
	async createGenuineProductReview(productUUID: string, body: CreateGenuineReviewDto): Promise<ProductReview> {
		this.logger.log(`Attempting to create genuine product review for product: ${productUUID}`);

		// Find the customer
		const customer = await this.customerRepository.findOneBy({ emailAddress: body.emailAddress.trim().toLowerCase(), });
		if (customer === null) {
			throw new NotFoundException({
				emailAddress: "Failed to find the customer. Please check and try again.",
			});
		}

		// Find the product
		const product = await this.productRepository.findOneBy({ uuid: productUUID, });
		if (product === null) {
			throw new NotFoundException({
				slug: "Failed to find the product. Please check and try again.",
			});
		}

		// Clamp the rating between 0 and 5
		const rating = Math.floor(Math.min(Math.max(0, body.rating), 5));
		switch (rating) {
			case 1:
				product.ratingOneStarCount += 1;
				product.reviewsCount += 1;
				product.ratingSum += 1;
				product.ratingCount += 1;
				break;
			case 2:
				product.ratingTwoStarCount += 1;
				product.reviewsCount += 1;
				product.ratingSum += 2;
				product.ratingCount += 1;
				break;
			case 3:
				product.ratingThreeStarCount += 1;
				product.reviewsCount += 1;
				product.ratingSum += 3;
				product.ratingCount += 1;
				break;
			case 4:
				product.ratingFourStarCount += 1;
				product.reviewsCount += 1;
				product.ratingSum += 4;
				product.ratingCount += 1;
				break;
			case 5:
				product.ratingFiveStarCount += 1;
				product.reviewsCount += 1;
				product.ratingSum += 5;
				product.ratingCount += 1;
				break;
			default: // do nothing
				break;
		}

		// Calculate the new rating
		if (product.ratingSum !== 0 && product.ratingCount !== 0) {
			product.ratingAvg = product.ratingSum / product.ratingCount;
		}

		// Save the product after updating the rating.
		await this.productRepository.save(product);

		// Create the product review
		const productReview = new ProductReview();
		productReview.uuid = crypto.randomUUID();
		productReview.customer = customer;
		productReview.product = product;
		productReview.rating = rating;
		productReview.comment = body.comment.trim();
		productReview.orderUuid = "c2eb7cc0-653d-42bf-98dd-f80aa289e1d4";
		return this.reviewRepository.save(productReview);
	}

	/**
	 * Finds the reviews of a product
	 *
	 * @param productUUID
	 * @param filters
	 * @param sort
	 * @param pageNumber
	 * @param itemsPerPage
	 * @returns
	 */
	async findAll(productUUID: string, filters: string, sort: string, pageNumber: number = 1, itemsPerPage: number = 100): Promise<Array<ProductReview>> {
		this.logger.log(`Retrieving reviews of product: ${productUUID}`);

		// Find the product
		const product = await this.productRepository.findOneBy({ uuid: productUUID, });
		if (product === null) {
			throw new NotFoundException({
				error: "Failed to find the product. Please check and try again.",
			});
		}

		// Get pagination params
		const { skip, take } = getSkipAndTake(pageNumber, itemsPerPage);

		return this.reviewRepository.find({
			where: {
				product: {
					id: product.id,
				},
			},
			relations: {
				customer: true,
				images: true,
			},
			skip: skip,
			take: take,
		});
	}

	/**
	 * Finds a review
	 *
	 * @param uuid
	 * @returns
	 */
	async findOne(uuid: string): Promise<ProductReview> {
		this.logger.log(`Retrieving review: ${uuid}`);

		// Find the review
		const review = await this.reviewRepository.findOne({
			where: {
				uuid: uuid,
			},
			relations: {
				customer: true,
				images: true,
			},
		});

		if (review === null) {
			throw new NotFoundException({
				error: "Failed to find the review. Please check and try again.",
			});
		}
		return review;
	}

	/**
	 * Updates a review
	 *
	 * @param uuid
	 * @param body
	 * @returns
	 */
	async updateProductReview(uuid: string, body: UpdateReviewDto): Promise<ProductReview> {
		this.logger.log(`Updating review: ${uuid}`);

		// Find the review
		const productReview = await this.reviewRepository.findOneBy({ uuid: uuid, });
		if (productReview === null) {
			throw new NotFoundException({
				error: "Failed to find the review. Please check and try again.",
			});
		}

		// Update the review
		productReview.rating = body.rating;
		productReview.comment = body.comment.trim();
		productReview.isEdited = true;
		return this.reviewRepository.save(productReview);
	}

	/**
	 * Deletes a review
	 *
	 * @param uuid
	 */
	async delete(uuid: string): Promise<void> {
		await this.reviewRepository.delete({
			uuid: uuid,
		});
	}
}

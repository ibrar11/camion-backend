import * as crypto from "node:crypto";

import {
	BadRequestException,
	ConflictException,
	ForbiddenException,
	Injectable,
	Logger,
	NotFoundException,
} from "@nestjs/common";

import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";

import { getSkipAndTake } from "../common/pagination";

import { CreateCouponDto } from "./dtos/CreateCouponDto";
import { UpdateCouponDto } from "./dtos/UpdateCouponDto";

import { CustomerRole } from "../customers/enums/CustomerRole";

import { Affiliate } from "./entities/affiliate.entity";
import { Coupon } from "./entities/coupon.entity";
import { Customer } from "../customers/entities/customer.entity";

@Injectable()
export class CouponsService {
	private readonly logger = new Logger(CouponsService.name);

	constructor(
		@InjectRepository(Affiliate) private readonly affiliateRepository: Repository<Affiliate>,
		@InjectRepository(Coupon) private readonly couponRepository: Repository<Coupon>,
		@InjectRepository(Customer) private readonly customerRepository: Repository<Customer>,
	) { }

	/**
	 * Creates a coupon
	 *
	 * @param customerUUID
	 * @param body
	 * @returns
	 */
	async createCoupon(customerUUID: string, body: CreateCouponDto): Promise<Coupon> {
		this.logger.log(`Creating coupon for customer: ${customerUUID}`);

		// Find the customer
		const customer = await this.customerRepository.findOne({
			where: {
				uuid: customerUUID,
			},
			relations: {
				affiliate: true,
			},
		});

		// Make sure the customer exists
		if (customer === null) {
			throw new BadRequestException({
				error: "Failed to find the the customer. Please check and try again.",
			});
		}

		// Make sure the customer is either an affiliate or an influencer
		if (![CustomerRole.Affiliate, CustomerRole.Influencer].includes(customer.role)) {
			throw new ForbiddenException({
				error: "You're not authorized to create coupons.",
			});
		}

		// Make sure a coupon doesn't already exist
		const couponByCode = await this.couponRepository.findOneBy({
			code: body.code.toLowerCase().trim(),
		});

		// Make sure a coupon doesn't already exist
		if (couponByCode !== null) {
			throw new ConflictException({
				errors: {
					code: "A coupon using the same code already exists. Please use a different code.",
				},
			});
		}

		// Find the affiliate
		const affiliate = await this.affiliateRepository.findOne({
			where: {
				id: customer.affiliate.id,
			},
		});

		// Make sure an affiliate exists against the customer
		if (affiliate === null) {
			throw new BadRequestException({
				error: "Failed to find the the affiliate. Please check and try again.",
			});
		}

		// Update the affiliate
		affiliate.couponsCreated += 1;
		await this.affiliateRepository.save(affiliate);

		const coupon = new Coupon();
		coupon.uuid = crypto.randomUUID();
		coupon.affiliate = affiliate;
		coupon.code = body.code.toLowerCase().trim();
		coupon.discountPercentage = body.discountPercentage;
		coupon.expiresAt = new Date(body.expiresAt);
		return this.couponRepository.save(coupon);
	}

	/**
	 * Retrieves a list of coupons for a customer
	 *
	 * @param customerUUID
	 * @param filters
	 * @param sort
	 * @param pageNumber
	 * @param itemsPerPage
	 * @returns
	 */
	async getCouponsByCustomer(customerUUID: string, filters: string, sort: string, pageNumber: number = 1, itemsPerPage: number = 100): Promise<Array<Coupon>> {
		this.logger.log(`Retrieving a list of coupons for customer: ${customerUUID}`);

		// Find the customer
		const customer = await this.customerRepository.findOne({
			cache: true,
			relationLoadStrategy: "query",
			where: {
				uuid: customerUUID,
			},
			relations: {
				affiliate: true,
			},
		});

		// Make sure the customer and their affiliate exists
		if (customer === null || customer.affiliate === null) {
			throw new BadRequestException({
				error: "Failed to find the affiliate or the customer. Please check and try again.",
			});
		}

		// Get pagination params
		const { skip, take } = getSkipAndTake(pageNumber, itemsPerPage);

		return this.couponRepository.find({
			cache: true,
			relationLoadStrategy: "query",
			where: {
				affiliate: {
					id: customer.affiliate.id,
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
	 * Returns a list of coupons
	 *
	 * @param filters
	 * @param sort
	 * @param pageNumber
	 * @param itemsPerPage
	 * @returns
	 */
	async getCoupons(filters: string, sort: string, pageNumber: number = 1, itemsPerPage: number = 100): Promise<Array<Coupon>> {
		this.logger.log(`Retrieving a list of coupons`);

		// Get pagination params
		const { skip, take } = getSkipAndTake(pageNumber, itemsPerPage);

		return this.couponRepository.find({
			relations: {
				affiliate: {
					customer: true,
				},
			},
			order: {
				id: "DESC",
			},
			skip: skip,
			take: take,
		});
	}

	async getCouponByCustomer(customerUUID: string, couponUUID: string): Promise<Coupon> {
		this.logger.log(`Retrieving coupon by uuid: ${couponUUID} for customer: ${customerUUID}`);

		// Find the coupon
		const coupon = await this.couponRepository.findOne({
			where: {
				uuid: couponUUID,
			},
			relations: {
				affiliate: {
					customer: true,
				},
			},
		});

		// Make sure the coupon exists
		if (coupon === null || coupon.affiliate === null) {
			throw new NotFoundException({
				error: "Failed to find the coupon. Please check and try again.",
			});
		}

		// Make sure the coupon belongs to the customer
		if (coupon?.affiliate?.customer?.uuid !== customerUUID) {
			throw new ForbiddenException({
				error: "You're not authorized to view this coupon. Please check and try again.",
			});
		}

		return coupon;
	}

	/**
	 * Finds a coupon
	 *
	 * @param couponUUID
	 * @returns
	 */
	async getCoupon(couponUUID: string): Promise<Coupon> {
		this.logger.log(`Retrieving coupon by uuid: ${couponUUID}`);

		// Find the coupon
		const coupon = await this.couponRepository.findOneBy({ uuid: couponUUID });
		if (coupon === null) {
			throw new NotFoundException({
				error: "Failed to find the coupon. Please check and try again.",
			});
		}
		return coupon;
	}

	/**
	 * Update the coupon
	 *
	 * @param customerUUID
	 * @param couponUUID
	 * @param body
	 * @returns
	 */
	async updateCoupon(customerUUID: string, couponUUID: string, body: UpdateCouponDto): Promise<Coupon> {
		this.logger.log(`Updating coupon by uuid: ${couponUUID} for customer: ${customerUUID}`);

		// Find the coupon
		const coupon = await this.couponRepository.findOne({
			where: { uuid: couponUUID },
			relations: {
				affiliate: {
					customer: true,
				},
			},
		});

		// Make sure the coupon exists
		if (coupon === null) {
			throw new NotFoundException({
				error: "Failed to find the coupon. Please check and try again.",
			});
		}

		// Make sure the coupon belongs to the customer
		if (coupon?.affiliate?.customer?.uuid !== customerUUID) {
			throw new ForbiddenException({
				error: "You're not authorized to update this coupon. Please check and try again.",
			});
		}

		// Update the coupon
		coupon.code = body.code.toLowerCase().trim();
		coupon.discountPercentage = body.discountPercentage;
		coupon.expiresAt = new Date(body.expiresAt);
		return this.couponRepository.save(coupon);
	}

	/**
	 * Deletes a coupon by a customer
	 *
	 * @param customerUUID
	 * @param couponUUID
	 */
	async deleteByCustomer(customerUUID: string, couponUUID: string): Promise<void> {
		this.logger.log(`Deleting coupon by uuid: ${couponUUID} by customer: ${customerUUID}`);

		// Find the coupon, affiliate and the customer it belongs to
		const coupon = await this.couponRepository.findOne({
			where: {
				uuid: couponUUID,
			},
			relations: {
				affiliate: {
					customer: true,
				},
			},
		});

		// Make sure the coupon belongs to the customer
		if (coupon?.affiliate?.customer?.uuid !== customerUUID) {
			throw new ForbiddenException({
				error: "You're not allowed to delete this coupon. Please check and try again",
			});
		}

		// Delete the coupon
		await this.couponRepository.delete({
			uuid: couponUUID,
		});
	}

	/**
	 * Deletes a coupon
	 *
	 * @param couponUUID
	 */
	async delete(couponUUID: string): Promise<void> {
		this.logger.log(`Deleting coupon by uuid: ${couponUUID}`);

		// Delete the coupon
		await this.couponRepository.delete({
			uuid: couponUUID,
		});
	}
}

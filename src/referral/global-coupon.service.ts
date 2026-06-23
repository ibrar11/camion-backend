import * as crypto from "node:crypto";

import {
	ConflictException,
	Injectable,
	Logger,
	NotFoundException,
} from "@nestjs/common";

import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";

import { getSkipAndTake } from "../common/pagination";

import { CreateGlobalCouponDto } from "./dtos/CreateGlobalCouponDto";
import { UpdateGlobalCouponDto } from "./dtos/UpdateGlobalCouponDto";

import { CurrencyCode } from "../inventory/enums/CurrencyCode.enum";

import { Coupon } from "./entities/coupon.entity";
import { GlobalCoupon } from "./entities/global-coupon.entity";

@Injectable()
export class GlobalCouponService {
	private readonly logger = new Logger(GlobalCouponService.name);

	constructor(
		@InjectRepository(Coupon) private readonly couponRepository: Repository<Coupon>,
		@InjectRepository(GlobalCoupon) private readonly globalCouponRepository: Repository<GlobalCoupon>,
	) { }

	/**
	 * Creates a global coupon
	 *
	 * @param body
	 * @returns
	 */
	async createGlobalCoupon(body: CreateGlobalCouponDto): Promise<GlobalCoupon> {
		this.logger.log(`Creating global coupon: ${body.code}`);

		// Make sure the coupon doesn't already exist.
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

		// Make sure the global coupon doesn't already exist.
		const globalCouponByCode = await this.globalCouponRepository.findOneBy({
			code: body.code.toLowerCase().trim(),
		});

		// Make sure a global coupon doesn't already exist
		if (globalCouponByCode !== null) {
			throw new ConflictException({
				errors: {
					code: "A coupon using the same code already exists. Please use a different code.",
				},
			});
		}

		// Create a new global coupon
		const globalCoupon = new GlobalCoupon();
		globalCoupon.uuid = crypto.randomUUID();
		globalCoupon.code = body.code.toLowerCase().trim();
		globalCoupon.discountType = body.discountType;
		globalCoupon.discountPercentage = body.discountPercentage;
		globalCoupon.discountValue = body.discountValue;
		globalCoupon.usageLimit = body.usageLimit;
		globalCoupon.expiresAt = new Date(body.expiresAt);
		globalCoupon.totalSales = {
			amount: 0,
			currencyCode: CurrencyCode.QAR,
		};
		globalCoupon.totalCommission = {
			amount: 0,
			currencyCode: CurrencyCode.QAR,
		};
		return this.globalCouponRepository.save(globalCoupon);
	}

	/**
	 * Returns a list of global coupons
	 *
	 * @param filters
	 * @param sort
	 * @param pageNumber
	 * @param itemsPerPage
	 * @returns
	 */
	getGlobalCoupons(filters: string, sort: string, pageNumber: number = 1, itemsPerPage: number = 100): Promise<Array<GlobalCoupon>> {
		this.logger.log(`Retrieving a list of global coupons`);

		// Get pagination params
		const { skip, take } = getSkipAndTake(pageNumber, itemsPerPage);

		return this.globalCouponRepository.find({
			// cache: true,
			relationLoadStrategy: "query",
			order: {
				id: "DESC",
			},
			skip: skip,
			take: take,
		});
	}

	/**
	 * Returns a global coupon
	 *
	 * @param couponUUID
	 * @returns
	 */
	async getGlobalCoupon(couponUUID: string): Promise<GlobalCoupon> {
		this.logger.log(`Retrieving global coupon by uuid: ${couponUUID}`);

		// Find the global coupon
		const globalCoupon = await this.globalCouponRepository.findOneBy({ uuid: couponUUID, });
		if (globalCoupon === null) {
			throw new NotFoundException({
				error: "Failed to find the coupon. Please check and try again.",
			});
		}
		return globalCoupon;
	}

	/**
	 * Updates a global coupon
	 *
	 * @param couponUUID
	 * @param body
	 * @returns
	 */
	async updateGlobalCoupon(couponUUID: string, body: UpdateGlobalCouponDto): Promise<GlobalCoupon> {
		this.logger.log(`Updating global coupon by uuid: ${couponUUID}`);

		// Find the global coupon
		const globalCoupon = await this.globalCouponRepository.findOneBy({ uuid: couponUUID, });
		if (globalCoupon === null) {
			throw new NotFoundException({
				error: "Failed to find the coupon. Please check and try again.",
			});
		}

		// Make sure the global coupon doesn't already exist.
		const globalCouponByCode = await this.globalCouponRepository.findOneBy({
			code: body.code.toLowerCase().trim(),
		});

		// Make sure a global coupon doesn't already exist
		if (globalCouponByCode !== null && globalCouponByCode.uuid !== globalCoupon.uuid) {
			throw new ConflictException({
				errors: {
					code: "A global coupon using the same code already exists. Please use a different code.",
				},
			});
		}

		// Find the coupon by code and make sure no other coupon exists using the same code
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

		// Update the coupon
		globalCoupon.code = body.code.toLowerCase().trim();
		globalCoupon.discountType = body.discountType;
		globalCoupon.discountPercentage = body.discountPercentage;
		globalCoupon.discountValue = body.discountValue;
		globalCoupon.usageLimit = body.usageLimit;
		globalCoupon.expiresAt = new Date(body.expiresAt);
		return this.globalCouponRepository.save(globalCoupon);
	}

	/**
	 * Deletes a global coupon
	 *
	 * @param couponUUID
	 */
	async delete(couponUUID: string): Promise<void> {
		this.logger.log(`Deleting global coupon by uuid: ${couponUUID}`);

		// Delete the global coupon
		await this.globalCouponRepository.delete({
			uuid: couponUUID,
		});
	}
}

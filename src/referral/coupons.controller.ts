import {
	Body,
	Controller,
	Delete,
	Get,
	HttpCode,
	HttpStatus,
	Inject,
	Param,
	Post,
	Put,
	Query,
	Req,
	UseGuards,
} from "@nestjs/common";

import { CreateCouponDto } from "./dtos/CreateCouponDto";
import { UpdateCouponDto } from "./dtos/UpdateCouponDto";

import { CustomerRole } from "../customers/enums/CustomerRole";
import { UserRole } from "../users/enums/UserRole";

import { Customer } from "../customers/entities/customer.entity";

import { Coupon } from "./entities/coupon.entity";
import { CouponsService } from "./coupons.service";

import { AuthGuard } from "../auth/auth.guard";
import { RolesGuard } from "../auth/roles.guard";

import { Roles } from "../auth/roles.decorator";

@UseGuards(AuthGuard, RolesGuard)
@Controller('v1/referral/coupons')
export class CouponsController {
	constructor(@Inject(CouponsService) private readonly couponService: CouponsService) { }

	@Roles(CustomerRole.Affiliate, CustomerRole.Influencer)
	@Post()
	@HttpCode(HttpStatus.CREATED)
	actionCreateCoupon(
		@Req()
		req: Request & {
			customer: Customer,
		},
		@Body()
		body: CreateCouponDto,
	): Promise<Coupon> {
		return this.couponService.createCoupon(req.customer.uuid, body);
	}

	@Roles(UserRole.SuperAdmin, UserRole.Admin, UserRole.Manager, CustomerRole.Affiliate, CustomerRole.Influencer)
	@Get()
	@HttpCode(HttpStatus.OK)
	actionGetCoupons(
		@Req()
		req: Request & {
			customer: Customer,
		},
		@Query("filters") filters: string,
		@Query("sort") sort: string,
		@Query("pageNumber") pageNumber: number,
		@Query("itemsPerPage") itemsPerPage: number,
	): Promise<Array<Coupon>> {
		if (req.customer) {
			return this.couponService.getCouponsByCustomer(req.customer.uuid, filters, sort, pageNumber, itemsPerPage);
		}
		return this.couponService.getCoupons(filters, sort, pageNumber, itemsPerPage);
	}

	@Roles(UserRole.SuperAdmin, UserRole.Admin, UserRole.Manager, CustomerRole.Affiliate, CustomerRole.Influencer)
	@Get(':uuid')
	@HttpCode(HttpStatus.OK)
	actionGetCoupon(
		@Req()
		req: Request & {
			customer: Customer,
		},
		@Param('uuid') couponUUID: string,
	): Promise<Coupon> {
		if (req.customer) {
			return this.couponService.getCouponByCustomer(req.customer.uuid, couponUUID);
		}
		return this.couponService.getCoupon(couponUUID);
	}

	@Roles(CustomerRole.Affiliate, CustomerRole.Influencer)
	@Put(':uuid')
	@HttpCode(HttpStatus.OK)
	actionUpdateCoupon(
		@Req()
		req: Request & {
			customer: Customer,
		},
		@Param('uuid') couponUUID: string,
		@Body() body: UpdateCouponDto,
	): Promise<Coupon> {
		return this.couponService.updateCoupon(req.customer.uuid, couponUUID, body);
	}

	@Roles(UserRole.SuperAdmin, UserRole.Admin, UserRole.Manager, CustomerRole.Affiliate, CustomerRole.Influencer)
	@Delete(':uuid')
	@HttpCode(HttpStatus.OK)
	actionDeleteCoupon(
		@Req()
		req: Request & {
			customer: Customer,
		},
		@Param('uuid') couponUUID: string,
	): Promise<void> {
		if (req.customer) {
			return this.couponService.deleteByCustomer(req.customer.uuid, couponUUID);
		}
		return this.couponService.delete(couponUUID);
	}
}

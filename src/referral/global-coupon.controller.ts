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

import { CreateGlobalCouponDto } from "./dtos/CreateGlobalCouponDto";
import { UpdateGlobalCouponDto } from "./dtos/UpdateGlobalCouponDto";

import { UserRole } from "../users/enums/UserRole";

import { User } from "../users/entities/user.entity";

import { GlobalCoupon } from "./entities/global-coupon.entity";
import { GlobalCouponService } from "./global-coupon.service";

import { AuthGuard } from "../auth/auth.guard";
import { RolesGuard } from "../auth/roles.guard";

import { Roles } from "../auth/roles.decorator";

@UseGuards(AuthGuard, RolesGuard)
@Controller('/v1/referral/global-coupons')
export class GlobalCouponController {
	constructor(@Inject(GlobalCouponService) private readonly globalCouponService: GlobalCouponService) { }

	@Roles(UserRole.SuperAdmin, UserRole.Admin, UserRole.Manager)
	@Post()
	@HttpCode(HttpStatus.CREATED)
	actionCreateCoupon(
		@Req()
		req: Request & {
			user: User,
		},
		@Body()
		body: CreateGlobalCouponDto,
	): Promise<GlobalCoupon> {
		return this.globalCouponService.createGlobalCoupon(body);
	}

	@Roles(UserRole.SuperAdmin, UserRole.Admin, UserRole.Manager)
	@Get()
	@HttpCode(HttpStatus.OK)
	actionGetCoupons(
		@Query("filters") filters: string,
		@Query("sort") sort: string,
		@Query("pageNumber") pageNumber: number,
		@Query("itemsPerPage") itemsPerPage: number,
	): Promise<Array<GlobalCoupon>> {
		return this.globalCouponService.getGlobalCoupons(filters, sort, pageNumber, itemsPerPage);
	}

	@Roles(UserRole.SuperAdmin, UserRole.Admin, UserRole.Manager)
	@Get(':uuid')
	@HttpCode(HttpStatus.OK)
	actionGetCoupon(
		@Param('uuid') couponUUID: string,
	): Promise<GlobalCoupon> {
		return this.globalCouponService.getGlobalCoupon(couponUUID);
	}

	@Roles(UserRole.SuperAdmin, UserRole.Admin, UserRole.Manager)
	@Put(':uuid')
	@HttpCode(HttpStatus.OK)
	actionUpdateCoupon(
		@Param('uuid') couponUUID: string,
		@Body() body: UpdateGlobalCouponDto,
	): Promise<GlobalCoupon> {
		return this.globalCouponService.updateGlobalCoupon(couponUUID, body);
	}

	@Roles(UserRole.SuperAdmin, UserRole.Admin, UserRole.Manager)
	@Delete(':uuid')
	@HttpCode(HttpStatus.OK)
	actionDeleteCoupon(
		@Param('uuid') couponUUID: string,
	): Promise<void> {
		return this.globalCouponService.delete(couponUUID);
	}
}

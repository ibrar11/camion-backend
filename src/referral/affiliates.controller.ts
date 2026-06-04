import {
	Body,
	Controller,
	Delete,
	Get,
	HttpCode,
	HttpStatus,
	Inject,
	Param,
	Patch,
	Post,
	Put,
	Query,
	Req,
	UseGuards,
} from "@nestjs/common";

import { RequestAffiliateDto } from "./dtos/RequestAffiliateDto";
import { UpdateAffiliateDto } from "./dtos/UpdateAffiliateDto";
import { UpdateAffiliateStatusDto } from "./dtos/UpdateAffiliateStatusDto";
import { UpdateAffiliateTypeDto } from "./dtos/UpdateAffiliateTypeDto";
import { CreateCouponDto } from "./dtos/CreateCouponDto";

import { UserRole } from "../users/enums/UserRole";
import { CustomerRole } from "../customers/enums/CustomerRole";

import { Affiliate } from "./entities/affiliate.entity";
import { AffiliatesService } from "./affiliates.service";

import { Customer } from "../customers/entities/customer.entity";

import { Coupon } from "./entities/coupon.entity";
import { CouponsService } from "./coupons.service";

import { AuthGuard } from "../auth/auth.guard";
import { RolesGuard } from "../auth/roles.guard";

import { Roles } from "../auth/roles.decorator";

@UseGuards(AuthGuard, RolesGuard)
@Controller('v1/referral/affiliates')
export class AffiliatesController {
	constructor(
		@Inject(AffiliatesService) private readonly afiliatesService: AffiliatesService,
		@Inject(CouponsService) private readonly couponsService: CouponsService,
	) { }

	@Roles(CustomerRole.Customer, CustomerRole.Influencer, CustomerRole.Affiliate)
	@Post("affiliate")
	@HttpCode(HttpStatus.CREATED)
	actionCreateAffiliate(
		@Req()
		req: Request & {
			customer: Customer,
		},
		@Body()
		body: RequestAffiliateDto,
	): Promise<Affiliate> {
		return this.afiliatesService.createAffiliate(req.customer.uuid, body);
	}

	@Roles(CustomerRole.Customer, CustomerRole.Influencer, CustomerRole.Affiliate)
	@Post("influencer")
	@HttpCode(HttpStatus.CREATED)
	actionCreateInfluencer(
		@Req()
		req: Request & {
			customer: Customer,
		},
		@Body()
		body: RequestAffiliateDto,
	): Promise<Affiliate> {
		return this.afiliatesService.createInfluencer(req.customer.uuid, body);
	}

	@Roles(UserRole.SuperAdmin, UserRole.Admin, UserRole.Manager)
	@Get()
	@HttpCode(HttpStatus.OK)
	actionGetAffiliates(
		@Query("filters") filters: string,
		@Query("sort") sort: string,
		@Query("pageNumber") pageNumber: number,
		@Query("itemsPerPage") itemsPerPage: number,
	): Promise<Array<Affiliate>> {
		return this.afiliatesService.findAll(filters, sort, pageNumber, itemsPerPage);
	}

	@Roles(UserRole.SuperAdmin, UserRole.Admin, UserRole.Manager)
	@Get(':uuid')
	@HttpCode(HttpStatus.OK)
	actionGetAffiliate(@Param('uuid') uuid: string): Promise<Affiliate> {
		return this.afiliatesService.findOne(uuid);
	}

	@Roles(UserRole.SuperAdmin, UserRole.Admin, UserRole.Manager)
	@Put(':uuid')
	@HttpCode(HttpStatus.OK)
	actionUpdateAffiliate(@Param('uuid') uuid: string, @Body() body: UpdateAffiliateDto): Promise<Affiliate> {
		return this.afiliatesService.updateAffiliate(uuid, body);
	}

	@Roles(UserRole.SuperAdmin, UserRole.Admin, UserRole.Manager)
	@Patch(':uuid/status')
	@HttpCode(HttpStatus.OK)
	actionUpdateAffiliateStatus(@Param('uuid') uuid: string, @Body() body: UpdateAffiliateStatusDto): Promise<Affiliate> {
		return this.afiliatesService.updateAffiliateStatus(uuid, body);
	}

	@Roles(UserRole.SuperAdmin, UserRole.Admin, UserRole.Manager)
	@Patch(':uuid/type')
	@HttpCode(HttpStatus.OK)
	actionUpdateAffiliateType(@Param('uuid') uuid: string, @Body() body: UpdateAffiliateTypeDto): Promise<Affiliate> {
		return this.afiliatesService.updateAffiliateType(uuid, body);
	}

	@Roles(UserRole.SuperAdmin, UserRole.Admin, UserRole.Manager)
	@Post(':uuid/coupons')
	@HttpCode(HttpStatus.OK)
	actionCreateAffiliateCoupon(@Param('uuid') uuid: string, @Body() body: CreateCouponDto): Promise<Coupon> {
		return this.couponsService.createCouponForAffiliate(uuid, body);
	}

	@Roles(UserRole.SuperAdmin)
	@Delete(':uuid')
	@HttpCode(HttpStatus.OK)
	actionDelete(@Param('uuid') uuid: string): Promise<void> {
		return this.afiliatesService.delete(uuid);
	}
}

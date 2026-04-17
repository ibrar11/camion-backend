import {
	Args,
	ArgsType,
	Context,
	Field,
	Int,
	Query,
	Resolver,
} from "@nestjs/graphql";

import {
	ForbiddenException,
	Inject,
	UseGuards
} from "@nestjs/common";

import { Coupon } from "./entities/coupon.entity";
import { CouponsService } from "./coupons.service";

import { GqlAuthGuard } from "../auth/gql.guard";

@ArgsType()
export class GetCurrentAffiliateCouponsArgs {
	@Field(() => Int, { defaultValue: 1, })
	pageNumber: number;

	@Field(() => Int, { defaultValue: 100, })
	itemsPerPage: number;
}

@UseGuards(GqlAuthGuard)
@Resolver(() => Coupon)
export class CouponsResolver {
	constructor(@Inject(CouponsService) private readonly couponsService: CouponsService) { }

	@Query(() => [Coupon])
	async getCurrentAffiliateCoupons(@Context() context, @Args() args: GetCurrentAffiliateCouponsArgs): Promise<Array<Coupon>> {
		if (!context.req || !context.req.customer || !context.req.customer.uuid) {
			throw new ForbiddenException({
				error: "You're not allowed to retrieve affiliate coupons. Please check and try again.",
			});
		}

		try {
			return await this.couponsService.getCouponsByCustomer(context.req.customer.uuid, "", "", args.pageNumber, args.itemsPerPage);
		} catch {
			return [];
		}
	}
}

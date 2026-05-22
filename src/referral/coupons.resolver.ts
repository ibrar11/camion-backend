import {
	Args,
	ArgsType,
	Context,
	Field,
	Int,
	Parent,
	Query,
	ResolveField,
	Resolver,
} from "@nestjs/graphql";

import {
	ForbiddenException,
	Inject,
	UseGuards
} from "@nestjs/common";

import { Coupon } from "./entities/coupon.entity";
import { CouponsService } from "./coupons.service";

import { CouponOrder } from "../order/entities/order.entity";
import { OrderService } from "../order/order.service";

import { GqlAuthGuard } from "../auth/gql.guard";

@ArgsType()
export class GetCurrentAffiliateCouponsArgs {
	@Field(() => Int, { defaultValue: 1, })
	pageNumber: number;

	@Field(() => Int, { defaultValue: 24, })
	itemsPerPage: number;
}

@ArgsType()
export class GetCouponOrdersArgs {
	@Field({ defaultValue: "", })
	uuid: string;

	@Field(() => Int, { defaultValue: 1, })
	pageNumber: number;

	@Field(() => Int, { defaultValue: 24, })
	itemsPerPage: number;
}

@UseGuards(GqlAuthGuard)
@Resolver(() => Coupon)
export class CouponsResolver {
	constructor(
		@Inject(CouponsService) private readonly couponsService: CouponsService,
		@Inject(OrderService) private readonly orderService: OrderService,
	) { }

	@ResolveField("expiresAt", () => String)
	getExpiresAt(@Parent() coupon: Coupon): String {
		return new String(coupon.expiresAt);
	}

	@ResolveField("createdAt", () => String)
	getCreatedAt(@Parent() coupon: Coupon): String {
		return new String(coupon.createdAt);
	}

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

	@Query(() => [CouponOrder])
	async getCouponOrders(@Context() context, @Args() args: GetCouponOrdersArgs): Promise<Array<CouponOrder>> {
		if (!context.req || !context.req.customer || !context.req.customer.uuid) {
			throw new ForbiddenException({
				error: "You're not allowed to retrieve orders against this coupon. Please check and try again.",
			});
		}

		try {
			// Find the coupon
			const coupon = await this.couponsService.getCoupon(args.uuid);
			if (coupon === null) {
				return [];
			}

			// Find the orders against the coupons
			const orders = await this.orderService.findAllByCoupon(coupon);
			if (!Array.isArray(orders) || orders.length === 0) {
				return [];
			}

			// Map the orders to non-sensitive elements to make it gdpr compiant
			// https://en.wikipedia.org/wiki/General_Data_Protection_Regulation
			return orders.map(order => ({
				uuid: order.uuid,
				total: order.subTotal,
				commission: order.discount,
				status: order.status,
				createdAt: order.createdAt,
			}));
		} catch {
			return [];
		}
	}
}

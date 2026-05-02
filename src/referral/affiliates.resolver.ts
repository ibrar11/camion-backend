import {
	Context,
	Parent,
	Query,
	ResolveField,
	Resolver,
} from "@nestjs/graphql";

import {
	ForbiddenException,
	Inject,
	UseGuards,
} from "@nestjs/common";

import { Affiliate } from "./entities/affiliate.entity";
import { AffiliatesService } from "./affiliates.service";

import { GqlAuthGuard } from "../auth/gql.guard";

@UseGuards(GqlAuthGuard)
@Resolver(() => Affiliate)
export class AffiliatesResolver {
	constructor(@Inject(AffiliatesService) private readonly affiliatesService: AffiliatesService) { }

	@ResolveField("createdAt", () => String)
	getCreatedAt(@Parent() affiliate: Affiliate): String {
		return new String(affiliate.createdAt);
	}

	@Query(() => Affiliate, { nullable: true, })
	async getCurrentAffiliate(@Context() context): Promise<Affiliate | null> {
		if (!context.req || !context.req.customer || !context.req.customer.uuid) {
			throw new ForbiddenException({
				error: "You're not allowed to retrieve affiliate information. Please check and try again.",
			});
		}

		try {
			return await this.affiliatesService.findOneByCustomer(context.req.customer.uuid);
		} catch {
			return Promise.resolve(null);
		}
	}
}

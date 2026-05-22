import {
	Args,
	ArgsType,
	Field,
	Int,
	Query,
	Resolver,
} from "@nestjs/graphql";

import {
	Inject,
	UseGuards
} from "@nestjs/common";

import { Promo } from "./entities/promo.entity";
import { PromosService } from "./promos.service";

import { GqlAuthGuard } from "../auth/gql.guard";

@ArgsType()
export class GetPromosArgs {
	@Field(() => Int, { defaultValue: 1, })
	pageNumber: number;

	@Field(() => Int, { defaultValue: 24, })
	itemsPerPage: number;
}

@UseGuards(GqlAuthGuard)
@Resolver(() => Promo)
export class PromosResolver {
	constructor(@Inject(PromosService) private readonly promosService: PromosService) { }

	@Query(() => [Promo])
	getPromos(@Args() args: GetPromosArgs): Promise<Array<Promo>> {
		return this.promosService.findAll("", "", args.pageNumber, args.itemsPerPage);
	}
}

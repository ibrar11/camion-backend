import { Inject, UseGuards } from "@nestjs/common";

import {
	Query,
	Resolver,
} from "@nestjs/graphql";

import { GqlAuthGuard } from "src/auth/gql.guard";

import { Currency } from "./entities/currency.entity";
import { CurrenciesService } from "./currencies.service";

@UseGuards(GqlAuthGuard)
@Resolver(() => Currency)
export class CurrenciesResolver {
	constructor(@Inject(CurrenciesService) private readonly currenciesService: CurrenciesService) {}

	@Query(() => [Currency])
	getCurrencies(): Promise<Currency[]> {
		return this.currenciesService.findAllCurrencies();
	}
}

import { Inject } from "@nestjs/common";

import {
	Query,
	Resolver,
} from "@nestjs/graphql";

import { Currency } from "./entities/currency.entity";
import { CurrenciesService } from "./currencies.service";

@Resolver(() => Currency)
export class CurrenciesResolver {
	constructor(@Inject(CurrenciesService) private readonly currenciesService: CurrenciesService) { }

	@Query(() => [Currency])
	getCurrencies(): Promise<Currency[]> {
		return this.currenciesService.findAllCurrencies();
	}
}

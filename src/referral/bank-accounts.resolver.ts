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
	UseGuards,
} from "@nestjs/common";

import { BankAccount } from "./entities/bank-account.entity";
import { BankAccountsService } from "./bank-accounts.service";

import { GqlAuthGuard } from "../auth/gql.guard";

@ArgsType()
export class GetCurrentAffiliateBankAccountsArgs {
	@Field(() => Int, { defaultValue: 1, })
	pageNumber: number;

	@Field(() => Int, { defaultValue: 24, })
	itemsPerPage: number;
}

@UseGuards(GqlAuthGuard)
@Resolver(() => BankAccount)
export class BankAccountsResolver {
	constructor(@Inject(BankAccountsService) private readonly bankAccountsService: BankAccountsService) { }

	@Query(() => [BankAccount])
	async getCurrentAffiliateBankAccounts(@Context() context, @Args() args: GetCurrentAffiliateBankAccountsArgs): Promise<Array<BankAccount>> {
		if (!context.req || !context.req.customer || !context.req.customer.uuid) {
			throw new ForbiddenException({
				error: "You're not allowed to retrieve affiliate information. Please check and try again.",
			});
		}
		try {
			return await this.bankAccountsService.findAllByCustomer(context.req.customer.uuid, "", "", args.pageNumber, args.itemsPerPage);
		} catch {
			return [];
		}
	}
}

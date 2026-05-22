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
	UseGuards,
} from "@nestjs/common";

import { Transaction } from "./entities/transaction.entity";
import { TransactionsService } from "./transactions.service";

import { GqlAuthGuard } from "../auth/gql.guard";

@ArgsType()
export class GetCurrentWalletTransactionsArgs {
	@Field(() => Int, { defaultValue: 1, })
	pageNumber: number;

	@Field(() => Int, { defaultValue: 24, })
	itemsPerPage: number;
}

@UseGuards(GqlAuthGuard)
@Resolver(() => Transaction)
export class TransactionsResolver {
	constructor(@Inject(TransactionsService) private readonly transactionsService: TransactionsService) { }

	@ResolveField("createdAt", () => String)
	getCreatedAt(@Parent() transaction: Transaction): String {
		return new String(transaction.createdAt);
	}

	@Query(() => [Transaction])
	async getCurrentAffiliateWalletTransactions(@Context() context, @Args() args: GetCurrentWalletTransactionsArgs): Promise<Array<Transaction>> {
		if (!context.req || !context.req.customer || !context.req.customer.uuid) {
			throw new ForbiddenException({
				error: "You're not allowed to retrieve affiliate information. Please check and try again.",
			});
		}

		try {
			return await this.transactionsService.findAllByCustomer(context.req.customer.uuid, "", "", args.pageNumber, args.itemsPerPage);
		} catch {
			return [];
		}
	}
}

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

import { CustomerAddress } from "./entities/customer-address.entity";
import { CustomerAddressesService } from "./customer-addresses.service";

import { GqlAuthGuard } from "../auth/gql.guard";

@ArgsType()
export class GetCustomerAddressesArgs {
	@Field(() => Int, { defaultValue: 1, })
	pageNumber: number;

	@Field(() => Int, { defaultValue: 24, })
	itemsPerPage: number;
}

@UseGuards(GqlAuthGuard)
@Resolver(() => CustomerAddress)
export class CustomerAddressesResolver {
	constructor(@Inject(CustomerAddressesService) private readonly customerAddressesService: CustomerAddressesService) { }

	@Query(() => [CustomerAddress])
	getCustomerAddresses(@Context() context, @Args() args: GetCustomerAddressesArgs): Promise<Array<CustomerAddress>> {
		if (!context.req || !context.req.customer || !context.req.customer.uuid) {
			throw new ForbiddenException({
				error: "You're not allowed to retrieve customer addresses. Please check and try again.",
			});
		}
		return this.customerAddressesService.findAllByCustomer(context.req.customer.uuid, args.pageNumber, args.itemsPerPage);
	}
}

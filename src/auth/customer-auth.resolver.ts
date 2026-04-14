import {
	Context,
	Query,
	Resolver,
} from "@nestjs/graphql";

import {
	ForbiddenException,
	Inject,
	UseGuards,
} from "@nestjs/common";

import { Customer } from "../customers/entities/customer.entity";
import { CustomersService } from "../customers/customers.service";

import { GqlAuthGuard } from "./gql.guard";

@UseGuards(GqlAuthGuard)
@Resolver(() => Customer)
export class CustomerAuthResolver {
	constructor(@Inject(CustomersService) private readonly customersService: CustomersService) { }

	@Query(() => Customer)
	getCurrentCustomer(@Context() context): Promise<Customer> {
		if (!context.req || !context.req.customer || !context.req.customer.uuid) {
			throw new ForbiddenException({
				error: "You're not allowed to retrieve customer addresses. Please check and try again.",
			});
		}
		return this.customersService.findOne(context.req.customer.uuid);
	}
}

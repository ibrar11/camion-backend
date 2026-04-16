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

import { Order } from "./entities/order.entity";
import { OrderService } from "./order.service";

import { GqlAuthGuard } from "../auth/gql.guard";

@ArgsType()
export class GetCustomerOrderArgs {
    @Field(() => Int, { defaultValue: 1, })
    pageNumber: number;

    @Field(() => Int, { defaultValue: 100, })
    itemsPerPage: number;
}

@UseGuards(GqlAuthGuard)
@Resolver(() => Order)
export class OrderResolver {
    constructor(@Inject(OrderService) private readonly orderService: OrderService) { }

    @Query(() => [Order])
    getCurrentCustomerOrders(@Context() context, @Args() args: GetCustomerOrderArgs): Promise<Array<Order>> {
        if (!context.req || !context.req.customer || !context.req.customer.uuid) {
            throw new ForbiddenException({
                error: "You're not allowed to retrieve customer orders. Please check and try again.",
            });
        }
        return this.orderService.findAllByCustomer(context.req.customer.uuid, "", "", args.pageNumber, args.itemsPerPage);
    }
}

import {
    BadRequestException,
    UseGuards
} from "@nestjs/common";

import {
    Resolver,
    Query,
    Context,
    Field,
    ArgsType,
    Int,
    Args,
} from "@nestjs/graphql";


import { Customer } from "../customers/entities/customer.entity";
import { CartItem } from "./entities/cart-items.entity";

import { CartItemsService } from "./cart.service";

import { GqlAuthGuard } from "../auth/gql.guard";
@ArgsType()
export class GetCustomerCartArgs {
    @Field({ defaultValue: "en", })
    language: string;
    
    @Field(() => Int, { defaultValue: 1, })
    pageNumber: number;

    @Field(() => Int, { defaultValue: 100, })
    itemsPerPage: number;
}
@UseGuards(GqlAuthGuard)
@Resolver(() => CartItem)
export class CartResolver {
    constructor(
        private readonly cartService: CartItemsService,
    ) { }

    @Query(() => [CartItem])
    async getCustomerCart(
        @Context() context: any,
        @Args() args: GetCustomerCartArgs
    ): Promise<Array<CartItem>> {

        const customer: Customer = context.req.customer;

        if (!customer) {
            throw new BadRequestException({
                error: "Failed to find the customer. Please check and try again",
            });
        }

        return this.cartService.findCart(customer, "", "", args.pageNumber, args.itemsPerPage);

    }

    @Query(() => Number)
    async getCustomerCartCount(
        @Context() context: any,
    ): Promise<number> {

        const customer: Customer = context.req.customer;

        if (!customer) {
            throw new BadRequestException({
                error: "Failed to find the customer. Please check and try again",
            });
        }

        return this.cartService.getCartCount(customer);

    }
}
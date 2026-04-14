import {
    BadRequestException,
    UseGuards
} from "@nestjs/common";

import {
    Resolver,
    Query,
    Context,
} from "@nestjs/graphql";


import { Customer } from "src/customers/entities/customer.entity";
import { CartItem } from "./entities/cart-items.entity";

import { CartItemsService } from "./cart.service";

import { GqlAuthGuard } from "src/auth/gql.guard";

import { GqlCartResponse } from "./types";

@UseGuards(GqlAuthGuard)
@Resolver(() => CartItem)
export class CartResolver {
    constructor(
        private readonly cartService: CartItemsService,
    ) { }

    @Query(() => GqlCartResponse)
    async cart(
        @Context() context: any,
    ): Promise<GqlCartResponse> {

        const customer: Customer = context.req.customer;

        if (!customer) {
            throw new BadRequestException({
                error: "Failed to find the customer. Please check and try again",
            });
        }

        const cart = await this.cartService.findCart(customer);

        return {
            items: cart,
            count: cart.length ?? 0
        };
    }
}
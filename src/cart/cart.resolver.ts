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

import { CartService } from "./cart.service";

import { GqlAuthGuard } from "src/auth/gql.guard";

import { 
    FindCartResponse, 
    GqlCartResponse 
} from "./types";

@UseGuards(GqlAuthGuard)
@Resolver(() => CartItem)
export class CartResolver {
    constructor(
        private readonly cartService: CartService,
    ) { }

    @Query(() => GqlCartResponse)
    async cart(
        @Context() context: any,
    ): Promise<{ cartCount: number, items: FindCartResponse }> {

        const customer: Customer = context.req.customer;

        if (!customer) {
            throw new BadRequestException(
                'Customer not found'
            )
        }

        const cart = await this.cartService.findCart(customer);

        return {
            items: cart,
            cartCount: cart.length ?? 0
        };
    }
}
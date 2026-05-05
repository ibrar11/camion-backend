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
    ResolveField,
    Parent,
} from "@nestjs/graphql";

import { Customer } from "../customers/entities/customer.entity";

import { CartItem } from "./entities/cart-items.entity";
import { CartItemsService } from "./cart.service";

import { GqlAuthGuard } from "../auth/gql.guard";
import { ProductVariant } from "src/inventory/entities/product-variant.entity";

@ArgsType()
export class GetCustomerCartArgs {
    @Field({ defaultValue: "en", })
    language: string;

    @Field({ defaultValue: "usd", })
    currency: string;

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

    @ResolveField("variant", () => ProductVariant)
    getVariant(@Parent() cartItem: CartItem): ProductVariant {
        cartItem.variant.product = cartItem.product;
        return cartItem.variant;
    }

    @Query(() => [CartItem])
    getCustomerCart(
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
    getCustomerCartCount(
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

import {
    Inject,
    NotFoundException,
    UseGuards
} from "@nestjs/common";

import {
    Resolver,
    Query,
    Context,
    Args,
    Field,
    Int,
    ArgsType,
} from "@nestjs/graphql";

import { GqlAuthGuard } from "src/auth/gql.guard";

import { Customer } from "src/customers/entities/customer.entity";

import { WishlistItem } from "./entities/wishlist.entity";
import { WishlistService } from "./wishlist.service";

import { WishlistResponse } from "./types";

@ArgsType()
export class GetCustomerWishListArgs {
    @Field(() => Int, { defaultValue: 1, })
    pageNumber: number;

    @Field(() => Int, { defaultValue: 100, })
    itemsPerPage: number;
}

@UseGuards(GqlAuthGuard)
@Resolver(() => WishlistItem)
export class WishListResolver {
    constructor(
        @Inject(WishlistService) private readonly wishListService: WishlistService,
    ) { }

    @Query(() => WishlistResponse)
    async getCustomerWishlist(
        @Context() context: any,
        @Args() args: GetCustomerWishListArgs
    ): Promise<WishlistResponse> {

        const customer: Customer = context.req.customer;

        if (!customer) {
            throw new NotFoundException({
                error: "Failed to find the customer. Please check and try again.",
            });
        }

        const items = await this.wishListService.getWishlist(customer, "", "", args.pageNumber, args.itemsPerPage);

        return {
            items: items,
            count: items.length ?? 0
        };
    }
}
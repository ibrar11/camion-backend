import {
    BadRequestException,
    Inject,
    UseGuards
} from "@nestjs/common";

import {
    Resolver,
    Query,
    Context,
} from "@nestjs/graphql";

import { GqlAuthGuard } from "src/auth/gql.guard";

import { Customer } from "src/customers/entities/customer.entity";

import { WishlistItem } from "./entities/wishlist.entity";
import { WishlistService } from "./wishlist.service";

import { GqlWishlistResponse } from "./types";



@UseGuards(GqlAuthGuard)
@Resolver(() => WishlistItem)
export class WishListResolver {
    constructor(
        @Inject(WishlistService) private readonly wishListService: WishlistService,
    ) { }

    @Query(() => GqlWishlistResponse)
    async wishlist(
        @Context() context: any,
    ): Promise<{ wishListCount: number, wishListItems: WishlistItem[] }> {

        const customer: Customer = context.req.customer;

        if (!customer) {
            throw new BadRequestException(
                'Customer not found'
            )
        }

        const items = await this.wishListService.getWishlist(customer);

        return {
            wishListItems: items,
            wishListCount: items.length ?? 0
        };
    }
}
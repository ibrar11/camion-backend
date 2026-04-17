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

import { GqlAuthGuard } from "../auth/gql.guard";

import { Customer } from "../customers/entities/customer.entity";

import { WishlistItem } from "./entities/wishlist.entity";
import { WishlistService } from "./wishlist.service";

@ArgsType()
export class GetCustomerWishListArgs {
    @Field({ defaultValue: "en", })
	language: string;
    
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

    @Query(() => [WishlistItem])
    async getCustomerWishlist(
        @Context() context: any,
        @Args() args: GetCustomerWishListArgs
    ): Promise<Array<WishlistItem>> {

        const customer: Customer = context.req.customer;

        if (!customer) {
            throw new NotFoundException({
                error: "Failed to find the customer. Please check and try again.",
            });
        }

        return this.wishListService.getWishlist(customer, "", "", args.pageNumber, args.itemsPerPage);

    }

    @Query(() => Number)
    async getCustomerWishlistCount(
        @Context() context: any,
    ): Promise<number> {

        const customer: Customer = context.req.customer;

        if (!customer) {
            throw new NotFoundException({
                error: "Failed to find the customer. Please check and try again.",
            });
        }

        return this.wishListService.getWishlistCount(customer);

    }
}
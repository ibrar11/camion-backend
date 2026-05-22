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
    ResolveField,
    Parent,
} from "@nestjs/graphql";

import { Customer } from "../customers/entities/customer.entity";

import { WishlistItem } from "./entities/wishlist.entity";
import { WishlistService } from "./wishlist.service";

import { ProductVariant } from "../inventory/entities/product-variant.entity";

import { GqlAuthGuard } from "../auth/gql.guard";

@ArgsType()
export class GetCustomerWishListArgs {
    @Field({ defaultValue: "en", })
    language: string;

    @Field({ defaultValue: "usd", })
    currency: string;

    @Field(() => Int, { defaultValue: 1, })
    pageNumber: number;

    @Field(() => Int, { defaultValue: 24, })
    itemsPerPage: number;
}

@UseGuards(GqlAuthGuard)
@Resolver(() => WishlistItem)
export class WishListResolver {
    constructor(
        @Inject(WishlistService) private readonly wishlistService: WishlistService,
    ) { }

    @ResolveField("variant", () => ProductVariant)
    getVariant(@Parent() wishlistItem: WishlistItem): ProductVariant {
        wishlistItem.variant.product = wishlistItem.product;
        return wishlistItem.variant;
    }

    @Query(() => [WishlistItem])
    getCustomerWishlist(
        @Context() context: any,
        @Args() args: GetCustomerWishListArgs
    ): Promise<Array<WishlistItem>> {
        const customer: Customer = context.req.customer;
        if (!customer) {
            throw new NotFoundException({
                error: "Failed to find the customer. Please check and try again.",
            });
        }
        return this.wishlistService.getWishlist(customer, "", "", args.pageNumber, args.itemsPerPage);
    }

    @Query(() => Number)
    getCustomerWishlistCount(
        @Context() context: any,
    ): Promise<number> {
        const customer: Customer = context.req.customer;
        if (!customer) {
            throw new NotFoundException({
                error: "Failed to find the customer. Please check and try again.",
            });
        }
        return this.wishlistService.getWishlistCount(customer);
    }
}

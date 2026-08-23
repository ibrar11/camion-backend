import {
    BadRequestException,
    UseGuards
} from "@nestjs/common";

import {
    Resolver,
    Query,
    Mutation,
    Context,
    Field,
    ArgsType,
    Int,
    Args,
    ResolveField,
    Parent,
    InputType,
} from "@nestjs/graphql";

import { Customer } from "../customers/entities/customer.entity";

import { CartItem } from "./entities/cart-items.entity";
import { CartItemsService } from "./cart.service";

import { GqlAuthGuard } from "../auth/gql.guard";
import { ProductVariant } from "../inventory/entities/product-variant.entity";

import { CurrencyCode } from "../inventory/enums/CurrencyCode.enum";

@ArgsType()
@InputType()
export class AddBundleToCartSelectionItemInput {
    @Field(() => String, { nullable: true })
    productUuid?: string;

    @Field(() => String, { nullable: true })
    variantUuid?: string;
}

@ArgsType()
export class AddBundleToCartArgs {
    @Field(() => String)
    bundleUuid: string;

    @Field({ defaultValue: CurrencyCode.QAR, })
    currency: CurrencyCode;

    @Field(() => String, { nullable: true })
    countryCode?: string;

    @Field(() => Int, { defaultValue: 1 })
    quantity: number;

    @Field(() => [AddBundleToCartSelectionItemInput], { nullable: true })
    items?: Array<AddBundleToCartSelectionItemInput>;
}

@ArgsType()
export class GetCustomerCartArgs {
    @Field({ defaultValue: "en", })
    language: string;

    @Field({ defaultValue: CurrencyCode.QAR, })
    currency: CurrencyCode;
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
        console.log(`Attempting to fetch cart for customer ${customer.uuid} with currency ${args.currency}`);
        return this.cartService.findCart(customer, "", args.currency, "");
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

    @Mutation(() => [CartItem])
    addBundleToCart(
        @Context() context: any,
        @Args() args: AddBundleToCartArgs,
    ): Promise<Array<CartItem>> {
        const customer: Customer = context.req.customer;
        if (!customer) {
            throw new BadRequestException({
                error: "Failed to find the customer. Please check and try again",
            });
        }

        return this.cartService.createBundle(customer, {
            bundleUuid: args.bundleUuid,
            currency: args.currency,
            countryCode: args.countryCode,
            quantity: args.quantity,
            items: args.items,
        });
    }
}

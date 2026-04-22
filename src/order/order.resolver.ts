import { IsEnum, IsOptional, IsUUID } from "class-validator";

import {
    Args,
    ArgsType,
    Context,
    Field,
    Int,
    Parent,
    Query,
    ResolveField,
    Resolver,
} from "@nestjs/graphql";

import {
    ForbiddenException,
    Inject,
    UseGuards
} from "@nestjs/common";

import { Order } from "./entities/order.entity";
import { OrderItem } from "./entities/order-item.entity";
import { OrderService } from "./order.service";

import { ProductVariant } from "../inventory/entities/product-variant.entity";

import { GqlAuthGuard } from "../auth/gql.guard";
import { OrderStatus } from "./enums/OrderStatus";

@ArgsType()
export class GetCustomerOrdersArgs {
    @Field(() => Int, { defaultValue: 1, })
    pageNumber: number;

    @Field(() => Int, { defaultValue: 100, })
    itemsPerPage: number;

    @Field(() => String, { nullable: true })
    @IsOptional()
    @IsEnum(OrderStatus)
    status?: OrderStatus;
}
@ArgsType()
export class VariantArgs {
    slug: string;

    @Field({ defaultValue: "en", })
    language: string;

    @Field({ defaultValue: "usd", })
    currency: string;
}
@ArgsType()
export class GetCustomerOrderArgs {
    @Field(() => String)
    @IsUUID('4')
    uuid: string;

    @Field({ defaultValue: "en", })
    language: string;

    @Field({ defaultValue: "usd", })
    currency: string;
}

@UseGuards(GqlAuthGuard)
@Resolver(() => Order)
export class OrderResolver {
    constructor(@Inject(OrderService) private readonly orderService: OrderService) { }

    @Query(() => [Order])
    getCurrentCustomerOrders(@Context() context, @Args() args: GetCustomerOrdersArgs): Promise<Array<Order>> {
        if (!context.req || !context.req.customer || !context.req.customer.uuid) {
            throw new ForbiddenException({
                error: "You're not allowed to retrieve customer orders. Please check and try again.",
            });
        }
        return this.orderService.findAllByCustomer(context.req.customer.uuid, "", "", args.pageNumber, args.itemsPerPage, args.status);
    }

    @Query(() => Order)
    getCurrentCustomerOrder(@Context() context, @Args() args: GetCustomerOrderArgs): Promise<Order> {
        if (!context.req || !context.req.customer || !context.req.customer.uuid) {
            throw new ForbiddenException({
                error: "You're not allowed to retrieve customer order. Please check and try again.",
            });
        }
        return this.orderService.findOne(args.uuid);
    }
}

@Resolver(() => OrderItem)
export class OrderItemResolver {
    @ResolveField("variant", () => ProductVariant)
    getVariant(@Parent() orderItem: OrderItem, @Args() args: VariantArgs): ProductVariant {
        if (orderItem.variant && orderItem.product) {
            return {
                ...orderItem.variant,
                product: orderItem.product
            };
        }
        return orderItem.variant;
    }
}

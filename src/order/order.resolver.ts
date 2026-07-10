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
import { OrderServiceV2 } from "./order-v2.service";

import { ProductVariant } from "../inventory/entities/product-variant.entity";

import { GqlAuthGuard } from "../auth/gql.guard";
import { OrderStatus } from "./enums/OrderStatus";
import { OrderPreviewResponse, OrderTrackingItem } from "./types";

import { CurrencyCode } from "../inventory/enums/CurrencyCode.enum";

@ArgsType()
export class GetCustomerOrdersArgs {
    @Field(() => Int, { defaultValue: 1, })
    pageNumber: number;

    @Field(() => Int, { defaultValue: 24, })
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
@ArgsType()
export class GetOrderTrackingArgs {
    @Field(() => String)
    @IsUUID('4')
    uuid: string;

    @Field({ defaultValue: "en" })
    language: string;
}

@ArgsType()
export class GetCustomerOrderPreviewArgs {
    @Field({ defaultValue: "en", })
    language: string;

    @Field({ defaultValue: "usd", })
    currency: CurrencyCode;

    @Field(() => String, { nullable: true })
    @IsOptional()
    couponCode?: string;
}

@ArgsType()
export class GetCustomerOrderPreviewV2Args {
    @Field({ defaultValue: "en", })
    language: string;

    @Field({ defaultValue: "usd", })
    currency: CurrencyCode;

    @Field(() => String, { nullable: true })
    @IsOptional()
    couponCode?: string;

    @Field(() => [String], { defaultValue: [], })
    cartItemUuids: string[];
}

@UseGuards(GqlAuthGuard)
@Resolver(() => Order)
export class OrderResolver {
    constructor(
        @Inject(OrderService) private readonly orderService: OrderService,
        @Inject(OrderServiceV2) private readonly orderServiceV2: OrderServiceV2,
    ) { }

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

    @Query(() => [OrderTrackingItem])
    async getOrderTracking(@Context() context, @Args() args: GetOrderTrackingArgs): Promise<OrderTrackingItem[]> {
        const customerUuid = context.req?.customer?.uuid ?? undefined;
        const result = await this.orderService.getOrderTracking(args.uuid, customerUuid, args.language);
        if (result.cancelled) {
            return [...result.stages, result.cancelled];
        }
        return result.stages;
    }

    @Query(() => OrderPreviewResponse)
    getCurrentCustomerOrderPreview(@Context() context, @Args() args: GetCustomerOrderPreviewArgs): Promise<OrderPreviewResponse> {
        if (!context.req || !context.req.customer || !context.req.customer.uuid) {
            throw new ForbiddenException({
                error: "You're not allowed to retrieve customer order. Please check and try again.",
            });
        }
        return this.orderService.orderPreview(context.req.customer, args.currency, args.couponCode);
    }

    @Query(() => OrderPreviewResponse)
    getCurrentCustomerOrderPreviewV2(@Context() context, @Args() args: GetCustomerOrderPreviewV2Args): Promise<OrderPreviewResponse> {
        if (!context.req || !context.req.customer || !context.req.customer.uuid) {
            throw new ForbiddenException({
                error: "You're not allowed to retrieve customer order. Please check and try again.",
            });
        }
        return this.orderServiceV2.orderPreviewV2(context.req.customer, args);
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

import { CartItem } from "../cart/entities/cart-items.entity";

import { CustomerAddress } from "../customers/entities/customer-address.entity";

import { ShippingCalculationResult } from "../common/calculateShipping";

import { OrderStatus } from "./enums/OrderStatus";

import { 
    Field, 
    ObjectType 
} from "@nestjs/graphql";

@ObjectType()
export class OrderPreviewResponse {
    @Field(() => [CartItem])
    items: CartItem[];

    @Field(() => CustomerAddress)
    shippingAddress: CustomerAddress;

    @Field()
    cart_total: number;

    @Field()
    discount: number;

    shipping: ShippingCalculationResult | null;

    @Field()
    shippingTotal: number;

    @Field()
    grand_total: number;

    @Field()
    eta: string;

    @Field({ defaultValue: "", })
    orderTotalWarning?: string;
}

export interface OrderFilters {
    status?: OrderStatus
    customer?: {uuid?: string}
}

export interface NotificationPayload {
    type:string;
    priority: string;
    isRead: string,
}

@ObjectType()
export class OrderTracking {
    @Field()
    stage: string;

    @Field()
    status: string;

    @Field(() => String, { nullable: true })
    waybillNo: string | null;

    @Field(() => String, { nullable: true })
    trackingUrl: string | null;

    @Field()
    canRetryOutbound: boolean;
}

export class OrderTrackingMetadata {
    trackingId: string | null;
    cancellationReason: string | null;
    reviewText: string | null;
    reviewRating: number | null;
}

export class OrderTrackingItem {
    id: number;
    name: string;
    checked: boolean;
    date: Date | null;
    metadata: OrderTrackingMetadata;
}

export class OrderTrackingResponse {
    success: boolean;
    message: string;
    data: OrderTrackingItem[];
}
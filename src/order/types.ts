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
}

export interface OrderFilters {
    status?: OrderStatus
}
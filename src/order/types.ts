import { CartItem } from "../cart/entities/cart-items.entity";

import { CustomerAddress } from "../customers/entities/customer-address.entity";

import { ShippingCalculationResult } from "../common/calculateShipping";

import { OrderStatus } from "./enums/OrderStatus";

export interface OrderPreviewResponse {
    cart: CartItem[];
    address: CustomerAddress;
    cart_total: number;
    shipping: ShippingCalculationResult;
    shippingTotal: number;
    grand_total: number;
}

export interface OrderFilters {
    status?: OrderStatus
}
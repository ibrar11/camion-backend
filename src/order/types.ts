import { WeightUnit } from "src/inventory/enums/WeightUnit";

import { CartItem } from "src/cart/entities/cart-items.entity";

import { CustomerAddress } from "src/customers/entities/customer-address.entity";

import { ShippingCalculationResult } from "src/common/calculateShipping";

export interface OrderPreviewResponse {
    cart: CartItem[];
    address: CustomerAddress;
    cart_total: number;
    shipping: ShippingCalculationResult;
    shippingTotal: number;
    grand_total: number;
}
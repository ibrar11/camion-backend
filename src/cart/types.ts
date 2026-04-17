import { Product } from "../inventory/entities/product.entity";

import { 
    Money, 
    ProductVariant 
} from "../inventory/entities/product-variant.entity";

import { CartItem } from "./entities/cart-items.entity";

export interface ApiResponse<T> {
    success: boolean;
    message: string;
    data: T;
}

// return type for update cart method
export interface UpdateCartResponse {
    uuid: string;
    product: Product;
    variant: ProductVariant;
    quantity: number;
    subTotal: Money;
}
export interface ValidatedCartItem extends CartItem {
    availableStock: number;
    isAvailable: boolean;
}

// return type for remove cart item
export interface RemoveCartItemResponseData {
    removed: boolean
}
export type RemoveCartItemResponse = ApiResponse<RemoveCartItemResponseData>;
import { ProductVariantImage } from "src/inventory/entities/product-variant-image.entity";
import { ProductVariant } from "src/inventory/entities/product-variant.entity";

export interface ApiResponse<T> {
    success: boolean;
    message: string;
    data: T;
}

// return type for add to cart method
export interface AddToCartResponseData {
    cartCount: number;
}
export type AddToCartResponse = ApiResponse<AddToCartResponseData>;


// return type for update cart method
export interface UpdateCartResponseData {
    uuid: string;
    productUuId: string;
    quantity: number;
    totalPrice: number;
}
export type UpdateCartResponse = ApiResponse<UpdateCartResponseData>;

export interface ValidatedCartItem {
    uuid: string;
    userId: string;
    productId: string;
    quantity: number;
    variation: ProductVariant;
    title: string;
    image: ProductVariantImage[];
    totalPrice: number;
    availableStock: number;
    isAvailable: boolean;
    createdAt: Date;
    updatedAt: Date;
}

// return type for find cart
export type FindCartResponse = ApiResponse<FindCartResponseData>;

export interface FindCartResponseData {
    cartItems: ValidatedCartItem[];
    cartTotal: number;
}

// return type for remove cart item
export interface RemoveCartItemResponseData {
    removed: boolean
}
export type RemoveCartItemResponse = ApiResponse<RemoveCartItemResponseData>;
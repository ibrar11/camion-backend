import { Product } from "src/inventory/entities/product.entity";
import { ProductVariantImage } from "src/inventory/entities/product-variant-image.entity";
import { ProductVariant } from "src/inventory/entities/product-variant.entity";

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
    subTotal: number;
}
export interface ValidatedCartItem {
    uuid: string;
    customerUuid: string;
    product: Product;
    quantity: number;
    variation: ProductVariant;
    title: string;
    image: ProductVariantImage[];
    subTotal: number;
    availableStock: number;
    isAvailable: boolean;
    createdAt: Date;
    updatedAt: Date;
}

// return type for find cart
export type FindCartResponse = ValidatedCartItem[];

// return type for remove cart item
export interface RemoveCartItemResponseData {
    removed: boolean
}
export type RemoveCartItemResponse = ApiResponse<RemoveCartItemResponseData>;
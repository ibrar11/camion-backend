import { ProductVariant } from "src/inventory/entities/product-variant.entity";

/**
 * Calculates the stocks of product variant
 *
 * @param variant
 * @returns
 */
export function calculateStock(variant: ProductVariant): number {
    if (!variant.inventoryItem || !variant.inventoryItem.levels) {
        return 0;
    }

    return variant.inventoryItem.levels.reduce(
        (total, level) => total + Number(level.quantity),
        0
    );
}

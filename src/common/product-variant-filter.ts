import { Product } from "src/inventory/entities/product.entity";

/**
 * Slices the variants of the product
 *
 * @param products
 * @returns
 */
export const sliceProductVariants = (products: Array<Product>): Array<Product> => {
	if (products === null || products === undefined || !Array.isArray(products) || products.length === 0) {
		return [];
	}

	return products.map(product => {
		if (product.variants === null || product.variants === undefined || !Array.isArray(product.variants) || product.variants.length === 0) {
			return product;
		}

		// Slice the product variants
		product.variants = product.variants.slice(0, 1);

		return product;
	});
}

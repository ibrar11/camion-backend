import { ProductStatus } from "../inventory/enums/ProductStatus.enum";

import { Product } from "../inventory/entities/product.entity";

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

	return products
		.filter(product => product.status === ProductStatus.ACTIVE) // Make sure all products are active
		.filter(product => product.variants !== null && product.variants !== undefined && Array.isArray(product.variants) && product.variants.length !== 0)
		.map(product => {
			product.variants = product.variants.slice(0, 1); // Slice the product variants
			return product;
		});
}

/**
 * Slices the variants of the product
 *
 * @param products
 * @returns
 */
export const sliceProductVariantsWithDrafts = (products: Array<Product>): Array<Product> => {
	if (products === null || products === undefined || !Array.isArray(products) || products.length === 0) {
		return [];
	}

	return products
		.filter(product => product.variants !== null && product.variants !== undefined && Array.isArray(product.variants) && product.variants.length !== 0)
		.map(product => {
			product.variants = product.variants.slice(0, 1); // Slice the product variants
			return product;
		});
}

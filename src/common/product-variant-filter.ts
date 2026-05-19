import { ProductStatus } from "../inventory/enums/ProductStatus.enum";

import { Product } from "../inventory/entities/product.entity";
import { ProductSort } from "../inventory/enums/ProductSort.enum";

/**
 * Slices the variants of the product
 *
 * @param products
 * @returns
 */
export const formatProductVariants = (products: Array<Product>, sort: ProductSort): Array<Product> => {
	if (products === null || products === undefined || !Array.isArray(products) || products.length === 0) {
		return [];
	}

	return products
		.filter(product => product.status === ProductStatus.ACTIVE) // Make sure all products are active
		.filter(product => product.variants !== null && product.variants !== undefined && Array.isArray(product.variants) && product.variants.length !== 0)
		.map(product => {
			switch (sort) {
				case ProductSort.PriceHighToLow:
					product.variants = product.variants.sort((variantA, variantB) => variantB.cost.amount - variantA.cost.amount).slice(0, 1);
					break;
				case ProductSort.PriceLowToHigh:
					product.variants = product.variants.sort((variantA, variantB) => variantA.cost.amount - variantB.cost.amount).slice(0, 1);
					break;
				default:
					product.variants = product.variants.slice(0, 1);
					break;
			}
			return product;
		});
}

/**
 * Slices the variants of the product
 *
 * @param products
 * @returns
 */
export const formatProductVariantsWithDrafts = (products: Array<Product>): Array<Product> => {
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

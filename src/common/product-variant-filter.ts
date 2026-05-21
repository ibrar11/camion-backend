import { ProductStatus } from "../inventory/enums/ProductStatus.enum";

import { Product } from "../inventory/entities/product.entity";
import { ProductSort } from "src/inventory/enums/ProductSort.enum";

/**
 * Filters in the active product and products with variants only
 *
 * @param products
 * @param sort
 * @returns
 */
export const formatProductVariants = (products: Array<Product>, sort: ProductSort): Array<Product> => {
	if (!Array.isArray(products) || products.length === 0) {
		return [];
	}

	// Filter out the products
	products = products
		.filter(product => product.status === ProductStatus.ACTIVE) // Make sure all products are active
		.filter(product => Array.isArray(product.variants) && product.variants.length !== 0);

	// Sort the products based on the cost of their first variant
	switch (sort) {
		case ProductSort.PriceLowToHigh:
			products = products.sort((productA, productB) => productA.variants[0].cost.amount - productB.variants[0].cost.amount);
			break;
		case ProductSort.PriceHighToLow:
			products = products.sort((productA, productB) => productB.variants[0].cost.amount - productA.variants[0].cost.amount);
			break;
	}

	return products;
}

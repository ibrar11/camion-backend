import { moneyToMinor } from "./currency";

import { ProductStatus } from "../inventory/enums/ProductStatus.enum";
import { ProductSort } from "../inventory/enums/ProductSort.enum";

import { Product } from "../inventory/entities/product.entity";

/**
 * Filters in the active product and products with variants only
 *
 * @param products
 * @param sort
 * @returns
 */
export const sortProducts = (products: Array<Product>, sort: ProductSort): Array<Product> => {
	if (!Array.isArray(products) || products.length === 0) {
		return [];
	}

	// Filter out the products
	products = products
		.filter(product => product.status === ProductStatus.ACTIVE) // Make sure all products are active
		.filter(product => Array.isArray(product.variants) && product.variants.length !== 0);

	// Sort the products based on the cost of their first variant
	switch (sort) {
		case ProductSort.BestMatch:
			return products.sort((productA, productB) => productB.id - productA.id);

		case ProductSort.MostViewed:
			return products.sort((productA, productB) => productB.viewsCount - productA.viewsCount);

		case ProductSort.PriceLowToHigh:
			return products.sort((productA, productB) => moneyToMinor(productA.variants[0].discountedPrice) - moneyToMinor(productB.variants[0].discountedPrice));

		case ProductSort.PriceHighToLow:
			return products.sort((productA, productB) => moneyToMinor(productB.variants[0].discountedPrice) - moneyToMinor(productA.variants[0].discountedPrice));

		case ProductSort.BestSellers:
			return products.sort((productA, productB) => productB.salesCount - productA.salesCount);

		case ProductSort.MostFavorited:
			return products.sort((productA, productB) => productB.likesCount - productA.likesCount);

		case ProductSort.NewArrivals:
			return products.sort((productA, productB) => productB.id - productA.id);

		case ProductSort.MostRated:
			return products.sort((productA, productB) => productB.ratingAvg - productA.ratingAvg);

		default: // do nothing
			break;
	}

	return products;
}

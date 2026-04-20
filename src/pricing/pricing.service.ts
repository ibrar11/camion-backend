import { Injectable, Logger } from '@nestjs/common';

import { CurrencyCode } from 'src/inventory/enums/CurrencyCode.enum';
import { Money, ProductVariant } from '../inventory/entities/product-variant.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { ExchangeRate } from './entities/exchange-rate.entity';
import { In, Repository } from 'typeorm';
import { Product } from 'src/inventory/entities/product.entity';
import { Category } from 'src/inventory/entities/category.entity';
import { KeyValuePair } from 'src/key-value-pairs/entities/key-value-pair.entity';
import { KeyValuePairType } from 'src/key-value-pairs/enums/KeyValuePairType.enum';

@Injectable()
export class PricingService {
	private readonly logger = new Logger(PricingService.name);

	private lastSync: Date = new Date();

	/**
	 * A list of exchange rates that will be used to calculate the price of product variants
	 */
	private exchangeRates: Array<ExchangeRate> = [];

	/**
	 * A map of key value pairs that will apply discounts
	 */
	private keyValuePairs: Record<string, number | string | boolean> = {};

	constructor(
		@InjectRepository(ExchangeRate) private readonly exchangeRateRepository: Repository<ExchangeRate>,
		@InjectRepository(KeyValuePair) private readonly keyValuePairRepository: Repository<KeyValuePair>,
	) {
		this.initialize();
	}

	/**
	 * Initialize the pricing service
	 */
	async initialize() {
		// Populate the exchange rates
		this.exchangeRates = await this.exchangeRateRepository.find({
			order: {
				id: "DESC",
			},
			skip: 0,
			take: 10,
		});

		// Populate the keyValuePairsMap
		const keyValuePairs = await this.keyValuePairRepository.findBy({
			name: In(["price_multiplier", "discount_above_100", "discount_below_100"]),
		});

		// Create a record of values
		this.keyValuePairs = Object.fromEntries(
			keyValuePairs.map(keyValuePair => {
				switch (keyValuePair.type) {
					case KeyValuePairType.Integer:
						return [keyValuePair.name, keyValuePair.integerValue];
					case KeyValuePairType.Decimal:
						return [keyValuePair.name, keyValuePair.decimalValue];
					case KeyValuePairType.String:
						return [keyValuePair.name, keyValuePair.stringValue];
					case KeyValuePairType.Boolean:
						return [keyValuePair.name, keyValuePair.booleanValue];
					default:
						return [keyValuePair.name, null];
				}
			})
		);

		// Keep a track of the last sync time to keep exchange rates and key value pairs updated
		this.lastSync = new Date();
	}

	/**
	 * Returns the price of a product based on a currency code
	 *
	 * @param product
	 * @param variant
	 * @param currencyCode
	 * @param applyDiscount
	 * @returns
	 */
	async applyPriceOnProductVariant(product: Product, variant: ProductVariant, currencyCode: CurrencyCode, applyDiscount: boolean): Promise<Money> {
		this.logger.log(`Calculating the price of product: ${product.uuid}, variant: ${variant.uuid}, currencyCode: ${currencyCode}`);

		// Reinitialize the exchange rates after every 5 minutes
		const now = new Date();
		if (now.getTime() - this.lastSync.getTime() > 300000) {
			this.initialize();
		}

		// Make sure we have an exchange rate
		if (!Array.isArray(this.exchangeRates)) {
			this.logger.error(`Failed to find the exchange rates. Please create exchange rates for target currency code: ${currencyCode}`);
			return {
				amount: -1,
				currencyCode: currencyCode,
			};
		}

		// Find the exchange rate for the request currency code
		let exchangeRate = this.exchangeRates.filter(
			(exchangeRate) => exchangeRate.targetCurrencyCode.toLowerCase().trim() === currencyCode.toLowerCase().trim()
		).at(0) ?? null;

		// If there is no exchange rate, we will no longer continue
		if (exchangeRate === null) {
			this.logger.error(`Failed to find the exchange rate for currency code: ${currencyCode}`);
			return {
				amount: -1,
				currencyCode: currencyCode,
			};
		}

		// Find the last category applied on the product
		let lastCategory: Category | null = null;
		if (product !== null && Array.isArray(product.productCategories)) {
			lastCategory = product.productCategories.sort((a, b) => b.id - a.id).at(0)?.category ?? null;
		}

		// Find the pricing factor based on the last category applied on the product
		let categoryPricingFactor = 1;
		if (lastCategory !== null) {
			categoryPricingFactor = lastCategory.pricingFactor;
		}

		// Get the price_multiplier from the key value pairs
		let priceMultiplier: number = 1;
		try {
			priceMultiplier = this.keyValuePairs["price_multiplier"] as number;
		} catch { }

		// Calculate the base price based on the cost and the exchange rate.
		const basePrice = variant.cost.amount * exchangeRate.factor * priceMultiplier;

		// Add to the base price, the profit margin based on the category.
		// The profit margin will be the base price multiplied by the pricing factor of the last category
		const totalPrice = basePrice * categoryPricingFactor;

		// If discount isn't applied we return early
		if (!applyDiscount) {
			return {
				amount: Math.ceil(totalPrice),
				currencyCode: currencyCode,
			};
		}

		// Apply discount
		let discountAbove100 = 0, discountBelow100 = 0;
		try {
			discountAbove100 = this.keyValuePairs["discount_above_100"] as number;
			discountBelow100 = this.keyValuePairs["discount_below_100"] as number;
		} catch { }

		if (totalPrice > 100) {
			return {
				amount: Math.ceil(totalPrice - discountAbove100),
				currencyCode: currencyCode,
			};
		} else {
			return {
				amount: Math.ceil(totalPrice - discountBelow100),
				currencyCode: currencyCode,
			};
		}
	}
}

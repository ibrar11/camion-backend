import {
	Injectable,
	Logger,
} from '@nestjs/common';

import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { CurrencyCode } from '../inventory/enums/CurrencyCode.enum';

import {
	Money,
	ProductVariant,
} from '../inventory/entities/product-variant.entity';

import { ExchangeRate } from './entities/exchange-rate.entity';
import { Product } from '../inventory/entities/product.entity';

@Injectable()
export class PricingService {
	private readonly logger = new Logger(PricingService.name);

	/**
	 * The last time we synced the exchange rates
	 */
	private lastSync: Date = new Date();

	/**
	 * A list of exchange rates that will be used to calculate the price of product variants
	 */
	private exchangeRates: Array<ExchangeRate> = [];

	/**
	 * Initialize the pricing service
	 *
	 * @param exchangeRateRepository
	 */
	constructor(@InjectRepository(ExchangeRate) private readonly exchangeRateRepository: Repository<ExchangeRate>) {
		this.initialize();
	}

	/**
	 * Initialize the pricing service
	 */
	async initialize() {
		// Populate the exchange rates
		this.exchangeRates = await this.exchangeRateRepository.find({
			where: {
				srcCurrencyCode: CurrencyCode.CNY
			},
			order: {
				id: "DESC",
			},
			skip: 0,
			take: 10,
		});

		// Keep a track of the last sync time to keep exchange rates and key value pairs updated
		this.lastSync = new Date();
	}

	/**
	 * Returns the price of a product based on a currency code
	 *
	 * @param product
	 * @param variant
	 * @param currency
	 * @param applyDiscount
	 * @returns
	 */
	async applyPriceOnProductVariant(product: Product, variant: ProductVariant, currency: CurrencyCode, applyDiscount: boolean): Promise<Money> {
		this.logger.log(`Calculating the price of product: ${product.uuid}, variant: ${variant.uuid}, currencyCode: ${currency}`);

		// Reinitialize the exchange rates after every 5 minutes
		const now = new Date();
		if (now.getTime() - this.lastSync.getTime() > 300000) {
			this.initialize();
		}

		// Make sure we have an exchange rate
		if (!Array.isArray(this.exchangeRates)) {
			this.logger.error(`Failed to find the exchange rates. Please create exchange rates for target currency code: ${currency}`);
			return {
				amount: -1,
				currencyCode: currency,
			};
		}

		// Find the exchange rate for the request currency code
		let exchangeRate = this.exchangeRates
			.filter(exchangeRate => exchangeRate.targetCurrencyCode.toLowerCase().trim() === currency.toLowerCase().trim())
			.at(0) ?? null;

		// If there is no exchange rate, we will no longer continue
		if (exchangeRate === null) {
			this.logger.error(`Failed to find the exchange rate for currency code: ${currency}`);
			return {
				amount: -1,
				currencyCode: currency,
			};
		}

		// Set the pricing based on the maximum pricing factor and discount percentage
		let pricingFactor: number = 1,
			discountPercentage: number = 0;

		this.logger.log(`---------------------------------`);
		this.logger.log(`slug: ${product.slug}`);
		this.logger.log(`pricingFactor: ${pricingFactor}`);
		this.logger.log(`discountPercentage: ${discountPercentage}`);
		this.logger.log(`productCategories size: ${product?.productCategories?.length ?? "N/A"}`);
		this.logger.log(`---------------------------------`);

		if (product !== null && Array.isArray(product.productCategories) && product.productCategories.length !== 0) {
			for (let i = 0; i < product.productCategories.length; i++) {
				if (!product.productCategories[i].category) {
					this.logger.log(`Skipping category: ${i}`);
					continue;
				}

				this.logger.log(`---------------------------------`);
				this.logger.log(`Using category name: ${product.productCategories[i].category.nameEn}`);
				this.logger.log(`Using category pricingFactor: ${product.productCategories[i].category.nameEn}`);
				this.logger.log(`Using category discountPercentage: ${product.productCategories[i].category.nameEn}`);
				this.logger.log(`---------------------------------`);

				pricingFactor = Math.max(pricingFactor, Number(product.productCategories[i].category.pricingFactor));
				discountPercentage = Math.max(discountPercentage, Number(product.productCategories[i].category.discountPercentage));
			}
		}

		this.logger.log(`---------------------------------`);
		this.logger.log(`final pricingFactor: ${pricingFactor}`);
		this.logger.log(`final discountPercentage: ${discountPercentage}`);
		this.logger.log(`---------------------------------`);

		// Calculate exchange rate factor
		let exchangeRateFactor: number = 1;
		try {
			exchangeRateFactor = parseFloat((exchangeRate.factor as unknown) as string);
		} catch (err) {
			this.logger.error(err);
			exchangeRateFactor = 1;
		}

		// Calculate the base price based on the cost and the exchange rate.
		const basePrice = variant.cost.amount * pricingFactor * exchangeRateFactor;

		// Apply discount if there is any
		const discountedPrice = basePrice * (1 - (discountPercentage / 100));

		// Apply the discount and return the discounted price
		if (applyDiscount && discountPercentage !== 0) {
			return {
				amount: Math.ceil(discountedPrice),
				currencyCode: currency,
			};
		}

		// Don't apply any discount and return full price
		return {
			amount: Math.ceil(basePrice),
			currencyCode: currency,
		};
	}
}

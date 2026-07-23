import {
	Injectable,
	Logger,
} from '@nestjs/common';

import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { CurrencyCode } from '../inventory/enums/CurrencyCode.enum';

import { getBasePrice, getDiscountedPrice, maxMoney } from '../common/currency';

import {
	Money,
	ProductVariant,
} from '../inventory/entities/product-variant.entity';

import { ExchangeRate } from './entities/exchange-rate.entity';
import { Product } from '../inventory/entities/product.entity';
import { Campaign } from '../campaigns/entities/campaign.entity';

@Injectable()
export class PricingService {
	private readonly logger = new Logger(PricingService.name);

	/**
	 * Minimum price per supported currency
	 *
	 * NOTE: Each must be equivalent to 5 QAR
	 */
	private static readonly MIN_PRICE_MAP:
		Record<CurrencyCode.QAR | CurrencyCode.BHD | CurrencyCode.OMR | CurrencyCode.KWD | CurrencyCode.SAR | CurrencyCode.AED | CurrencyCode.USD, Money> = {
			[CurrencyCode.QAR]: {
				amount: 5,
				minorAmount: 0,
				currencyCode: CurrencyCode.QAR,
			},
			[CurrencyCode.BHD]: {
				amount: 0,
				minorAmount: 52,
				currencyCode: CurrencyCode.BHD,
			},
			[CurrencyCode.KWD]: {
				amount: 0,
				minorAmount: 42,
				currencyCode: CurrencyCode.KWD,
			},
			[CurrencyCode.OMR]: {
				amount: 0,
				minorAmount: 53,
				currencyCode: CurrencyCode.OMR,
			},
			[CurrencyCode.SAR]: {
				amount: 5,
				minorAmount: 14,
				currencyCode: CurrencyCode.SAR,
			},
			[CurrencyCode.AED]: {
				amount: 5,
				minorAmount: 3,
				currencyCode: CurrencyCode.AED,
			},
			[CurrencyCode.USD]: {
				amount: 1,
				minorAmount: 37,
				currencyCode: CurrencyCode.USD,
			},
		};

	/**
	 * Interval between each sync of exchange rates. The current value is 5 minutes
	 */
	private static readonly EXCHANGE_RATE_INTERVAL = 5 * 60000;

	/**
	 * The last time we synced the exchange rates
	 */
	private _lastSyncAt: Date | null = null;

	/**
	 * A list of exchange rates that will be used to calculate the price of product variants
	 */
	private _exchangeRates: Array<ExchangeRate> = [];

	/**
	 * Initialize the pricing service
	 *
	 * @param exchangeRateRepository
	 */
	constructor(@InjectRepository(ExchangeRate) private readonly exchangeRateRepository: Repository<ExchangeRate>) {
		this.syncExchangeRates();
	}

	/**
	 * Syncs the exchange rates
	 */
	async syncExchangeRates() {
		const now = new Date();
		if (this._lastSyncAt !== null && now.getTime() - this._lastSyncAt.getTime() < PricingService.EXCHANGE_RATE_INTERVAL) {
			return;
		}

		// Populate the exchange rates
		this._exchangeRates = await this.exchangeRateRepository.find({
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
		this._lastSyncAt = now;
	}

	/**
	 * Returns the price of a product based on a currency code
	 *
	 * @param product
	 * @param variant
	 * @param campaign
	 * @param currency
	 * @param applyDiscount
	 * @returns
	 */
	async applyPriceOnProductVariant(product: Product, variant: ProductVariant, campaign: Campaign | null, currency: CurrencyCode, applyDiscount: boolean): Promise<Money> {
		this.logger.log(`Calculating the price of product: ${product.uuid}, variant: ${variant.uuid}, currencyCode: ${currency}`);

		// Resync the exchange rates after every 5 minutes
		this.syncExchangeRates();

		// The pricing factor applied on each product variant
		const pricingFactor = this.__getPricingFactor(product, campaign);

		// Calculate exchange rate factor
		const exchangeRateFactor = this.__getExchangeRateFactor(currency);

		// The discount factor applied on each product variant
		const discountPercentage = this.__getDiscountPercentage(product, campaign);

		// The minimum price of the product
		let minPrice: Money = {
			amount: 0,
			minorAmount: 0,
			currencyCode: currency,
		};

		// Get minimum price based on the currency
		if (PricingService.MIN_PRICE_MAP[currency] !== undefined && PricingService.MIN_PRICE_MAP[currency] !== null) {
			minPrice = PricingService.MIN_PRICE_MAP[currency];
		}

		// Apply the discount and return the discounted price
		if (applyDiscount && discountPercentage !== 0) {
			return maxMoney([minPrice, getDiscountedPrice(variant.cost, currency, pricingFactor, exchangeRateFactor, discountPercentage)]);
		}

		// Don't apply any discount and return full price
		return maxMoney([minPrice, getBasePrice(variant.cost, currency, pricingFactor, exchangeRateFactor)]);
	}

	/**
	 * Returns the current pricing factor based on the campaign and falls back to product category based pricing factor
	 *
	 * @param product
	 * @param campaign
	 * @returns
	 */
	__getPricingFactor(product: Product, campaign: Campaign | null): number {
		let pricingFactor: number = 0;

		// Apply the pricing factor from the campaign
		if (product !== null && campaign !== null && campaign !== undefined && campaign.isActive) {
			pricingFactor = Math.max(pricingFactor, campaign.pricingFactor);
		}

		// As a fallback, calculate the pricing factor from the categories applied on the product
		if (pricingFactor === 0 && product !== null && Array.isArray(product.productCategories) && product.productCategories.length !== 0) {
			pricingFactor = Math.max(pricingFactor, ...(
				product.productCategories
					.filter(entry => entry.category !== null && entry.category !== undefined)
					.map(entry => entry.category.pricingFactor)
			));
		}

		return pricingFactor;
	}

	/**
	 * Returns the current exchange rate for a given currency
	 *
	 * @param currency
	 * @returns
	 */
	__getExchangeRateFactor(currency: CurrencyCode): number {
		let exchangeRateFactor = 1;

		// Make sure we have an exchange rate
		if (!Array.isArray(this._exchangeRates) || this._exchangeRates.length === 0) {
			this.logger.error(`Failed to find the exchange rates. Please create exchange rates for target currency code: ${currency}`);
			return -1;
		}

		// Find the exchange rate for the request currency code, if there is no exchange rate, we will no longer continue
		const exchangeRate = this._exchangeRates.find(exchangeRate => exchangeRate.targetCurrencyCode.toLowerCase().trim() === currency.toLowerCase().trim()) ?? null;
		if (exchangeRate === null) {
			this.logger.error(`Failed to find the exchange rate for currency code: ${currency}`);
			return -1;
		}

		// Parse the exchange rate factor to a float
		try {
			exchangeRateFactor = parseFloat((exchangeRate.factor as unknown) as string);
		} catch (err) {
			this.logger.error(err);
		}

		return exchangeRateFactor;
	}

	/**
	 * Returns the current discount percentage based on the campaign and falls back to product category based discount percentage
	 *
	 * @param product
	 * @param campaign
	 * @returns
	 */
	__getDiscountPercentage(product: Product, campaign: Campaign | null): number {
		let discountPercentage: number = 0;

		// Apply the discount factor from the campaign
		if (product !== null && campaign !== null && campaign !== undefined && campaign.isActive) {
			discountPercentage = Math.max(discountPercentage, campaign.discountPercentage);
		}

		// As a fallback, calculate the discount factor from the categories applied on the product
		if (discountPercentage === 0 && product !== null && Array.isArray(product.productCategories) && product.productCategories.length !== 0) {
			discountPercentage = Math.max(discountPercentage, ...(
				product.productCategories
					.filter(entry => entry.category !== null && entry.category !== undefined)
					.map(entry => entry.category.discountPercentage))
			);
		}

		return discountPercentage;
	}
}

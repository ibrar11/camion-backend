import crypto from "node:crypto";

import {
	ConflictException,
	Inject,
	Injectable,
	Logger,
	NotFoundException,
} from "@nestjs/common";

import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";

import { plainToInstance } from "class-transformer";

import { CACHE_MANAGER, Cache } from "@nestjs/cache-manager";

import { generateCacheKey } from "../common/cache";

import { CreateCurrencyDto } from "./dtos/CreateCurrencyDto";
import { UpdateCurrencyDto } from "./dtos/UpdateCurrencyDto";

import { Currency } from "./entities/currency.entity";

@Injectable()
export class CurrenciesService {
	private readonly logger = new Logger(CurrenciesService.name);

	constructor(
		@InjectRepository(Currency) private readonly currencyRepository: Repository<Currency>,
		@Inject(CACHE_MANAGER) private readonly cacheManager: Cache,
	) { }

	/**
	 * Create a new currency
	 * @param body
	 * @returns Currency
	 */
	async create(body: CreateCurrencyDto): Promise<Currency> {
		this.logger.log(`Creating currency, name: ${body.name}, alphaCode: ${body.alphaCode}`);

		const alphaCode = body.alphaCode.trim().toUpperCase();

		const existing = await this.currencyRepository.findOneBy({ alphaCode });
		if (existing) {
			throw new ConflictException({ error: "A currency with this alpha code already exists." });
		}

		const currency = new Currency();
		currency.uuid = crypto.randomUUID();
		currency.name = body.name.trim();
		currency.alphaCode = alphaCode;

		return this.currencyRepository.save(currency);
	}

	/**
	 * Retrieve all currencies
	 * @returns Currency[]
	 */
	async findAllCurrencies(): Promise<Currency[]> {
		this.logger.log(`Retrieving currencies`);

		// Generate a cache key
		const cacheKey = generateCacheKey("currencies", "", []);

		// Check in the cache if the currencies exist
		const currenciesInCache = await this.cacheManager.get<Array<Currency>>(cacheKey);
		if (currenciesInCache) {
			return currenciesInCache;
		}

		// Find the currencies
		const currencies = await this.currencyRepository.find({
			order: { name: "ASC" },
		});

		// Save the currencies in cache
		await this.cacheManager.set(cacheKey, plainToInstance(Currency, currencies), 500000);

		return currencies;
	}

	/**
	 * Update a currency by UUID
	 * @param uuid
	 * @param body
	 * @returns Currency
	 */
	async update(uuid: string, body: UpdateCurrencyDto): Promise<Currency> {
		const currency = await this.currencyRepository.findOneBy({ uuid });
		if (!currency) {
			throw new NotFoundException({
				error: "Failed to find the currency. Please check and try again.",
			});
		}

		if (body.name !== undefined) {
			currency.name = body.name.trim();
		}

		if (body.alphaCode !== undefined) {
			const alphaCode = body.alphaCode.trim().toUpperCase();

			const existing = await this.currencyRepository.findOneBy({ alphaCode });

			if (existing && existing.uuid !== uuid) {
				throw new ConflictException({
					error: "A currency with this alpha code already exists.",
				});
			}

			currency.alphaCode = alphaCode;
		}

		return this.currencyRepository.save(currency);
	}

	/**
	 * Delete a currency by UUID
	 * @param uuid
	 * @returns void
	 */
	async delete(uuid: string): Promise<void> {
		await this.currencyRepository.delete({ uuid });
	}
}

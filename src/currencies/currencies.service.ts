import crypto from "node:crypto";

import {
	ConflictException,
	Injectable,
	Logger,
	NotFoundException,
} from "@nestjs/common";

import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";

import { CreateCurrencyDto } from "./dtos/CreateCurrencyDto";
import { UpdateCurrencyDto } from "./dtos/UpdateCurrencyDto";

import { Currency } from "./entities/currency.entity";

@Injectable()
export class CurrenciesService {
	private readonly logger = new Logger(CurrenciesService.name);

	constructor(
		@InjectRepository(Currency) private readonly currencyRepository: Repository<Currency>,
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
	findAllCurrencies(): Promise<Currency[]> {
		this.logger.log(`Retrieving currencies`);

		// Find the currencies
		return this.currencyRepository.find({
			cache: true,
			order: { name: "ASC" },
		});
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

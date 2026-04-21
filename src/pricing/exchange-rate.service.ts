import * as crypto from "node:crypto";

import {
	Injectable,
	Logger,
	NotFoundException,
} from "@nestjs/common";

import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";

import { getSkipAndTake } from "../common/pagination";

import { CreateExchangeRateDto } from "./dtos/CreateExchangeRateDto";
import { UpdateExchangeRateDto } from "./dtos/UpdateExchangeRateDto";

import { ExchangeRate } from "./entities/exchange-rate.entity";

@Injectable()
export class ExchangeRateService {
	private readonly logger = new Logger(ExchangeRateService.name);

	constructor(
		@InjectRepository(ExchangeRate) private readonly exchangeRateRepository: Repository<ExchangeRate>,
	) { }


	/**
	 * Creates a new exchange rate
	 *
	 * @param body
	 * @returns
	 */
	async createExchangeRate(body: CreateExchangeRateDto): Promise<ExchangeRate> {
		this.logger.log(`Creating exchange rate for src: ${body.srcCurrencyCode}, to: ${body.targetCurrencyCode}`);

		const exchangeRate = new ExchangeRate();
		exchangeRate.uuid = crypto.randomUUID();
		exchangeRate.srcCurrencyCode = body.srcCurrencyCode;
		exchangeRate.targetCurrencyCode = body.targetCurrencyCode;
		exchangeRate.factor = body.factor;
		return this.exchangeRateRepository.save(exchangeRate);
	}

	/**
	 * Returns the exchange rates
	 *
	 * @param filters
	 * @param sort
	 * @param pageNumber
	 * @param itemsPerPage
	 * @returns
	 */
	async findAll(filters: string, sort: string, pageNumber: number = 1, itemsPerPage: number = 100): Promise<Array<ExchangeRate>> {
		this.logger.log(`Retrieving exchange rates`);

		// Get pagination params
		const { skip, take } = getSkipAndTake(pageNumber, itemsPerPage);

		return this.exchangeRateRepository.find({
			order:{
				id: "DESC",
			},
			skip: skip,
			take: take,
		});
	}

	/**
	 * Finds an exchange rate
	 *
	 * @param exchangeRateUUID
	 * @returns
	 */
	async findOne(exchangeRateUUID: string): Promise<ExchangeRate> {
		this.logger.log(`Retrieving exchange rate by uuid: ${exchangeRateUUID}`);

		// Find the exchange rate
		const exchangeRate = await this.exchangeRateRepository.findOneBy({ uuid: exchangeRateUUID, });
		if (exchangeRate === null) {
			throw new NotFoundException({
				error: "Failed to find the exchange rate. Please check and try again.",
			});
		}
		return exchangeRate;
	}

	/**
	 * Updates the exchange rate
	 *
	 * @param exchangeRateUUID
	 * @param body
	 * @returns
	 */
	async updateOne(exchangeRateUUID: string, body: UpdateExchangeRateDto): Promise<ExchangeRate> {
		this.logger.log(`Updating exchange rate by uuid: ${exchangeRateUUID}`);

		// Find the exchange rate
		const exchangeRate = await this.exchangeRateRepository.findOneBy({ uuid: exchangeRateUUID, });
		if (exchangeRate === null) {
			throw new NotFoundException({
				error: "Failed to find the exchange rate. Please check and try again.",
			});
		}

		// Update the exchange rate
		exchangeRate.srcCurrencyCode = body.srcCurrencyCode;
		exchangeRate.targetCurrencyCode = body.targetCurrencyCode;
		exchangeRate.factor = body.factor;
		return this.exchangeRateRepository.save(exchangeRate);
	}

	/**
	 * Deletes an exchange rate
	 *
	 * @param exchangeRateUUID
	 */
	async delete(exchangeRateUUID: string): Promise<void> {
		await this.exchangeRateRepository.delete({
			uuid: exchangeRateUUID,
		});
	}
}

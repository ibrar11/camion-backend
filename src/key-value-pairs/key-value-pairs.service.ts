import * as crypto from "node:crypto";

import {
	BadRequestException,
	Injectable,
	Logger,
	NotFoundException,
} from "@nestjs/common";

import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";

import { getSkipAndTake } from "../common/pagination";

import { CreateKeyValuePairDto } from "./dtos/CreateKeyValuePairDto";
import { UpdateKeyValuePairDto } from "./dtos/UpdateKeyValuePairDto";

import { KeyValuePair } from "./entities/key-value-pair.entity";

@Injectable()
export class KeyValuePairsService {
	private readonly logger = new Logger(KeyValuePairsService.name);

	constructor(
		@InjectRepository(KeyValuePair) private readonly keyValuePairRepository: Repository<KeyValuePair>,
	) { }

	/**
	 * Creates a new key value pair
	 *
	 * @param body
	 * @returns
	 */
	async createKeyValuePair(body: CreateKeyValuePairDto): Promise<KeyValuePair> {
		this.logger.log(`Creating key value pair`);

		// Check if a key pair already exist by the same name
		const existing = await this.keyValuePairRepository.findOneBy({
			name: body.name.toLowerCase().trim(),
		});

		if (existing) {
			throw new BadRequestException({
				errors: {
					name: "A key value pair already exists. Please check and try again.",
				},
			});
		}

		// Create a new key/value pair
		const keyValuePair = new KeyValuePair();
		keyValuePair.uuid = crypto.randomUUID();
		keyValuePair.name = body.name.toLowerCase().trim();
		keyValuePair.type = body.type;
		keyValuePair.integerValue = body.integerValue;
		keyValuePair.decimalValue = body.decimalValue;
		keyValuePair.stringValue = body.stringValue;
		keyValuePair.booleanValue = body.booleanValue;
		return this.keyValuePairRepository.save(keyValuePair);
	}

	/**
	 * Retrieves a list of key value pairs
	 *
	 * @param filters
	 * @param sort
	 * @param pageNumber
	 * @param itemsPerPage
	 * @returns
	 */
	findAll(filters: string, sort: string, pageNumber: number = 1, itemsPerPage: number = 100): Promise<Array<KeyValuePair>> {
		this.logger.log(`Retrieving key value pairs`);

		// Get pagination params
		const { skip, take } = getSkipAndTake(pageNumber, itemsPerPage);

		return this.keyValuePairRepository.find({
			order: {
				id: "DESC",
			},
			skip: skip,
			take: take,
		});
	}

	/**
	 * Retrieves a key value pair
	 *
	 * @param uuid
	 * @returns
	 */
	async findOne(uuid: string): Promise<KeyValuePair> {
		this.logger.log(`Retrieving key value pair: ${uuid}`);

		// Find the key value pair
		const keyValuePair = await this.keyValuePairRepository.findOneBy({ uuid: uuid, });
		if (keyValuePair === null) {
			throw new NotFoundException({
				error: "Failed to find the key value pair. Please check and try again.",
			});
		}
		return keyValuePair;
	}

	/**
	 * Updates a key value pair
	 *
	 * @param uuid
	 * @param body
	 * @returns
	 */
	async updateOne(uuid: string, body: UpdateKeyValuePairDto): Promise<KeyValuePair> {
		this.logger.log(`Updating key value pair: ${uuid}`);

		// Make sure their isn't an existing key value pair
		const existing = await this.keyValuePairRepository.findOneBy({
			name: body.name.toLowerCase().trim(),
		});

		if (existing !== null && existing.uuid !== uuid) {
			throw new BadRequestException({
				error: {
					name: "An existing key value pair already exists. Please check and try again.",
				},
			});
		}

		// Find the key value pair
		const keyValuePair = await this.keyValuePairRepository.findOneBy({ uuid: uuid, });
		if (keyValuePair === null) {
			throw new NotFoundException({
				error: "Failed to find the key value pair. Please check and try again.",
			});
		}

		// Update the key value pair
		keyValuePair.name = body.name.toLowerCase().trim();
		keyValuePair.type = body.type;
		keyValuePair.integerValue = body.integerValue;
		keyValuePair.decimalValue = body.decimalValue;
		keyValuePair.stringValue = body.stringValue;
		keyValuePair.booleanValue = body.booleanValue;
		return this.keyValuePairRepository.save(keyValuePair);
	}

	/**
	 * Deletes a key value pair
	 *
	 * @param uuid
	 */
	async delete(uuid: string): Promise<void> {
		await this.keyValuePairRepository.delete({
			uuid: uuid,
		});
	}
}

import crypto from "node:crypto";

import {
	Logger,
	NotFoundException,
} from "@nestjs/common";

import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";

import { getSkipAndTake } from "../common/pagination";

import { CreateWarehouseDto } from "./dtos/CreateWarehouseDto";
import { UpdateWarehouseDto } from "./dtos/UpdateWarehouseDto";

import { Warehouse } from "./entities/warehouse.entity";

export class WarehouseService {
	private readonly logger = new Logger(WarehouseService.name);

	constructor(@InjectRepository(Warehouse) private readonly warehouseRepository: Repository<Warehouse>) { }

	/**
	 * Creates a warehouse
	 *
	 * @param body
	 * @returns
	 */
	createWarehouse(body: CreateWarehouseDto): Promise<Warehouse> {
		this.logger.log(`Attempting to create a warehouse: ${body.name}`);

		const warehouse = new Warehouse();
		warehouse.uuid = crypto.randomUUID();
		warehouse.name = body.name.trim();
		warehouse.code = body.code.trim();
		warehouse.addressLine1 = body.addressLine1.trim();
		warehouse.addressLine2 = body.addressLine2.trim();
		warehouse.country = body.country.trim();
		warehouse.state = body.state.trim();
		warehouse.city = body.city.trim();
		warehouse.isActive = true;
		return this.warehouseRepository.save(warehouse);
	}

	/**
	 * Returns a list of warehouses
	 *
	 * @param filters
	 * @param sort
	 * @param pageNumber
	 * @param itemsPerPage
	 * @returns
	 */
	findAll(filters: string, sort: string, pageNumber: number = 1, itemsPerPage: number = 100): Promise<Array<Warehouse>> {
		this.logger.log(`Retrieving warehouses`);

		// Get pagination params
		const { skip, take } = getSkipAndTake(pageNumber, itemsPerPage);

		return this.warehouseRepository.find({
			skip: skip,
			take: take,
		});
	}

	/**
	 * Finds a warehouse
	 *
	 * @param uuid
	 * @returns
	 */
	async findOne(uuid: string): Promise<Warehouse> {
		this.logger.log(`Retrieving warehouse: ${uuid}`);

		// Find the warehouse
		const warehouse = await this.warehouseRepository.findOneBy({ uuid: uuid, });
		if (warehouse === null) {
			throw new NotFoundException({
				error: "Failed to find the warehouse. Please check and try again.",
			});
		}
		return warehouse;
	}

	/**
	 * Updates the warehouse
	 *
	 * @param uuid
	 * @param body
	 * @returns
	 */
	async updateWarehouse(uuid: string, body: UpdateWarehouseDto): Promise<Warehouse> {
		this.logger.log(`Updating warehouse: ${uuid}`);

		const warehouse = await this.warehouseRepository.findOneBy({ uuid: uuid, });
		if (warehouse === null) {
			throw new NotFoundException({
				error: "Failed to find the warehouse. Please check and try again.",
			});
		}

		// Update the warehouse
		warehouse.name = body.name.trim();
		warehouse.code = body.code.trim();
		warehouse.addressLine1 = body.addressLine1.trim();
		warehouse.addressLine2 = body.addressLine2.trim();
		warehouse.country = body.country.trim();
		warehouse.state = body.state.trim();
		warehouse.city = body.city.trim();
		return this.warehouseRepository.save(warehouse);
	}

	/**
	 * Deletes a warehouse
	 *
	 * @param uuid
	 */
	async delete(uuid: string): Promise<void> {
		await this.warehouseRepository.delete({
			uuid: uuid,
		});
	}
}

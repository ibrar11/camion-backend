import * as crypto from "node:crypto";

import {
	Injectable,
	Logger,
	NotFoundException,
} from "@nestjs/common";

import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";

import { parsePhoneNumberFromString } from "libphonenumber-js";

import { getSkipAndTake } from "src/common/pagination";

import { CreateCustomerAddressDto } from "./dtos/CreateCustomerAddressDto";
import { UpdateCustomerAddressDto } from "./dtos/UpdateCustomerAddressDto";
import { PatchCustomerAddressDto } from "./dtos/PatchCustomerAddressDto";

import { Customer } from "./entities/customer.entity";
import { CustomerAddress } from "./entities/customer-address.entity";

@Injectable()
export class CustomerAddressesService {
	private readonly logger = new Logger(CustomerAddressesService.name);

	constructor(@InjectRepository(CustomerAddress) private readonly customerAddressRepository: Repository<CustomerAddress>) { }

	/**
	 * Creates an address for a customer
	 *
	 * @param customer
	 * @param body
	 * @returns
	 */
	async createCustomerAddress(customer: Customer, body: CreateCustomerAddressDto): Promise<CustomerAddress> {
		this.logger.log(`Creating customer address for customer: ${customer.uuid}`);

		// Remove the prefix + sign from the country code
		let countryCode = body.countryCode;
		if (countryCode !== null && countryCode !== undefined && countryCode.startsWith('+')) {
			countryCode = countryCode.substring(1);
		}

		// Trim the phone number
		if (body.phoneNumber !== null) {
			body.phoneNumber = body.phoneNumber.trim();
		}

		// Format the phone number if a country code is provided
		if (body.phoneNumber !== null && countryCode !== null) {
			body.phoneNumber = parsePhoneNumberFromString(body.phoneNumber, { defaultCallingCode: countryCode, extract: false, })?.formatInternational() as string;
		}

		// Make sure we have a single default address
		let isDefault = true;

		const addresses = await this.customerAddressRepository.findBy({
			customer: {
				id: customer.id,
			},
		});

		if (addresses.length !== 0) {
			isDefault = false;
		}

		// Create a new address
		const address = new CustomerAddress();
		address.uuid = crypto.randomUUID();
		address.customer = customer;
		address.fullName = body.fullName.trim();
		address.phoneNumber = body.phoneNumber.trim();
		address.streetAddress = body.streetAddress.trim();
		address.apartment = body.apartment.trim();
		address.zipCode = body.zipCode.trim();
		address.city = body.city.trim();
		address.state = body.state.trim();
		address.country = body.country.trim();
		address.isDefault = isDefault;
		return this.customerAddressRepository.save(address);
	}

	/**
	 * Finds a list of customer addresses
	 *
	 * @param customer
	 * @param sort
	 * @param pageNumber
	 * @param itemsPerPage
	 * @returns
	 */
	findAll(customer: Customer, sort: string, pageNumber: number = 1, itemsPerPage: number = 100): Promise<Array<CustomerAddress>> {
		this.logger.log(`Retrieving customer addresses`);

		// Get pagination params
		const { skip, take } = getSkipAndTake(pageNumber, itemsPerPage);

		return this.customerAddressRepository.find({
			where: {
				customer: {
					id: customer.id,
				},
			},
			skip: skip,
			take: take,
		});
	}

	/**
	 * Finds a customer address
	 *
	 * @param customer
	 * @param uuid
	 * @returns
	 */
	async findOne(customer: Customer, uuid: string): Promise<CustomerAddress> {
		this.logger.log(`Retrieving customer address: ${uuid}`);

		// Find the customer address
		const address = await this.customerAddressRepository.findOneBy({ uuid: uuid, });
		if (address === null) {
			throw new NotFoundException({
				error: "Failed to find the address",
			});
		}
		return address;
	}

	/**
	 * Patch the customer address as default
	 *
	 * @param customer
	 * @param uuid
	 * @param body
	 * @returns
	 */
	async patchCustomerAddressAsDefault(customer: Customer, uuid: string, body: PatchCustomerAddressDto): Promise<CustomerAddress> {
		this.logger.log(`Updating customer address: ${uuid}`);

		// Find the customer address
		const address = await this.customerAddressRepository.findOneBy({ uuid: uuid, });
		if (address === null) {
			throw new NotFoundException({
				error: "Failed to find the address",
			});
		}

		// Patch the customer address
		address.isDefault = body.isDefault;
		return this.customerAddressRepository.save(address);
	}

	/**
	 * Updates the customer address
	 *
	 * @param customer
	 * @param uuid
	 * @param body
	 * @returns
	 */
	async updateCustomerAddress(customer: Customer, uuid: string, body: UpdateCustomerAddressDto): Promise<CustomerAddress> {
		this.logger.log(`Updating customer address: ${uuid}`);

		// Find the customer address
		const address = await this.customerAddressRepository.findOneBy({ uuid: uuid, });
		if (address === null) {
			throw new NotFoundException({
				error: "Failed to find the address",
			});
		}

		// Update the customer address
		address.fullName = body.fullName.trim();
		address.phoneNumber = body.phoneNumber.trim();
		address.streetAddress = body.streetAddress.trim();
		address.apartment = body.apartment.trim();
		address.zipCode = body.zipCode.trim();
		address.city = body.city.trim();
		address.state = body.state.trim();
		address.country = body.country.trim();
		return this.customerAddressRepository.save(address);
	}

	/**
	 * Deletes a customer address
	 *
	 * @param customer
	 * @param uuid
	 */
	async delete(customer: Customer, uuid: string): Promise<void> {
		this.logger.log(`Deleting customer address: ${uuid}`);

		await this.customerAddressRepository.delete({ uuid: uuid, });
	}
}

import * as crypto from "node:crypto";

import {
	BadRequestException,
	ConflictException,
	ForbiddenException,
	Injectable,
	Logger,
	NotFoundException,
} from "@nestjs/common";

import { InjectRepository } from "@nestjs/typeorm";
import { Not, Repository } from "typeorm";

import { parsePhoneNumberFromString } from "libphonenumber-js";

import { getSkipAndTake } from "../common/pagination";

import { CreateCustomerAddressDto } from "./dtos/CreateCustomerAddressDto";
import { UpdateCustomerAddressDto } from "./dtos/UpdateCustomerAddressDto";
import { PatchCustomerAddressDto } from "./dtos/PatchCustomerAddressDto";

import { Customer } from "./entities/customer.entity";
import { CustomerAddress } from "./entities/customer-address.entity";

@Injectable()
export class CustomerAddressesService {
	private readonly logger = new Logger(CustomerAddressesService.name);

	constructor(
		@InjectRepository(Customer) private readonly customerRepository: Repository<Customer>,
		@InjectRepository(CustomerAddress) private readonly customerAddressRepository: Repository<CustomerAddress>,
	) { }

	/**
	 * Creates an address for a customer
	 *
	 * @param customerUUID
	 * @param body
	 * @returns
	 */
	async createCustomerAddress(customerUUID: string, body: CreateCustomerAddressDto): Promise<CustomerAddress> {
		this.logger.log(`Creating customer address for customer: ${customerUUID}`);

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

		// Find the customer
		const customer = await this.customerRepository.findOneBy({ uuid: customerUUID, });
		if (customer === null) {
			throw new BadRequestException({
				error: "Failed to find the customer. Please check and try again.",
			});
		}

		// Find previous address of the customer
		const addresses = await this.customerAddressRepository.find({
			where: {
				customer: {
					id: customer.id,
				},
			},
			skip: 0,
			take: 10,
		});

		// Make sure the customer is not able to create nore than 10 addresses
		if (addresses.length >= 10) {
			throw new ConflictException({
				error: "Failed to create another address. You've exceeded the maximum number of addresses.",
			});
		}

		// Disable previous addresses as default
		await this.customerAddressRepository.update({
			customer: { id: customer.id, },
		}, {
			isDefault: false,
		});

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
		address.isDefault = true;
		return this.customerAddressRepository.save(address);
	}

	/**
	 * Returns the addresses of a customer
	 *
	 * @param customerUUID
	 * @param pageNumber
	 * @param itemsPerPage
	 * @returns
	 */
	async findAllByCustomer(customerUUID: string, pageNumber: number = 1, itemsPerPage: number = 100): Promise<Array<CustomerAddress>> {
		this.logger.log(`Retrieving customer addresses for customer: ${customerUUID}`);

		// Find the customer
		const customer = await this.customerRepository.findOneBy({ uuid: customerUUID });
		if (customer === null) {
			throw new NotFoundException({
				error: "Failed to find the customer. Please check and try again.",
			});
		}

		// Get pagination params
		const { skip, take } = getSkipAndTake(pageNumber, itemsPerPage);

		return this.customerAddressRepository.find({
			// cache: true,
			where: {
				customer: {
					id: customer.id,
				},
			},
			order: {
				id: "DESC",
			},
			skip: skip,
			take: take,
		});
	}

	/**
	 * Finds a customer address
	 *
	 * @param customerUUID
	 * @param customerAddressUUID
	 * @returns
	 */
	async findOne(customerUUID: string, customerAddressUUID: string): Promise<CustomerAddress> {
		this.logger.log(`Retrieving customer address: ${customerAddressUUID}`);

		// Find the customer address
		const address = await this.customerAddressRepository.findOne({
			where: { uuid: customerAddressUUID, },
			relations: {
				customer: true,
			},
		});

		// Make sure the address exists
		if (address === null) {
			throw new NotFoundException({
				error: "Failed to find the address. Please check and try again.",
			});
		}

		// Make sure the address belongs to the customer
		if (address.customer !== null && address.customer.uuid !== customerUUID) {
			throw new ForbiddenException({
				error: "You're not allowed to retrieve this address. Please check and try again.",
			});
		}

		return address;
	}

	/**
	 * Patch the customer address as default
	 *
	 * @param customerUUID
	 * @param customerAddressUUID
	 * @param body
	 * @returns
	 */
	async patchCustomerAddressAsDefault(customerUUID: string, customerAddressUUID: string, body: PatchCustomerAddressDto): Promise<CustomerAddress> {
		this.logger.log(`Patching customer address: ${customerAddressUUID} as default`);

		// Find the customer
		const customer = await this.customerRepository.findOneBy({ uuid: customerUUID, });
		if (customer === null) {
			throw new NotFoundException({
				error: "Failed to find the customer. Please check and try again.",
			});
		}

		// Find the customer address
		const address = await this.customerAddressRepository.findOne({
			where: { uuid: customerAddressUUID, },
			relations: {
				customer: true,
			},
		});

		// Make sure the address exists
		if (address === null) {
			throw new NotFoundException({
				error: "Failed to find the address. Please check and try again.",
			});
		}

		// Make sure the address belongs to the customer
		if (address.customer !== null && address.customer.id !== customer.id) {
			throw new ForbiddenException({
				error: "You're not allowed to retrieve this address. Please check and try again.",
			});
		}

		// If the current address is set as default, we need to disable other address as default
		if (body.isDefault) {
			await this.customerAddressRepository.update({
				customer: { id: customer.id, },
				id: Not(address.id),
			}, {
				isDefault: false,
			});
		}

		// Set the current address as default
		address.isDefault = body.isDefault;

		return this.customerAddressRepository.save(address);
	}

	/**
	 * Updates the customer address
	 *
	 * @param customerUUID
	 * @param customerAddressUUID
	 * @param body
	 * @returns
	 */
	async updateCustomerAddress(customerUUID: string, customerAddressUUID: string, body: UpdateCustomerAddressDto): Promise<CustomerAddress> {
		this.logger.log(`Updating customer address: ${customerAddressUUID}`);

		// Find the customer address
		const address = await this.customerAddressRepository.findOne({
			where: { uuid: customerAddressUUID, },
			relations: {
				customer: true,
			},
		});

		// Make sure the address exists
		if (address === null) {
			throw new NotFoundException({
				error: "Failed to find the address. Please check and try again.",
			});
		}

		// Make sure the address belongs to the customer
		if (address.customer !== null && address.customer.uuid !== customerUUID) {
			throw new ForbiddenException({
				error: "You're not allowed to retrieve this address. Please check and try again.",
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
	 * @param customerUUID
	 * @param customerAddressUUID
	 */
	async delete(customerUUID: string, customerAddressUUID: string): Promise<void> {
		this.logger.log(`Deleting customer address: ${customerAddressUUID}`);

		// Find the customer address
		const address = await this.customerAddressRepository.findOne({
			where: { uuid: customerAddressUUID, },
			relations: {
				customer: true,
			},
		});

		// Make sure the address belongs to the customer
		if (address !== null && address.customer !== null && address.customer.uuid !== customerUUID) {
			throw new ForbiddenException({
				error: "You're not allowed to retrieve this address. Please check and try again.",
			});
		}

		// Make sure the default customer address cannot be deleted.
		if (address !== null && address.isDefault) {
			throw new ConflictException({
				error: "You cannot delete your default address. Please disable this address as default and try again.",
			});
		}

		await this.customerAddressRepository.delete({ uuid: customerAddressUUID, });
	}
}

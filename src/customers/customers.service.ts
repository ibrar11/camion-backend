import * as crypto from "node:crypto";

import * as bcrypt from "bcrypt";

import {
	BadRequestException,
	Injectable,
	NotFoundException,
} from '@nestjs/common';

import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { CountryCode, parsePhoneNumberFromString } from "libphonenumber-js";

import { CreateCustomerDto } from './dtos/CreateCustomerDto';
import { UpdateCustomerDto } from "./dtos/UpdateCustomerDto";
import { UpdateEmailAddressDto } from "./dtos/UpdateEmailAddressDto";
import { UpdatePasswordDto } from "./dtos/UpdatePasswordDto";

import { Customer } from './entities/customer.entity';

@Injectable()
export class CustomersService {
	constructor(@InjectRepository(Customer) private readonly customerRepository: Repository<Customer>) {
	}

	/**
	 * Creates a customer
	 *
	 * @param body
	 * @returns
	 */
	async createCustomer(body: CreateCustomerDto) {
		// Trim the phone number
		if (body.phoneNumber !== null) {
			body.phoneNumber = body.phoneNumber.trim();
		}

		// Format the phone number if a country code is provided
		if (body.phoneNumber !== null && body.countryCode !== null) {
			body.phoneNumber = parsePhoneNumberFromString(body.phoneNumber, body.countryCode as CountryCode)?.formatInternational() as string;
		}

		// Check if the customer exists by email address
		if (body.emailAddress !== null) {
			const customerByEmailAddress = await this.customerRepository.findOneBy({
				emailAddress: body.emailAddress.trim().toLowerCase(),
			});

			// Make sure we don't create another customer using the same email address
			if (customerByEmailAddress !== null) {
				throw new BadRequestException({
					status: "fail",
					errors: {
						emailAddress: "Email address already exists. Please use a different email address.",
					},
				});
			}
		}

		// Check if the customer exists by phone number
		if (body.phoneNumber !== null) {
			const customerByPhoneNumber = await this.customerRepository.findOneBy({
				phoneNumber: body.phoneNumber,
			});

			// Make sure we don't create another customer using the same phone number
			if (customerByPhoneNumber !== null) {
				throw new BadRequestException({
					status: "fail",
					errors: {
						phoneNumber: "Phone number already exists. Please use a different phone number.",
					},
				});
			}
		}

		// Make sure at least one ID is available
		if (body.emailAddress === null && body.phoneNumber === null) {
			throw new BadRequestException({
				status: "fail",
				errors: {
					emailAddress: "Please provide your email address.",
				},
			});
		}

		const customer = new Customer();
		customer.uuid = crypto.randomUUID();
		customer.fullName = body.fullName.trim();
		customer.emailAddress = body.emailAddress !== null
			? body.emailAddress.trim().toLowerCase()
			: null;
		customer.phoneNumber = body.phoneNumber !== null
			? body.phoneNumber.trim()
			: null;
		customer.password = await bcrypt.hash(body.password.trim(), 10);
		return this.customerRepository.save(customer);
	}

	/**
	 * Finds a list of customers
	 *
	 * @returns
	 */
	findAll(): Promise<Customer[]> {
		return this.customerRepository.find();
	}

	/**
	 * Finds a customer
	 *
	 * @param uuid
	 * @returns
	 */
	async findOne(uuid: string): Promise<Customer> {
		const customer = await this.customerRepository.findOneBy({ uuid: uuid, });
		if (customer === null) {
			throw new NotFoundException({
				status: "fail",
			});
		}
		return customer;
	}

	/**
	 * Updates a customer
	 *
	 * @param uuid
	 * @param body
	 * @returns
	 */
	async updateCustomer(uuid: string, body: UpdateCustomerDto): Promise<Customer> {
		// Find the customer
		const customer = await this.customerRepository.findOneBy({ uuid: uuid, });
		if (customer === null) {
			throw new BadRequestException({
				status: "fail",
				errors: {
					error: "Failed to find the customer by the provided uuid. Please check and try again.",
				},
			});
		}

		customer.fullName = body.fullName.trim();
		return this.customerRepository.save(customer);
	}

	/**
	 * Updates the customer's email address
	 *
	 * @param uuid
	 * @param body
	 * @returns
	 */
	async updateEmailAddress(uuid: string, body: UpdateEmailAddressDto): Promise<Customer> {
		// Check if a customer exists by email address
		const customerByEmailAddress = await this.customerRepository.findOneBy({
			emailAddress: body.emailAddress.trim().toLowerCase(),
		});

		// Make sure we don't create another customer using the same email address
		if (customerByEmailAddress !== null && customerByEmailAddress.uuid !== uuid) {
			throw new BadRequestException({
				status: "fail",
				errors: {
					error: "Email address already exists. Please use a different email address.",
				},
			});
		}

		// Find the customer
		const customer = await this.customerRepository.findOneBy({ uuid: uuid, });
		if (customer === null) {
			throw new BadRequestException({
				status: "fail",
				errors: {
					error: "Failed to find the customer by the provided id. Please check and try again.",
				},
			});
		}

		customer.emailAddress = body.emailAddress.trim().toLowerCase();
		return this.customerRepository.save(customer);
	}

	/**
	 * Updates the customer's password
	 *
	 * @param uuid
	 * @param body
	 * @returns
	 */
	async updatePassword(uuid: string, body: UpdatePasswordDto): Promise<Customer> {
		// Find the customer
		const customer = await this.customerRepository.findOneBy({ uuid: uuid, });
		if (customer === null) {
			throw new BadRequestException({
				status: "fail",
				errors: {
					error: "Failed to find the customer by the provided id. Please check and try again.",
				},
			});
		}

		customer.password = await bcrypt.hash(body.password.trim(), 10);
		return this.customerRepository.save(customer);
	}

	/**
	 * Deletes a customer
	 *
	 * @param uuid
	 */
	async delete(uuid: string): Promise<void> {
		await this.customerRepository.delete({
			uuid: uuid,
		});
	}

    /**
     * Marks a customer account for deletion.
     *
     * The account is not deleted immediately. Instead, it is flagged for deletion,
     * and a scheduled job will permanently deactivate it after the configured grace period.
     *
     * This operation is idempotent — if the account is already deleted, no action is taken.
     *
     * @param customerUuid - The UUID of the customer
     */
    async requestAccountDeletion(customerUuid: string): Promise<void> {
        const customer = await this.customerRepository.findOne({
            where: { uuid: customerUuid },
        });

        if (!customer) {
            throw new NotFoundException('Customer not found');
        }

        if (customer.deletedAt) {
            return; // already deleted (idempotent)
        }

        customer.markedForDeletionAt = new Date();

        await this.customerRepository.save(customer);
    }

    /**
     * Cancels a previously requested account deletion.
     *
     * This removes the deletion flag (`markedForDeletionAt`) and restores the account
     * to its normal active state, provided it has not already been permanently deleted.
     *
     * @param customerUuid - The UUID of the customer
     * @throws BadRequestException if the account is already deleted
     */
    async cancelDeletion(customerUuid: string): Promise<void> {
        const customer = await this.customerRepository.findOne({
            where: { uuid: customerUuid },
        });

        if (!customer) {
            throw new NotFoundException('Customer not found');
        }

        if (customer.deletedAt) {
            throw new BadRequestException('Account already deleted');
        }

        customer.markedForDeletionAt = null;

        await this.customerRepository.save(customer);
    }
}

import * as crypto from "node:crypto";

import * as bcrypt from "bcrypt";

import {
	BadRequestException,
	Injectable,
	Logger,
	NotFoundException,
} from '@nestjs/common';

import { InjectRepository } from '@nestjs/typeorm';
import { ILike, Repository } from 'typeorm';

import { parsePhoneNumberFromString } from "libphonenumber-js";

import { isPhoneNumberValid } from "../common/phone-number-validation";
import { getSkipAndTake } from "../common/pagination";

import { CreateCustomerDto } from './dtos/CreateCustomerDto';
import { UpdateCustomerDto } from "./dtos/UpdateCustomerDto";
import { UpdateEmailAddressDto } from "./dtos/UpdateEmailAddressDto";
import { UpdatePasswordDto } from "./dtos/UpdatePasswordDto";

import { Customer } from './entities/customer.entity';

@Injectable()
export class CustomersService {
	private readonly logger = new Logger(CustomersService.name);

	constructor(@InjectRepository(Customer) private readonly customerRepository: Repository<Customer>) { }

	/**
	 * Creates a customer
	 *
	 * @param body
	 * @returns
	 */
	async createCustomer(body: CreateCustomerDto) {
		this.logger.log(`Creating customer: ${body.fullName}`);

		// Check if the phone number is valid
		if (!isPhoneNumberValid(body.phoneNumber, body.countryCode)) {
			throw new BadRequestException({
				phoneNumber: "Please enter a valid phone number.",
			});
		}

		// Remove the prefix + sign from the country code
		let countryCode = body.countryCode;
		if (countryCode !== null && countryCode !== undefined && countryCode.startsWith('+')) {
			countryCode = countryCode.substring(1);
		}

		// Trim the phone number
		if (body.phoneNumber !== null && body.phoneNumber !== undefined) {
			body.phoneNumber = body.phoneNumber.trim();
		}

		// Format the phone number if a country code is provided
		if (body.phoneNumber !== null && countryCode !== null) {
			body.phoneNumber = parsePhoneNumberFromString(body.phoneNumber, { defaultCallingCode: countryCode, })?.formatInternational() as string;
		}

		// Check if the customer exists by email address
		if (body.emailAddress !== null) {
			const customerByEmailAddress = await this.customerRepository.findOneBy({
				emailAddress: body.emailAddress.trim().toLowerCase(),
			});

			// Make sure we don't create another customer using the same email address
			if (customerByEmailAddress !== null) {
				throw new BadRequestException({
					errors: {
						emailAddress: "Email address already exists. Please use a different email address.",
					},
				});
			}
		}

		// Check if the customer exists by phone number
		if (body.phoneNumber !== null && body.phoneNumber !== undefined) {
			const customerByPhoneNumber = await this.customerRepository.findOneBy({
				phoneNumber: body.phoneNumber,
			});

			// Make sure we don't create another customer using the same phone number
			if (customerByPhoneNumber !== null) {
				throw new BadRequestException({
					errors: {
						phoneNumber: "Phone number already exists. Please use a different phone number.",
					},
				});
			}
		}

		// Make sure at least one ID is available
		if (body.emailAddress === null && body.phoneNumber === null) {
			throw new BadRequestException({
				errors: {
					emailAddress: "Please provide your email address.",
				},
			});
		}

		const customer = new Customer();
		customer.uuid = crypto.randomUUID();
		customer.fullName = body.fullName.trim();
		customer.emailAddress = body.emailAddress.trim().toLowerCase();
		customer.phoneNumber = body.phoneNumber.trim();
		customer.password = await bcrypt.hash(body.password.trim(), 10);
		return this.customerRepository.save(customer);
	}

	/**
	 * Finds a list of customers
	 *
	 * @param filters
	 * @param sort
	 * @param pageNumber
	 * @param itemsPerPage
	 * @returns
	 */
	async findAll(filters: string, sort: string, pageNumber: number = 1, itemsPerPage: number = 100): Promise<Customer[]> {
		this.logger.log(`Retrieving customers for graphql`);

		// Get pagination params
		const { skip, take } = getSkipAndTake(pageNumber, itemsPerPage);

		// Parse the customer filters
		let f = {
			fullName: "",
			emailAddress: "",
			phoneNumber: "",
		};

		try {
			f = JSON.parse(filters);
		} catch {
			f = {
				fullName: "",
				emailAddress: "",
				phoneNumber: "",
			};
		}

		// Find the customer by email address filter
		if (f.emailAddress !== undefined && f.emailAddress !== null && f.emailAddress.length !== 0) {
			const customer = await this.customerRepository.findOneBy({
				emailAddress: f.emailAddress,
			});

			if (customer !== null) {
				return [customer];
			};
		}

		// Find the customer by phone number
		if (f.phoneNumber !== undefined && f.phoneNumber !== null && f.phoneNumber.length !== 0) {
			const customer = await this.customerRepository.findOneBy({
				phoneNumber: f.phoneNumber,
			});

			if (customer !== null) {
				return [customer];
			}
		}

		// Find the customers by their full name
		if (f.fullName !== undefined && f.fullName !== null && f.fullName.length !== 0) {
			return this.customerRepository.createQueryBuilder("customer")
				.where(`LOWER(customer.fullName) LIKE LOWER(:fullName)`, {
					fullName: `%${f.fullName}%`,
				})
				.orderBy("customer.id", "DESC")
				.skip(skip)
				.take(take)
				.getMany();
		}

		return this.customerRepository.find({
			order: {
				id: "DESC",
			},
			skip: skip,
			take: take,
		});
	}

	/**
	 * Returns the estimated count of categories
	 *
	 * @returns
	 */
	countAll(): Promise<number> {
		return this.customerRepository.count({
			cache: true,
		});
	}

	/**
	 * Returns all customers for export
	 *
	 * @param pagesCount
	 * @returns
	 */
	async findAllForExport(pagesCount: number): Promise<Array<Customer>> {
		this.logger.log(`Finding all customers for export in pages`);

		/**
		 * The resulting customers in the list
		 */
		let res: Array<Customer> = [];

		/**
		 * Pagination params
		 */
		let pageNumber = 1,
			itemsPerPage = 24;

		while (pageNumber <= pagesCount) {
			this.logger.log(`Retrieving customers on page: ${pageNumber}`);

			// Get the pagination
			const { skip, take } = getSkipAndTake(pageNumber, itemsPerPage);

			// Fetch the customers
			const customers = await this.customerRepository.find({
				order: {
					id: "DESC",
				},
				skip: skip,
				take: take,
			});

			// Add the customers to the result
			res = res.concat(customers);

			// Break the loop at the end
			if (customers.length < itemsPerPage) {
				break;
			}

			this.logger.log(`Retrieved ${customers.length} on pageNumber: ${pageNumber}`);

			// Increment the page number
			pageNumber += 1;
		}

		return res;
	}

	/**
	 * Finds a customer
	 *
	 * @param uuid
	 * @returns
	 */
	async findOne(uuid: string): Promise<Customer> {
		this.logger.log(`Retrieving customer: ${uuid}`);
		const customer = await this.customerRepository.findOneBy({ uuid: uuid, });
		if (customer === null) {
			throw new NotFoundException({
				error: "Failed to find the customer. Please check and try again.",
			});
		}
		return customer;
	}

	/**
	 * Finds a customer using a cached query
	 *
	 * @param uuid
	 * @returns
	 */
	async findOneCached(uuid: string): Promise<Customer> {
		this.logger.log(`Retrieving cached customer: ${uuid}`);
		const customer = await this.customerRepository.findOne({
			cache: true,
			where: {
				uuid: uuid,
			},
		});
		if (customer === null) {
			throw new NotFoundException({
				error: "Failed to find the customer. Please check and try again.",
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
				error: "Failed to find the customer by the provided uuid. Please check and try again.",
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
				errors: {
					emailAddress: "Email address already exists. Please use a different email address.",
				},
			});
		}

		// Find the customer
		const customer = await this.customerRepository.findOneBy({ uuid: uuid, });
		if (customer === null) {
			throw new BadRequestException({
				error: "Failed to find the customer by the provided id. Please check and try again.",
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
				error: "Failed to find the customer by the provided id. Please check and try again.",
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
			throw new NotFoundException({
				error: 'Customer not found',
			});
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
			throw new NotFoundException({
				error: 'Customer not found',
			});
		}

		if (customer.deletedAt) {
			throw new BadRequestException({
				error: 'Account already deleted',
			});
		}

		customer.markedForDeletionAt = null;

		await this.customerRepository.save(customer);
	}

	async reactivateByEmail(emailAddress: string): Promise<Customer> {
		const customer = await this.customerRepository.findOne({
			where: { emailAddress: emailAddress.toLowerCase().trim() },
		});

		if (!customer) {
			throw new NotFoundException({ error: 'Customer not found with the provided email address.' });
		}

		customer.isActive = true;
		customer.markedForDeletionAt = null;
		customer.deletedAt = null;

		return this.customerRepository.save(customer);
	}

		/**
		 * Backfills cartCount for all customers having zero count.
		 * Run once after deploying the cartCount column.
		 */
		async backfillCartCount(): Promise<{ updated: number }> {
			this.logger.log(`Backfilling cartCount for all customers having zero count`);
	
			const result = await this.customerRepository
				.createQueryBuilder()
				.update(Customer)
				.set({
					cartItemsCount: () => `
						(
							SELECT COUNT(*)
							FROM cart_items ci
							INNER JOIN products p
								ON p.id = ci.product_id
							WHERE ci.customer_id = customers.id
								AND p.status = 'active'
						)
					`,
				})
				.where(`
					cart_items_count = 0
					AND EXISTS (
						SELECT 1
						FROM cart_items ci
						INNER JOIN products p
							ON p.id = ci.product_id
						WHERE ci.customer_id = customers.id
							AND p.status = 'active'
					)
				`)
				.execute();
	
			return { updated: result.affected ?? 0 };
		}
}

import * as crypto from "node:crypto";

import {
	BadRequestException,
	ConflictException,
	ForbiddenException,
	Logger,
	NotFoundException
} from "@nestjs/common";

import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";

import { getSkipAndTake } from "../common/pagination";

import { CreateBankAccountDto } from "./dtos/CreateBankAccountDto";
import { UpdateBankAccountDto } from "./dtos/UpdateBankAccountDto";
import { PatchBankAccountDto } from "./dtos/PatchBankAccountDto";

import { CustomerRole } from "../customers/enums/CustomerRole";

import { BankAccount } from "./entities/bank-account.entity";
import { Customer } from "../customers/entities/customer.entity";

export class BankAccountsService {
	private readonly logger = new Logger(BankAccountsService.name);

	constructor(
		@InjectRepository(Customer) private readonly customerRepository: Repository<Customer>,
		@InjectRepository(BankAccount) private readonly bankAccountRepository: Repository<BankAccount>,
	) { }

	/**
	 * Creates a bank account for an affiliate customer
	 *
	 * @param customerUUID
	 * @param body
	 * @returns
	 */
	async createBankAccount(customerUUID: string, body: CreateBankAccountDto): Promise<BankAccount> {
		this.logger.log(`Creating bank account for customer: ${customerUUID}`);

		// Find the customer
		const customer = await this.customerRepository.findOne({
			where: {
				uuid: customerUUID,
			},
			relations: {
				affiliate: true,
			},
		});

		// Make sure the customer exists
		if (customer === null) {
			throw new NotFoundException({
				error: "Failed to find the customer. Please check and try again.",
			});
		}

		// Make sure the customer is an affiliate or an influnecer
		if (![CustomerRole.Affiliate, CustomerRole.Influencer].includes(customer.role)) {
			throw new ForbiddenException({
				error: "You're not allowed to create bank accounts.",
			});
		}

		// Make sure a bank account doesn't already exist
		const bankAccountByAccountNumber = await this.bankAccountRepository.findOneBy({
			accountNumber: body.accountNumber.toLowerCase().trim(),
		});

		// Make sure a bank account doesn't already exist
		if (bankAccountByAccountNumber !== null) {
			throw new ConflictException({
				errors: {
					accountNumber: "A bank account using the same account number already exists. Please use a different code.",
				},
			});
		}

		// Disable previous bank accounts as default
		await this.bankAccountRepository.update({
			affiliate: {
				id: customer.affiliate.id,
			},
		}, {
			isDefault: false,
		});

		// Create the bank account and mark it as active
		const bankAccount = new BankAccount();
		bankAccount.uuid = crypto.randomUUID();
		bankAccount.affiliate = customer.affiliate;
		bankAccount.bankName = body.bankName.trim();
		bankAccount.accountHolderName = body.accountHolderName.trim();
		bankAccount.accountNumber = body.accountNumber.trim();
		bankAccount.iban = body.iban.trim();
		bankAccount.swiftCode = body.swiftCode.trim();
		bankAccount.isDefault = true;
		return this.bankAccountRepository.save(bankAccount);
	}

	/**
	 * Retrieves a list of bank accounts for a customer
	 *
	 * @param customerUUID
	 * @param filters
	 * @param sort
	 * @param pageNumber
	 * @param itemsPerPage
	 * @returns
	 */
	async findAllByCustomer(customerUUID: string, filters: string, sort: string, pageNumber: number = 1, itemsPerPage: number = 100): Promise<Array<BankAccount>> {
		this.logger.log(`Retrieving a list of bank accounts for customer: ${customerUUID}`);

		// Find the customer
		const customer = await this.customerRepository.findOne({
			where: {
				uuid: customerUUID,
			},
			relations: {
				affiliate: true,
			},
		});

		// Make sure the customer and their affiliate exists
		if (customer === null || customer.affiliate === null) {
			throw new BadRequestException({
				error: "Failed to find the affiliate or the customer. Please check and try again.",
			});
		}

		// Get pagination params
		const { skip, take } = getSkipAndTake(pageNumber, itemsPerPage);

		return this.bankAccountRepository.find({
			where: {
				affiliate: {
					id: customer.affiliate.id,
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
	 * Returns a list of bank accounts
	 *
	 * @param filters
	 * @param sort
	 * @param pageNumber
	 * @param itemsPerPage
	 * @returns
	 */
	async findAll(filters: string, sort: string, pageNumber: number = 1, itemsPerPage: number = 100): Promise<Array<BankAccount>> {
		this.logger.log(`Retrieving a list of bank accounts`);

		// Get pagination params
		const { skip, take } = getSkipAndTake(pageNumber, itemsPerPage);

		return this.bankAccountRepository.find({
			relations: {
				affiliate: {
					customer: true,
				},
			},
			order: {
				id: "DESC",
			},
			skip: skip,
			take: take,
		});
	}

	async findOne(customerUUID: string, bankAccountUUID: string): Promise<BankAccount> {
		this.logger.log(`Retrieving bank account ${bankAccountUUID} for customer: ${customerUUID}`);

		// Find the bank account
		const bankAccount = await this.bankAccountRepository.findOne({
			where: {
				uuid: bankAccountUUID,
			},
			relations: {
				affiliate: {
					customer: true,
				},
			},
		});

		// Make sure the account exists
		if (bankAccount === null || bankAccount.affiliate === null) {
			throw new NotFoundException({
				error: "Failed to find the bank account. Please check and try again.",
			});
		}

		// Make sure the account belongs to the customer
		if (bankAccount?.affiliate?.customer?.uuid !== customerUUID) {
			throw new ForbiddenException({
				error: "You're not authorized to view this account. Please check and try again.",
			});
		}

		return bankAccount;
	}

	async updateBankAccount(customerUUID: string, bankAccountUUID: string, body: UpdateBankAccountDto): Promise<BankAccount> {
		this.logger.log(`Updating coupon by uuid: ${bankAccountUUID} for customer: ${customerUUID}`);

		// Find the bank account
		const bankAccount = await this.bankAccountRepository.findOne({
			where: {
				uuid: bankAccountUUID,
			},
			relations: {
				affiliate: {
					customer: true,
				},
			},
		});

		// Make sure the bank account exists
		if (bankAccount === null) {
			throw new NotFoundException({
				error: "Failed to find the bank account. Please check and try again.",
			});
		}

		// Make sure the coupon belongs to the customer
		if (bankAccount?.affiliate?.customer?.uuid !== customerUUID) {
			throw new ForbiddenException({
				error: "You're not authorized to update this bank account. Please check and try again.",
			});
		}

		// Update the bank account
		bankAccount.bankName = body.bankName.trim();
		bankAccount.accountHolderName = body.accountHolderName.trim();
		bankAccount.accountNumber = body.accountNumber.trim();
		bankAccount.iban = body.iban.trim();
		bankAccount.swiftCode = body.swiftCode.trim();
		return this.bankAccountRepository.save(bankAccount);
	}

	/**
	 * Patch the bank account as default
	 *
	 * @param customerUUID
	 * @param bankAccountUUID
	 */
	async patchBankAccountAsDefault(customerUUID: string, bankAccountUUID: string, body: PatchBankAccountDto): Promise<BankAccount> {
		this.logger.log(`Patching bank account ${bankAccountUUID} as default for customer: ${customerUUID}`);

		// Find the bank account
		const bankAccount = await this.bankAccountRepository.findOne({
			where: {
				uuid: bankAccountUUID,
			},
			relations: {
				affiliate: {
					customer: true,
				},
			},
		});

		// Make sure the bank account exists
		if (bankAccount === null) {
			throw new NotFoundException({
				error: "Failed to find the bank account. Please check and try again.",
			});
		}

		// Make sure the coupon belongs to the customer
		if (bankAccount?.affiliate?.customer?.uuid !== customerUUID) {
			throw new ForbiddenException({
				error: "You're not authorized to update this bank account. Please check and try again.",
			});
		}

		// If the current bank account is set as default, we need to disable other bank accounts as default
		if (body.isDefault) {
			await this.bankAccountRepository.update({
				affiliate: {
					id: bankAccount.affiliate.id,
				},
			}, {
				isDefault: false,
			});
		}

		// Set the currrent bank account as default
		bankAccount.isDefault = body.isDefault;

		return this.bankAccountRepository.save(bankAccount);
	}

	/**
	 * Deletes a bank account
	 *
	 * @param customerUUID
	 * @param bankAccountUUID
	 */
	async delete(customerUUID: string, bankAccountUUID: string): Promise<void> {
		this.logger.log(`Updating bank account by uuid: ${bankAccountUUID} for customer: ${customerUUID}`);

		// Find the bank account
		const bankAccount = await this.bankAccountRepository.findOne({
			where: {
				uuid: bankAccountUUID,
			},
			relations: {
				affiliate: {
					customer: true,
				},
			},
		});

		// Make sure the bank account exists
		if (bankAccount === null) {
			throw new NotFoundException({
				error: "Failed to find the bank account. Please check and try again.",
			});
		}

		// Make sure the coupon belongs to the customer
		if (bankAccount?.affiliate?.customer?.uuid !== customerUUID) {
			throw new ForbiddenException({
				error: "You're not authorized to update this bank account. Please check and try again.",
			});
		}

		// Delete the bank account
		await this.bankAccountRepository.delete({
			uuid: bankAccountUUID,
		});
	}
}

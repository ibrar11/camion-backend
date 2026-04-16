import * as crypto from "node:crypto";

import {
	Injectable,
	Logger,
	NotFoundException,
} from "@nestjs/common";

import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";

import { getSkipAndTake } from "../common/pagination";

import { CreateTransactionDto } from "./dtos/CreateTransactionDto";

import { TransactionType } from "./enums/TransactionType.enum";

import { Customer } from "../customers/entities/customer.entity";
import { TransactionMoney, Transaction } from "./entities/transaction.entity";
import { Wallet } from "./entities/wallet.entity";

@Injectable()
export class TransactionsService {
	private readonly logger = new Logger(TransactionsService.name);

	constructor(
		@InjectRepository(Customer) private readonly customerRepository: Repository<Customer>,
		@InjectRepository(Transaction) private readonly transactionRepository: Repository<Transaction>,
		@InjectRepository(Wallet) private readonly walletRepository: Repository<Wallet>,
	) { }

	/**
	 * Creates a transaction
	 *
	 * @param walletUUID
	 * @param body
	 * @returns
	 */
	async createTransaction(walletUUID: string, body: CreateTransactionDto): Promise<Transaction> {
		this.logger.log(`Creating a transaction under wallet: ${walletUUID}, amount: ${body.amount}, type: ${body.type}`);

		// Find the wallet
		const wallet = await this.walletRepository.findOneBy({ uuid: walletUUID, });
		if (wallet === null) {
			throw new NotFoundException({
				error: "Failed to find the wallet. Please check and try again.",
			});
		}

		// Create the transaction
		const transaction = new Transaction();
		transaction.uuid = crypto.randomUUID();
		transaction.wallet = wallet;
		transaction.amount = new TransactionMoney();
		transaction.amount.amount = body.amount;
		transaction.amount.currencyCode = body.currencyCode;
		transaction.description = body.description.trim();
		await this.transactionRepository.save(transaction);

		// Add or deduct the amount to the wallet
		switch (body.type) {
			case TransactionType.Credit:
				wallet.amount.amount += body.amount;
				break;

			case TransactionType.Debit:
				wallet.amount.amount -= body.amount;
				break;

			default: // do nothing
				break;
		}

		// Save the wallet after making the required changes
		await this.walletRepository.save(wallet);

		return transaction;
	}

	/**
	 * Reverses a transaction
	 *
	 * @param transactionUUID
	 * @returns
	 */
	async reverseTransaction(transactionUUID: string): Promise<Transaction> {
		this.logger.log(`Reversing transaction: ${transactionUUID}`);

		// Find the source transaction
		const srcTransaction = await this.transactionRepository.findOne({
			where: {
				uuid: transactionUUID,
			},
			relations: {
				wallet: true,
			},
		});

		//	Make sure the source transaction exists
		if (srcTransaction === null) {
			throw new NotFoundException({
				error: "Failed to find the transaction. Please check and try again.",
			});
		}

		// Find the source wallet
		const wallet = await this.walletRepository.findOneBy({ id: srcTransaction.wallet.id, });
		if (wallet === null) {
			throw new NotFoundException({
				error: "Failed to find the wallet. Please check and try again.",
			});
		}

		// Create a new transaction
		const transaction = new Transaction();
		transaction.uuid = crypto.randomUUID();
		transaction.wallet = wallet;
		transaction.amount = srcTransaction.amount;
		transaction.description = `Reversed transaction # ${srcTransaction.uuid}`;

		// Update the type of the transaction
		switch (srcTransaction.type) {
			case TransactionType.Credit:
				transaction.type = TransactionType.Debit;
				break;
			case TransactionType.Debit:
				transaction.type = TransactionType.Credit;
				break;
			default: // do nothing
				break;
		}

		await this.transactionRepository.save(transaction);

		// Deduct the amount from the wallet
		switch (srcTransaction.type) {
			case TransactionType.Credit:
				wallet.amount.amount -= srcTransaction.amount.amount;
				break;
			case TransactionType.Debit:
				wallet.amount.amount += srcTransaction.amount.amount;
				break;
			default: // do nothing
				break;
		}

		await this.walletRepository.save(wallet);

		return transaction;
	}

	/**
	 * Finds the transactions of a wallet
	 *
	 * @param customerUUID
	 * @param filters
	 * @param sort
	 * @param pageNumber
	 * @param itemsPerPage
	 * @returns
	 */
	async findAllByCustomer(customerUUID: string, filters: string, sort: string, pageNumber: number = 1, itemsPerPage: number = 100): Promise<Array<Transaction>> {
		this.logger.log(`Retrieving transactions of wallet of customer: ${customerUUID}`);

		// Find the customer with affiliate wallet
		const customer = await this.customerRepository.findOne({
			where: {
				uuid: customerUUID,
			},
			order: {
				id: "DESC",
			},
			relations: {
				affiliate: {
					wallet: true,
				},
			},
		});

		// Make sure the wallet exists
		if (customer === null || customer.affiliate === null || customer.affiliate.wallet === null) {
			throw new NotFoundException({
				error: "Failed to find the wallet. Please check and try again.",
			});
		}

		// Get pagination params
		const { skip, take } = getSkipAndTake(pageNumber, itemsPerPage);

		return this.transactionRepository.find({
			where: {
				wallet: {
					id: customer.affiliate.wallet.id,
				},
			},
			skip: skip,
			take: take,
		});
	}

	/**
	 * Finds the transactions of a wallet
	 *
	 * @param walletUUID
	 * @param filters
	 * @param sort
	 * @param pageNumber
	 * @param itemsPerPage
	 * @returns
	 */
	async findAll(walletUUID: string, filters: string, sort: string, pageNumber: number = 1, itemsPerPage: number = 100): Promise<Array<Transaction>> {
		this.logger.log(`Retrieving transactions of wallet: ${walletUUID}`);

		// Find the wallet
		const wallet = await this.walletRepository.findOneBy({ uuid: walletUUID, });
		if (wallet === null) {
			throw new NotFoundException({
				error: "Failed to find the wallet. Please check and try again.",
			});
		}

		// Get pagination params
		const { skip, take } = getSkipAndTake(pageNumber, itemsPerPage);

		return this.transactionRepository.find({
			where: {
				wallet: {
					id: wallet.id,
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
	 * Finds the transaction
	 *
	 * @param transactionUUID
	 * @returns
	 */
	async findOne(transactionUUID: string): Promise<Transaction> {
		this.logger.log(`Retrieving transaction: ${transactionUUID}`);

		// Find the transaction
		const transaction = await this.transactionRepository.findOneBy({ uuid: transactionUUID, });
		if (transaction === null) {
			throw new NotFoundException({
				error: "Failed to find the transaction. Please check and try again.",
			});
		}
		return transaction;
	}
}

import * as crypto from "node:crypto";

import {
	BadRequestException,
	ConflictException,
	Injectable,
	Logger,
	NotFoundException,
} from '@nestjs/common';

import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { getSkipAndTake } from "../common/pagination";

import { RequestAffiliateDto } from './dtos/RequestAffiliateDto';
import { UpdateAffiliateDto } from "./dtos/UpdateAffiliateDto";
import { UpdateAffiliateStatusDto } from "./dtos/UpdateAffiliateStatusDto";
import { UpdateAffiliateTypeDto } from "./dtos/UpdateAffiliateTypeDto";

import { AffiliateStatus } from "./enums/AffiliateStatus.enum";
import { AffiliateType } from "./enums/AffiliateType.enum";
import { CustomerRole } from "../customers/enums/CustomerRole";
import { CurrencyCode } from "../inventory/enums/CurrencyCode.enum";

import { Affiliate, AffiliateMoney } from './entities/affiliate.entity';
import { Customer } from "../customers/entities/customer.entity";
import { Wallet } from "./entities/wallet.entity";

@Injectable()
export class AffiliatesService {
	private readonly logger = new Logger(AffiliatesService.name);

	constructor(
		@InjectRepository(Affiliate) private readonly affiliateRepository: Repository<Affiliate>,
		@InjectRepository(Customer) private readonly customerRepository: Repository<Customer>,
		@InjectRepository(Wallet) private readonly walletRepository: Repository<Wallet>,
	) { }

	/**
	 * Creates an affiliate
	 *
	 * @param customerUUID
	 * @param body
	 * @returns
	 */
	async createAffiliate(customerUUID: string, body: RequestAffiliateDto): Promise<Affiliate> {
		this.logger.log(`Creating an affiliate: ${body.fullName}`);

		// Find the customer
		const customer = await this.customerRepository.findOne({
			where: {
				uuid: customerUUID,
			},
			relations: {
				affiliate: {
					wallet: true,
				},
			},
		});

		// Make sure the customer exists
		if (customer === null) {
			throw new BadRequestException({
				error: "Failed to find the customer. Please check and try again.",
			});
		}

		// Make sure the customer isn't already an affiliate
		if (customer.role === CustomerRole.Affiliate) {
			throw new ConflictException({
				error: "You're already an affiliate.",
			});
		}

		// Make sure an influencer isn't able to switch to be an affiliate
		if (customer.role === CustomerRole.Influencer) {
			throw new ConflictException({
				error: "You're already an influencer. You cannot switch to be an affiliate.",
			});
		}

		// Update the customer's role
		customer.role = CustomerRole.Affiliate;
		await this.customerRepository.save(customer);

		// Create a new affiliate if one doesn't already exist
		let affiliate = customer.affiliate;
		if (affiliate === null) {
			affiliate = new Affiliate();
			affiliate.uuid = crypto.randomUUID();
			affiliate.customer = customer;
			affiliate.fullName = body.fullName.trim();
			affiliate.gender = body.gender.trim();
			affiliate.nationality = body.nationality.trim();
			affiliate.bio = body.bio.trim();
			affiliate.type = AffiliateType.Affiliate;
			affiliate.status = AffiliateStatus.Accepted;

			// Save default total commission
			affiliate.totalCommission = new AffiliateMoney();
			affiliate.totalCommission.amount = 0;
			affiliate.totalCommission.currencyCode = CurrencyCode.QAR;

			// Save default total paid
			affiliate.totalPaid = new AffiliateMoney();
			affiliate.totalPaid.amount = 0;
			affiliate.totalPaid.currencyCode = CurrencyCode.QAR;

			// Save default remaining balance
			affiliate.remainingBalance = new AffiliateMoney();
			affiliate.remainingBalance.amount = 0;
			affiliate.remainingBalance.currencyCode = CurrencyCode.QAR;
			await this.affiliateRepository.save(affiliate);
		} else {
			// Update the affiliation type
			await this.affiliateRepository.update({
				id: customer.affiliate.id,
			}, {
				type: AffiliateType.Affiliate,
			});
		}

		// Create a new wallet if one doesn't already exist
		let wallet = customer?.affiliate?.wallet ?? null;
		if (wallet === null) {
			wallet = new Wallet();
			wallet.uuid = crypto.randomUUID();
			wallet.affiliate = affiliate;

			wallet.amount = new AffiliateMoney();
			wallet.amount.amount = 0;
			wallet.amount.currencyCode = CurrencyCode.QAR;

			wallet.amountPending = new AffiliateMoney();
			wallet.amountPending.amount = 0;
			wallet.amountPending.currencyCode = CurrencyCode.QAR;

			wallet.amountAvailable = new AffiliateMoney();
			wallet.amountAvailable.amount = 0;
			wallet.amountAvailable.currencyCode = CurrencyCode.QAR;
			await this.walletRepository.save(wallet);
		}

		return affiliate;
	}

	/**
	 * Creates an influencer
	 *
	 * @param customerUUID
	 * @param body
	 * @returns
	 */
	async createInfluencer(customerUUID: string, body: RequestAffiliateDto): Promise<Affiliate> {
		this.logger.log(`Creating an affiliate: ${body.fullName}`);

		// Find the customer
		const customer = await this.customerRepository.findOne({
			where: {
				uuid: customerUUID,
			},
			relations: {
				affiliate: {
					wallet: true,
				},
			},
		});

		if (customer === null) {
			throw new BadRequestException({
				error: "Failed to find the customer. Please check and try again.",
			});
		}

		// Make sure the customer isn't already an influencer
		if (customer.role === CustomerRole.Influencer) {
			throw new BadRequestException({
				error: "You're already an influencer.",
			});
		}

		// Make sure the affiliate isn't able to switch to be an influencer
		if (customer.role === CustomerRole.Affiliate) {
			throw new ConflictException({
				error: "You're already an affiliate. You cannot switch to be an influencer.",
			});
		}

		// Update the customer's role
		customer.role = CustomerRole.Influencer;
		await this.customerRepository.save(customer);

		// Create a new influencer if one doesn't already exist
		let affiliate = customer.affiliate;
		if (affiliate === null) {
			affiliate = new Affiliate();
			affiliate.uuid = crypto.randomUUID();
			affiliate.customer = customer;
			affiliate.fullName = body.fullName.trim();
			affiliate.gender = body.gender.trim();
			affiliate.nationality = body.nationality.trim();
			affiliate.bio = body.bio.trim();
			affiliate.type = AffiliateType.Influencer;
			affiliate.status = AffiliateStatus.Accepted;

			// Save default total commission
			affiliate.totalCommission = new AffiliateMoney();
			affiliate.totalCommission.amount = 0;
			affiliate.totalCommission.currencyCode = CurrencyCode.QAR;

			// Save default total paid
			affiliate.totalPaid = new AffiliateMoney();
			affiliate.totalPaid.amount = 0;
			affiliate.totalPaid.currencyCode = CurrencyCode.QAR;

			// Save default remaining balance
			affiliate.remainingBalance = new AffiliateMoney();
			affiliate.remainingBalance.amount = 0;
			affiliate.remainingBalance.currencyCode = CurrencyCode.QAR;
			await this.affiliateRepository.save(affiliate);
		} else {
			await this.affiliateRepository.update({
				id: customer.affiliate.id,
			}, {
				type: AffiliateType.Influencer,
			});
		}

		// Create a new wallet if one doesn't already exist
		let wallet = customer?.affiliate?.wallet ?? null;
		if (wallet === null) {
			wallet = new Wallet();
			wallet.uuid = crypto.randomUUID();
			wallet.affiliate = affiliate;

			wallet.amount = new AffiliateMoney();
			wallet.amount.amount = 0;
			wallet.amount.currencyCode = CurrencyCode.QAR;

			wallet.amountPending = new AffiliateMoney();
			wallet.amountPending.amount = 0;
			wallet.amountPending.currencyCode = CurrencyCode.QAR;

			wallet.amountAvailable = new AffiliateMoney();
			wallet.amountAvailable.amount = 0;
			wallet.amountAvailable.currencyCode = CurrencyCode.QAR;
			await this.walletRepository.save(wallet);
		}

		return affiliate;
	}

	/**
	 * Finds a list of affiliates
	 *
	 * @param filters
	 * @param sort
	 * @param pageNumber
	 * @param itemsPerPage
	 * @returns
	 */
	findAll(filters: string, sort: string, pageNumber: number = 1, itemsPerPage: number = 100): Promise<Array<Affiliate>> {
		this.logger.log(`Retrieving a list of affiliates`);

		// Get pagination params
		const { skip, take } = getSkipAndTake(pageNumber, itemsPerPage);

		// Parse the filters
		let filtersObject: { type?: "affiliate" | "influencer" } = {};
		try {
			filtersObject = JSON.parse(filters);
		} catch {
			this.logger.warn("Unable to parse filters. Please check the documentation and try again.");
		}

		// Fetch affiliates
		if (filtersObject.type === "affiliate") {
			return this.affiliateRepository.find({
				where: {
					type: AffiliateType.Affiliate,
				},
				relations: {
					customer: true,
					wallet: true,
				},
				skip: skip,
				take: take,
			});
		}

		// Fetch influencers
		if (filtersObject.type === "influencer") {
			return this.affiliateRepository.find({
				where: {
					type: AffiliateType.Influencer,
				},
				relations: {
					customer: true,
					wallet: true,
				},
				skip: skip,
				take: take,
			});
		}

		return this.affiliateRepository.find({
			relations: {
				customer: true,
				wallet: true,
			},
			skip: skip,
			take: take,
		});
	}

	/**
	 * Finds an affiliate by thier customer uuid
	 *
	 * @param customerUUID
	 * @returns
	 */
	async findOneByCustomer(customerUUID: string): Promise<Affiliate> {
		this.logger.log(`Retrieving affiliate by customer: ${customerUUID}`);

		// Find the affiliate
		const affiliate = await this.affiliateRepository.findOne({
			cache: true,
			relationLoadStrategy: "query",
			where: {
				customer: {
					uuid: customerUUID,
				},
			},
			relations: {
				customer: true,
				trendingCoupon: true,
				topProduct: true,
				wallet: true,
			},
		});

		if (affiliate === null) {
			throw new NotFoundException({
				error: "Failed to find the affiliate. Please check and try again.",
			});
		}

		return affiliate;
	}

	/**
	 * Finds an affiliate
	 *
	 * @param affiliateUUID
	 * @returns
	 */
	async findOne(affiliateUUID: string): Promise<Affiliate> {
		this.logger.log(`Retrieving affiliate by uuid: ${affiliateUUID}`);

		// Find the affiliate
		const affiliate = await this.affiliateRepository.findOne({
			where: {
				uuid: affiliateUUID,
			},
			relations: {
				customer: true,
				wallet: true,
			},
		});
		if (affiliate === null) {
			throw new NotFoundException({
				error: "Failed to find the affiliate. Please check and try again.",
			});
		}

		return affiliate;
	}

	/**
	 * Updates an affiliate
	 *
	 * @param affiliateUUID
	 * @param body
	 * @returns
	 */
	async updateAffiliate(affiliateUUID: string, body: UpdateAffiliateDto): Promise<Affiliate> {
		this.logger.log(`Updating affiliate by uuid: ${affiliateUUID}`);

		// Find the affiliate
		const affiliate = await this.affiliateRepository.findOneBy({ uuid: affiliateUUID, });
		if (affiliate === null) {
			throw new NotFoundException({
				error: "Failed to find the affiliate. Please check and try again.",
			});
		}

		// Update the affiliate
		affiliate.fullName = body.fullName.trim();
		affiliate.gender = body.gender.trim();
		affiliate.nationality = body.nationality.trim();
		affiliate.bio = body.bio.trim();
		return this.affiliateRepository.save(affiliate);
	}

	/**
	 * Updates the status of the affiliate
	 *
	 * @param affiliateUUID
	 * @param body
	 * @returns
	 */
	async updateAffiliateStatus(affiliateUUID: string, body: UpdateAffiliateStatusDto): Promise<Affiliate> {
		this.logger.log(`Updating affiliate status by uuid: ${affiliateUUID}`);

		// Find the affiliate
		const affiliate = await this.affiliateRepository.findOneBy({ uuid: affiliateUUID, });
		if (affiliate === null) {
			throw new NotFoundException({
				error: "Failed to find the affiliate. Please check and try again.",
			});
		}

		// Update the status of the affiliate
		affiliate.status = body.status;
		return this.affiliateRepository.save(affiliate);
	}

	/**
	 * Updates the type of the affiliate
	 *
	 * @param affiliateUUID
	 * @param body
	 * @returns
	 */
	async updateAffiliateType(affiliateUUID: string, body: UpdateAffiliateTypeDto): Promise<Affiliate> {
		this.logger.log(`Updating affiliate type by uuid: ${affiliateUUID}`);

		// Find the affiliate
		const affiliate = await this.affiliateRepository.findOneBy({ uuid: affiliateUUID, });
		if (affiliate === null) {
			throw new NotFoundException({
				error: "Failed to find the affiliate. Please check and try again.",
			});
		}

		// Update the type of the affiliate
		affiliate.type = body.type;
		return this.affiliateRepository.save(affiliate);
	}

	/**
	 * Deletes an affiliate
	 *
	 * @param affiliateUUID
	 */
	async delete(affiliateUUID: string): Promise<void> {
		this.logger.log(`Deleting affiliate by uuid: ${affiliateUUID}`);

		// Find the affiliate
		const affiliate = await this.affiliateRepository.findOne({
			where: {
				uuid: affiliateUUID,
			},
			relations: {
				customer: true,
			},
		});

		// Update the customer's role
		if (affiliate !== null && affiliate.customer !== null) {
			await this.customerRepository.update({
				id: affiliate.customer.id,
			}, {
				role: CustomerRole.Customer,
			});
		}

		await this.affiliateRepository.delete({
			uuid: affiliateUUID,
		});
	}
}

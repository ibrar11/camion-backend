import {
	Injectable,
	Logger,
	NotFoundException
} from "@nestjs/common";

import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";

import { getSkipAndTake } from "../common/pagination";

import { Wallet } from "./entities/wallet.entity";
import { Affiliate } from "./entities/affiliate.entity";

@Injectable()
export class WalletService {
	private readonly logger = new Logger(WalletService.name);

	constructor(
		@InjectRepository(Affiliate) private readonly affiliateRepository: Repository<Affiliate>,
		@InjectRepository(Wallet) private readonly walletRepository: Repository<Wallet>,
	) { }

	/**
	 * Returns a list of wallets
	 *
	 * @param filters
	 * @param sort
	 * @param pageNumber
	 * @param itemsPerPage
	 * @returns
	 */
	async findAll(filters: string, sort: string, pageNumber: number = 1, itemsPerPage: number = 100): Promise<Array<Wallet>> {
		this.logger.log(`Retrieving wallets`);

		// Get pagination params
		const { skip, take } = getSkipAndTake(pageNumber, itemsPerPage);

		// Parse the wallet filters
		let f = {
			affiliateUUID: "",
		};

		try {
			f = JSON.parse(filters);
		} catch {
			f = {
				affiliateUUID: "",
			};
		}

		// Fetch wallet by affiliate id
		if (f.affiliateUUID !== undefined && /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(f.affiliateUUID)) {
			const affiliate = await this.affiliateRepository.findOneBy({ uuid: f.affiliateUUID, });
			if (affiliate === null) {
				return [];
			}

			// Find the wallet for the affiliate
			const wallet = await this.walletRepository.findOneBy({
				affiliate: {
					id: affiliate.id,
				},
			});

			if (wallet !== null) {
				return [wallet];
			}

			return [];
		}

		return this.walletRepository.find({
			skip: skip,
			take: take,
		});
	}

	/**
	 * Finds a wallet
	 *
	 * @param uuid
	 * @returns
	 */
	async findOne(uuid: string): Promise<Wallet> {
		this.logger.log(`Retrieving wallet by uuid: ${uuid}`);

		const wallet = await this.walletRepository.findOneBy({ uuid: uuid, });
		if (wallet === null) {
			throw new NotFoundException({
				error: "Failed to find the wallet. Please check and try again.",
			});
		}
		return wallet;
	}
}

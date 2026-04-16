import {
	Injectable,
	Logger,
	NotFoundException
} from "@nestjs/common";

import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";

import { getSkipAndTake } from "../common/pagination";

import { Wallet } from "./entities/wallet.entity";

@Injectable()
export class WalletService {
	private readonly logger = new Logger(WalletService.name);

	constructor(@InjectRepository(Wallet) private readonly walletRepository: Repository<Wallet>) { }

	/**
	 * Returns a list of wallets
	 *
	 * @param filters
	 * @param sort
	 * @param pageNumber
	 * @param itemsPerPage
	 * @returns
	 */
	findAll(filters: string, sort: string, pageNumber: number = 1, itemsPerPage: number = 100): Promise<Array<Wallet>> {
		this.logger.log(`Retrieving wallets`);

		// Get pagination params
		const { skip, take } = getSkipAndTake(pageNumber, itemsPerPage);

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

import {
	Controller,
	Get,
	HttpCode,
	HttpStatus,
	Inject,
	Param,
	Query,
	UseGuards,
} from "@nestjs/common";

import { UserRole } from "../users/enums/UserRole";

import { Wallet } from "./entities/wallet.entity";
import { WalletService } from "./wallet.service";

import { AuthGuard } from "../auth/auth.guard";
import { RolesGuard } from "../auth/roles.guard";

import { Roles } from "../auth/roles.decorator";

@UseGuards(AuthGuard, RolesGuard)
@Controller("v1/referral/wallets")
export class WalletController {
	constructor(@Inject(WalletService) private readonly walletService: WalletService) { }

	@Roles(UserRole.SuperAdmin, UserRole.Admin, UserRole.Manager)
	@Get()
	@HttpCode(HttpStatus.OK)
	actionGetWallets(
		@Query("filters") filters: string,
		@Query("sort") sort: string,
		@Query("pageNumber") pageNumber: number,
		@Query("itemsPerPage") itemsPerPage: number,
	): Promise<Array<Wallet>> {
		return this.walletService.findAll(filters, sort, pageNumber, itemsPerPage);
	}

	@Roles(UserRole.SuperAdmin, UserRole.Admin, UserRole.Manager)
	@Get(':uuid')
	@HttpCode(HttpStatus.OK)
	actionGetWallet(@Param('uuid') uuid: string): Promise<Wallet> {
		return this.walletService.findOne(uuid);
	}
}

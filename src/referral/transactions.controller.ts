import {
	Body,
	Controller,
	Get,
	HttpCode,
	HttpStatus,
	Inject,
	Param,
	Patch,
	Post,
	Query,
	Req,
	UseGuards,
} from "@nestjs/common";

import { CreateTransactionDto } from "./dtos/CreateTransactionDto";

import { CustomerRole } from "../customers/enums/CustomerRole";
import { UserRole } from "../users/enums/UserRole";

import { Customer } from "../customers/entities/customer.entity";
import { Transaction } from "./entities/transaction.entity";
import { TransactionsService } from "./transactions.service";

import { RolesGuard } from "../auth/roles.guard";
import { AuthGuard } from "../auth/auth.guard";

import { Roles } from "../auth/roles.decorator";

@UseGuards(AuthGuard, RolesGuard)
@Controller('v1/referral/wallets/:walletUUID/transactions')
export class TransactionsController {
	constructor(@Inject(TransactionsService) private readonly transactionsService: TransactionsService) { }

	@Roles(UserRole.SuperAdmin, UserRole.Admin)
	@Post()
	@HttpCode(HttpStatus.CREATED)
	actionCreateTransaction(
		@Param('walletUUID') walletUUID: string,
		@Body() body: CreateTransactionDto,
	): Promise<Transaction> {
		return this.transactionsService.createTransaction(walletUUID, body);
	}

	@Roles(UserRole.SuperAdmin, UserRole.Admin)
	@Patch(':uuid/reverse')
	@HttpCode(HttpStatus.CREATED)
	actionReverseTransaction(@Param('uuid') transactionUUID: string): Promise<Transaction> {
		return this.transactionsService.reverseTransaction(transactionUUID);
	}

	@Roles(UserRole.SuperAdmin, UserRole.Admin, CustomerRole.Affiliate, CustomerRole.Influencer)
	@Get()
	@HttpCode(HttpStatus.OK)
	actionGetTransactions(
		@Req()
		req: Request & {
			customer: Customer,
		},
		@Param('walletUUID') walletUUID: string,
		@Query("filters") filters: string,
		@Query("sort") sort: string,
		@Query("pageNumber") pageNumber: number,
		@Query("itemsPerPage") itemsPerPage: number,
	): Promise<Array<Transaction>> {
		if (req.customer) {
			return this.transactionsService.findAllByCustomer(req.customer.uuid, filters, sort, pageNumber, itemsPerPage);
		}
		return this.transactionsService.findAll(walletUUID, filters, sort, pageNumber, itemsPerPage);
	}

	@Roles(UserRole.SuperAdmin, UserRole.Admin)
	@Get(':uuid')
	@HttpCode(HttpStatus.OK)
	actionGetTransaction(@Param('uuid') transactionUUID: string): Promise<Transaction> {
		return this.transactionsService.findOne(transactionUUID);
	}
}

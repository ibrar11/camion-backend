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
	Put,
	Query,
	Req,
	UseGuards,
} from "@nestjs/common";

import { CreateBankAccountDto } from "./dtos/CreateBankAccountDto";
import { UpdateBankAccountDto } from "./dtos/UpdateBankAccountDto";
import { PatchBankAccountDto } from "./dtos/PatchBankAccountDto";

import { CustomerRole } from "../customers/enums/CustomerRole";
import { UserRole } from "../users/enums/UserRole";

import { BankAccount } from "./entities/bank-account.entity";
import { BankAccountsService } from "./bank-accounts.service";

import { Customer } from "../customers/entities/customer.entity";

import { AuthGuard } from "../auth/auth.guard";
import { RolesGuard } from "../auth/roles.guard";

import { Roles } from "../auth/roles.decorator";

@UseGuards(AuthGuard, RolesGuard)
@Controller('v1/referral/bank-accounts')
export class BankAccountsController {
	constructor(@Inject(BankAccountsService) private readonly bankAccountsService: BankAccountsService) { }

	@Roles(CustomerRole.Affiliate, CustomerRole.Influencer)
	@Post()
	@HttpCode(HttpStatus.CREATED)
	actionCreateBankAccount(
		@Req()
		req: Request & {
			customer: Customer,
		},
		@Body()
		body: CreateBankAccountDto,
	): Promise<BankAccount> {
		return this.bankAccountsService.createBankAccount(req.customer.uuid, body);
	}

	@Roles(UserRole.SuperAdmin, UserRole.Admin, UserRole.Manager, CustomerRole.Affiliate, CustomerRole.Influencer)
	@Get()
	@HttpCode(HttpStatus.OK)
	actionGetBankAccounts(
		@Req()
		req: Request & {
			customer: Customer,
		},
		@Query("filters") filters: string,
		@Query("sort") sort: string,
		@Query("pageNumber") pageNumber: number,
		@Query("itemsPerPage") itemsPerPage: number,
	): Promise<Array<BankAccount>> {
		if (req.customer) {
			return this.bankAccountsService.findAllByCustomer(req.customer.uuid, filters, sort, pageNumber, itemsPerPage);
		}
		return this.bankAccountsService.findAll(filters, sort, pageNumber, itemsPerPage);
	}

	@Roles(CustomerRole.Affiliate, CustomerRole.Influencer)
	@Get(':uuid')
	@HttpCode(HttpStatus.OK)
	actionGetAccount(
		@Req()
		req: Request & {
			customer: Customer,
		},
		@Param('uuid') bankAccountUUID: string,
	): Promise<BankAccount> {
		return this.bankAccountsService.findOne(req.customer.uuid, bankAccountUUID);
	}

	@Roles(CustomerRole.Affiliate, CustomerRole.Influencer)
	@Put(':uuid')
	@HttpCode(HttpStatus.OK)
	actionUpdateBankAccount(
		@Req()
		req: Request & {
			customer: Customer,
		},
		@Param('uuid') bankAccountUUID: string,
		@Body() body: UpdateBankAccountDto,
	): Promise<BankAccount> {
		return this.bankAccountsService.updateBankAccount(req.customer.uuid, bankAccountUUID, body);
	}

	@Roles(CustomerRole.Affiliate, CustomerRole.Influencer)
	@Patch(':uuid')
	@HttpCode(HttpStatus.OK)
	actionPatchBankAccount(
		@Req()
		req: Request & {
			customer: Customer,
		},
		@Param('uuid') bankAccountUUID: string,
		@Body() body: PatchBankAccountDto,
	): Promise<BankAccount> {
		return this.bankAccountsService.patchBankAccountAsDefault(req.customer.uuid, bankAccountUUID, body);
	}

	@Roles(CustomerRole.Affiliate, CustomerRole.Influencer)
	@Patch(':uuid')
	@HttpCode(HttpStatus.OK)
	actionDeleteBankAccount(
		@Req()
		req: Request & {
			customer: Customer,
		},
		@Param('uuid') bankAccountUUID: string,
	): Promise<void> {
		return this.bankAccountsService.delete(req.customer.uuid, bankAccountUUID);
	}
}

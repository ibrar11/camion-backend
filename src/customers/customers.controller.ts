import {
	Body,
	Controller,
	Delete,
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
} from '@nestjs/common';

import { CreateCustomerDto } from './dtos/CreateCustomerDto';
import { UpdateCustomerDto } from './dtos/UpdateCustomerDto';
import { UpdateEmailAddressDto } from './dtos/UpdateEmailAddressDto';
import { UpdatePasswordDto } from './dtos/UpdatePasswordDto';

import { UserRole } from '../users/enums/UserRole';
import { CustomerRole } from './enums/CustomerRole';

import { Customer } from './entities/customer.entity';
import { CustomersService } from './customers.service';

import { AuthGuard } from '../auth/auth.guard';
import { RolesGuard } from '../auth/roles.guard';

import { Roles } from '../auth/roles.decorator';

@UseGuards(AuthGuard, RolesGuard)
@Controller('v1/customers')
export class CustomersController {
	constructor(@Inject(CustomersService) private readonly customersService: CustomersService) { }

	@Roles(UserRole.SuperAdmin, UserRole.Admin)
	@Post()
	@HttpCode(HttpStatus.CREATED)
	actionCreateCustomer(@Body() body: CreateCustomerDto): Promise<Customer> {
		return this.customersService.createCustomer(body);
	}

	@Roles(UserRole.SuperAdmin, UserRole.Admin, UserRole.Manager, UserRole.User)
	@Get()
	@HttpCode(HttpStatus.OK)
	actionGetCustomers(
		@Query("filters") filters: string,
		@Query("sort") sort: string,
		@Query("pageNumber") pageNumber: number,
		@Query("itemsPerPage") itemsPerPage: number,
	): Promise<Array<Customer>> {
		return this.customersService.findAll(filters, sort, pageNumber, itemsPerPage);
	}

	@Roles(UserRole.SuperAdmin, UserRole.Admin, UserRole.Manager, UserRole.User)
	@Get(':uuid')
	@HttpCode(HttpStatus.OK)
	actionGetCustomer(@Param('uuid') uuid: string): Promise<Customer> {
		return this.customersService.findOne(uuid);
	}

	@Roles(UserRole.SuperAdmin, UserRole.Admin)
	@Put(':uuid')
	@HttpCode(HttpStatus.OK)
	actionUpdateOne(@Param('uuid') uuid: string, @Body() body: UpdateCustomerDto): Promise<Customer> {
		return this.customersService.updateCustomer(uuid, body);
	}

	@Roles(UserRole.SuperAdmin, UserRole.Admin)
	@Put(':uuid/email-address')
	@HttpCode(HttpStatus.OK)
	actionUpdateEmailAddress(@Param('uuid') uuid: string, @Body() body: UpdateEmailAddressDto): Promise<Customer> {
		return this.customersService.updateEmailAddress(uuid, body);
	}

	@Roles(UserRole.SuperAdmin, UserRole.Admin)
	@Put(':uuid/password')
	@HttpCode(HttpStatus.OK)
	actionUpdatePassword(@Param('uuid') uuid: string, @Body() body: UpdatePasswordDto): Promise<Customer> {
		return this.customersService.updatePassword(uuid, body);
	}

	@Roles(CustomerRole.Guest, CustomerRole.Customer, CustomerRole.Affiliate, CustomerRole.Influencer)
	@Delete('me')
	@HttpCode(HttpStatus.OK)
	async deleteMyAccount(
		@Req() req: Request & { customer: Customer },
	): Promise<{ message: string }> {
		await this.customersService.requestAccountDeletion(req.customer.uuid);

		return {
			message: 'Account marked for deletion',
		};
	}

	@Roles(CustomerRole.Guest, CustomerRole.Customer, CustomerRole.Affiliate, CustomerRole.Influencer)
	@Patch('me/cancel-deletion')
	@HttpCode(HttpStatus.OK)
	async cancelDeletion(@Req() req: Request & { customer: Customer }) {
		await this.customersService.cancelDeletion(req.customer.uuid);

		return {
			message: 'Account deletion cancelled',
		};
	}

	@Roles(UserRole.SuperAdmin, UserRole.Admin)
	@Delete(':uuid')
	@HttpCode(HttpStatus.OK)
	actionDeleteOne(@Param('uuid') uuid: string): Promise<void> {
		return this.customersService.delete(uuid);
	}
}

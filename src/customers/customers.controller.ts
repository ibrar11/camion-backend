import {
	Body,
	Controller,
	Delete,
	Get,
	HttpCode,
	HttpStatus,
	Inject,
	Param,
	Post,
	Put,
	UseGuards,
} from '@nestjs/common';

import { CreateCustomerDto } from './dtos/CreateCustomerDto';
import { UpdateCustomerDto } from './dtos/UpdateCustomerDto';
import { UpdateEmailAddressDto } from './dtos/UpdateEmailAddressDto';
import { UpdatePasswordDto } from './dtos/UpdatePasswordDto';

import { UserRole } from '../users/enums/UserRole';

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
	actionGetCustomers() {
		return this.customersService.findAll();
	}

	@Roles(UserRole.SuperAdmin, UserRole.Admin, UserRole.Manager, UserRole.User)
	@Get(':uuid')
	@HttpCode(HttpStatus.OK)
	actionGetCustomer(@Param('uuid') uuid: string) {
		return this.customersService.findOne(uuid);
	}

	@Roles(UserRole.SuperAdmin, UserRole.Admin, UserRole.Manager)
	@Put(':uuid')
	@HttpCode(HttpStatus.OK)
	actionUpdateOne(@Param('uuid') uuid: string, @Body() body: UpdateCustomerDto): Promise<Customer> {
		return this.customersService.updateCustomer(uuid, body);
	}

	@Roles(UserRole.SuperAdmin, UserRole.Admin, UserRole.Manager)
	@Put(':uuid/email-address')
	@HttpCode(HttpStatus.OK)
	actionUpdateEmailAddress(@Param('uuid') uuid: string, @Body() body: UpdateEmailAddressDto): Promise<Customer> {
		return this.customersService.updateEmailAddress(uuid, body);
	}

	@Roles(UserRole.SuperAdmin, UserRole.Admin, UserRole.Manager)
	@Put(':uuid/password')
	@HttpCode(HttpStatus.OK)
	actionUpdatePassword(@Param('uuid') uuid: string, @Body() body: UpdatePasswordDto): Promise<Customer> {
		return this.customersService.updatePassword(uuid, body);
	}

	@Roles(UserRole.SuperAdmin, UserRole.Admin)
	@Delete(':uuid')
	@HttpCode(HttpStatus.OK)
	actionDeleteOne(@Param('uuid') uuid: string): Promise<void> {
		return this.customersService.delete(uuid);
	}
}

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

import { Customer } from './entities/customer.entity';
import { CustomersService } from './customers.service';

import { AuthGuard } from 'src/auth/auth.guard';

@Controller('customers')
export class CustomersController {
	constructor(@Inject(CustomersService) private readonly customersService: CustomersService) { }

	@UseGuards(AuthGuard)
	@HttpCode(HttpStatus.CREATED)
	@Post()
	actionCreateCustomer(@Body() body: CreateCustomerDto): Promise<Customer> {
		return this.customersService.createCustomer(body);
	}

	@UseGuards(AuthGuard)
	@HttpCode(HttpStatus.OK)
	@Get()
	actionGetCustomers() {
		return this.customersService.findAll();
	}

	@UseGuards(AuthGuard)
	@HttpCode(HttpStatus.OK)
	@Get(':uuid')
	actionGetCustomer(@Param('uuid') uuid: string) {
		return this.customersService.findOne(uuid);
	}

	@UseGuards(AuthGuard)
	@HttpCode(HttpStatus.OK)
	@Put(':uuid')
	actionUpdateOne(@Param('uuid') uuid: string, @Body() body: UpdateCustomerDto): Promise<Customer> {
		return this.customersService.updateCustomer(uuid, body);
	}

	@UseGuards(AuthGuard)
	@HttpCode(HttpStatus.OK)
	@Put(':uuid/email-address')
	actionUpdateEmailAddress(@Param('uuid') uuid: string, @Body() body: UpdateEmailAddressDto): Promise<Customer> {
		return this.customersService.updateEmailAddress(uuid, body);
	}

	@UseGuards(AuthGuard)
	@HttpCode(HttpStatus.OK)
	@Put(':uuid/password')
	actionUpdatePassword(@Param('uuid') uuid: string, @Body() body: UpdatePasswordDto): Promise<Customer> {
		return this.customersService.updatePassword(uuid, body);
	}

	@UseGuards(AuthGuard)
	@HttpCode(HttpStatus.OK)
	@Delete(':uuid')
	actionDeleteOne(@Param('uuid') uuid: string): Promise<void> {
		return this.customersService.delete(uuid);
	}
}

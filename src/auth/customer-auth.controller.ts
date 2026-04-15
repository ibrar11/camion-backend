import {
	Body,
	Controller,
	HttpCode,
	HttpStatus,
	Inject,
	Post,
	Put,
	Req,
	UseGuards,
} from '@nestjs/common';

import { Request } from 'express';

import { VerifyCustomerDto } from './dtos/VerifyCustomerDto';
import { RegisterCustomerDto } from './dtos/RegisterCustomerDto';

import { LoginCustomerByEmailAddressDto } from './dtos/LoginCustomerByEmailAddressDto';
import { LoginCustomerByPhoneNumberDto } from './dtos/LoginCustomerByPhoneNumberDto';

import { UpdateCustomerDto } from './dtos/UpdateCustomerDto';

import { CustomerAuthVerificationResponse } from './response/CustomerAuthVerificationResponse';
import { CustomerAuthResponse } from './response/CustomerAuthResponse';

import { Customer } from '../customers/entities/customer.entity';
import { CustomerAuthService } from './customer-auth.service';

import { AuthGuard } from './auth.guard';

@Controller("v1/auth/customer")
export class CustomerAuthController {
	constructor(
		@Inject(CustomerAuthService) private readonly customerAuthService: CustomerAuthService,
	) { }

	@HttpCode(HttpStatus.CREATED)
	@Post('register')
	actionRegisterCustomerEmailAddress(@Body() body: RegisterCustomerDto): Promise<CustomerAuthResponse> {
		return this.customerAuthService.registerCustomer(body);
	}

	@HttpCode(HttpStatus.OK)
	@Post('login/phone-number')
	actionLoginCustomerByPhoneNumber(@Body() body: LoginCustomerByPhoneNumberDto): Promise<CustomerAuthVerificationResponse> {
		return this.customerAuthService.loginCustomerByPhoneNumber(body);
	}

	@HttpCode(HttpStatus.OK)
	@Post('login/email-address')
	actionLoginCustomerByEmailAddress(@Body() body: LoginCustomerByEmailAddressDto): Promise<CustomerAuthVerificationResponse> {
		return this.customerAuthService.loginCustomerByEmailAddress(body);
	}

	@HttpCode(HttpStatus.CREATED)
	@Post('verify/phone-number')
	actionVerifyCustomerPhoneNumber(@Body() body: VerifyCustomerDto): Promise<CustomerAuthResponse> {
		return this.customerAuthService.verifyCustomerByPhoneNumber(body);
	}

	@HttpCode(HttpStatus.CREATED)
	@Post('verify/email-address')
	actionVerifyCustomerEmailAddress(@Body() body: VerifyCustomerDto): Promise<CustomerAuthResponse> {
		return this.customerAuthService.verifyCustomerByEmailAddress(body);
	}

	@UseGuards(AuthGuard)
	@HttpCode(HttpStatus.OK)
	@Post('logout')
	actionLogouCustomer(
		@Req()
		req: Request & {
			jti: string,
			customer: Customer,
		}
	): Promise<void> {
		return this.customerAuthService.logout(req.jti, req.customer);
	}

	@UseGuards(AuthGuard)
	@HttpCode(HttpStatus.OK)
	@Put('self')
	actionUpdateCustomer(
		@Req()
		req: Request & {
			customer: Customer,
		},
		@Body()
		body: UpdateCustomerDto,
	): Promise<Customer> {
		return this.customerAuthService.updateProfile(req.customer, body);
	}
}

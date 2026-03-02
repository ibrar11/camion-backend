import {
	Body,
	Controller,
	HttpCode,
	HttpStatus,
	Inject,
	Post,
	Req,
	UseGuards,
} from '@nestjs/common';

import { Request } from 'express';

import { RegisterUserDto } from './dtos/RegisterUserDto';
import { LoginUserDto } from './dtos/LoginUserDto';

import { RegisterCustomerByEmailAddressDto } from './dtos/RegisterCustomerByEmailAddressDto';
import { RegisterCustomerByPhoneNumberDto } from './dtos/RegisterCustomerByPhoneNumberDto';
import { VerifyCustomerDto } from './dtos/VerifyCustomerDto';

import { RegisterCustomerDto } from './dtos/RegisterCustomerDto';
import { LoginCustomerByEmailAddressDto } from './dtos/LoginCustomerByEmailAddressDto';
import { LoginCustomerByPhoneNumberDto } from './dtos/LoginCustomerByPhoneNumberDto';

import { CustomerAuthVerificationResponse } from './response/CustomerAuthVerificationResponse';
import { UserAuthResponse } from './response/UserAuthResponse';
import { CustomerAuthResponse } from './response/CustomerAuthResponse';

import { User } from 'src/users/entities/user.entity';

import { AuthService } from './auth.service';

import { AuthGuard } from './auth.guard';
import { Customer } from 'src/customers/entities/customer.entity';

@Controller('v1/auth')
export class AuthController {
	constructor(@Inject(AuthService) private readonly authService: AuthService) { }

	@HttpCode(HttpStatus.CREATED)
	@Post('user/register')
	actionRegister(@Body() body: RegisterUserDto): Promise<UserAuthResponse> {
		return this.authService.registerUser(body);
	}

	@HttpCode(HttpStatus.CREATED)
	@Post('user/login')
	actionLogin(@Body() body: LoginUserDto): Promise<UserAuthResponse> {
		return this.authService.loginUser(body);
	}

	@UseGuards(AuthGuard)
	@HttpCode(HttpStatus.OK)
	@Post('user/logout')
	actionLogoutUser(
		@Req()
		req: Request & {
			jti: string,
			user: User,
		}
	): Promise<void> {
		return this.authService.logoutUser(req.jti, req.user);
	}

	@HttpCode(HttpStatus.CREATED)
	@Post('customer/register/email-address')
	actionRegisterCustomerEmailAddress(@Body() body: RegisterCustomerByEmailAddressDto): Promise<CustomerAuthVerificationResponse> {
		return this.authService.registerCustomerEmailAddress(body);
	}

	@HttpCode(HttpStatus.CREATED)
	@Post('customer/register/phone-number')
	actionRegisterCustomerPhoneNumber(@Body() body: RegisterCustomerByPhoneNumberDto): Promise<CustomerAuthVerificationResponse> {
		return this.authService.registerCustomerPhoneNumber(body);
	}

	@HttpCode(HttpStatus.OK)
	@Post('customer/verify/email-address')
	actionVerifyCustomerEmailAddress(@Body() body: VerifyCustomerDto): Promise<void> {
		return this.authService.verifyCustomerEmailAddress(body);
	}

	@HttpCode(HttpStatus.OK)
	@Post('customer/verify/phone-number')
	actionVerifyCustomerPhoneNumber(@Body() body: VerifyCustomerDto): Promise<void> {
		return this.authService.verifyCustomerPhoneNumber(body);
	}

	@HttpCode(HttpStatus.CREATED)
	@Post('customer/register')
	actionRegisterCustomer(@Body() body: RegisterCustomerDto): Promise<CustomerAuthResponse | null> {
		return this.authService.registerCustomer(body);
	}

	@HttpCode(HttpStatus.CREATED)
	@Post('customer/login/email-address')
	actionLoginCustomerByEmailAddress(@Body() body: LoginCustomerByEmailAddressDto): Promise<CustomerAuthResponse | null> {
		return this.authService.loginCustomerByEmailAddress(body);
	}

	@HttpCode(HttpStatus.CREATED)
	@Post('customer/login/phone-number')
	actionLoginCustomerByPhoneNumber(@Body() body: LoginCustomerByPhoneNumberDto): Promise<CustomerAuthResponse | null> {
		return this.authService.loginCustomerByPhoneNumber(body);
	}

	@UseGuards(AuthGuard)
	@HttpCode(HttpStatus.OK)
	@Post('customer/logout')
	actionLogouCustomer(
		@Req()
		req: Request & {
			jti: string,
			customer: Customer,
		}
	): Promise<void> {
		return this.authService.logoutCustomer(req.jti, req.customer);
	}
}

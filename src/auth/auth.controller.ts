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

import { RegisterUserDto } from './dtos/RegisterUserDto';
import { LoginUserDto } from './dtos/LoginUserDto';

import { UpdateUserDto } from './dtos/UpdateUserDto';
import { UpdateUserEmailAddressDto } from './dtos/UpdateUserEmailAddressDto';
import { UpdateUserPasswordDto } from './dtos/UpdateUserPasswordDto';

import { RegisterCustomerByEmailAddressDto } from './dtos/RegisterCustomerByEmailAddressDto';
import { RegisterCustomerByPhoneNumberDto } from './dtos/RegisterCustomerByPhoneNumberDto';
import { VerifyCustomerDto } from './dtos/VerifyCustomerDto';
import { RegisterCustomerDto } from './dtos/RegisterCustomerDto';

import { LoginCustomerByEmailAddressDto } from './dtos/LoginCustomerByEmailAddressDto';
import { LoginCustomerByPhoneNumberDto } from './dtos/LoginCustomerByPhoneNumberDto';

import { UpdateCustomerDto } from './dtos/UpdateCustomerDto';
import { UpdateCustomerEmailAddressDto } from './dtos/UpdateCustomerEmailAddressDto';
import { UpdateCustomerPasswordDto } from './dtos/UpdateCustomerPasswordDto';

import { CustomerAuthVerificationResponse } from './response/CustomerAuthVerificationResponse';
import { UserAuthResponse } from './response/UserAuthResponse';
import { CustomerAuthResponse } from './response/CustomerAuthResponse';

import { User } from 'src/users/entities/user.entity';
import { Customer } from 'src/customers/entities/customer.entity';

import { AuthService } from './auth.service';

import { AuthGuard } from './auth.guard';
import { UserMfaSetupResponse } from './response/UserMfaSetupResponse';
import { EnableUserMfaDto } from './dtos/EnableUserMfaDto';

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

	@UseGuards(AuthGuard)
	@HttpCode(HttpStatus.OK)
	@Post('user/mfa/setup')
	actionSetupMfa(
		@Req()
		req: Request & {
			user: User,
		}
	): Promise<UserMfaSetupResponse> {
		return this.authService.setupMfa(req.user);
	}

	@UseGuards(AuthGuard)
	@HttpCode(HttpStatus.OK)
	@Post('user/mfa/enable')
	actionEnableMfa(
		@Req()
		req: Request & {
			user: User,
		},
		@Body()
		body: EnableUserMfaDto,
	): Promise<void> {
		return this.authService.enableMfa(req.user, body);
	}

	@UseGuards(AuthGuard)
	@HttpCode(HttpStatus.OK)
	@Put('user/self')
	actionUpdateUser(
		@Req()
		req: Request & {
			user: User,
		},
		@Body()
		body: UpdateUserDto,
	) {
		return this.authService.updateUser(req.user, body);
	}

	@UseGuards(AuthGuard)
	@HttpCode(HttpStatus.OK)
	@Put('user/self/email-address')
	actionUpdateUserEmailAddress(
		@Req()
		req: Request & {
			user: User,
		},
		@Body()
		body: UpdateUserEmailAddressDto,
	) {
		return this.authService.updateUserEmailAddress(req.user, body);
	}

	@UseGuards(AuthGuard)
	@HttpCode(HttpStatus.OK)
	@Put('user/self/password')
	action(
		@Req()
		req: Request & {
			user: User,
		},
		@Body()
		body: UpdateUserPasswordDto,
	) {
		return this.authService.updateUserPassword(req.user, body);
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

	@UseGuards(AuthGuard)
	@HttpCode(HttpStatus.OK)
	@Put('customer/self')
	actionUpdateCustomer(
		@Req()
		req: Request & {
			customer: Customer,
		},
		@Body()
		body: UpdateCustomerDto,
	) {
		return this.authService.updateCustomer(req.customer, body);
	}

	@UseGuards(AuthGuard)
	@HttpCode(HttpStatus.OK)
	@Put('customer/self/email-address')
	actionUpdateCustomerEmailAddress(
		@Req()
		req: Request & {
			customer: Customer,
		},
		@Body()
		body: UpdateCustomerEmailAddressDto,
	) {
		return this.authService.updateCustomerEmailAddress(req.customer, body);
	}

	@UseGuards(AuthGuard)
	@HttpCode(HttpStatus.OK)
	@Put('customer/self/password')
	actionUpdateCustomerPassword(
		@Req()
		req: Request & {
			customer: Customer,
		},
		@Body()
		body: UpdateCustomerPasswordDto,
	) {
		return this.authService.updateCustomerPassword(req.customer, body);
	}
}

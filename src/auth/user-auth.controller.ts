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
import { EnableUserMfaDto } from './dtos/EnableUserMfaDto';

import { UserAuthResponse } from './response/UserAuthResponse';
import { UserMfaSetupResponse } from './response/UserMfaSetupResponse';

import { User } from '../users/entities/user.entity';
import { UserAuthService } from './user-auth.service';

import { AuthGuard } from './auth.guard';

@Controller("v1/auth/user")
export class UserAuthController {
	constructor(
		@Inject(UserAuthService) private readonly userAuthService: UserAuthService,
	) { }

	@HttpCode(HttpStatus.CREATED)
	@Post('register')
	actionRegister(@Body() body: RegisterUserDto): Promise<UserAuthResponse> {
		return this.userAuthService.register(body);
	}

	@HttpCode(HttpStatus.CREATED)
	@Post('login')
	actionLogin(@Body() body: LoginUserDto): Promise<UserAuthResponse> {
		return this.userAuthService.login(body);
	}

	@UseGuards(AuthGuard)
	@HttpCode(HttpStatus.OK)
	@Post('logout')
	actionLogoutUser(
		@Req()
		req: Request & {
			jti: string,
			user: User,
		}
	): Promise<void> {
		return this.userAuthService.logout(req.jti, req.user);
	}

	@UseGuards(AuthGuard)
	@HttpCode(HttpStatus.OK)
	@Post('mfa/setup')
	actionSetupMfa(
		@Req()
		req: Request & {
			user: User,
		}
	): Promise<UserMfaSetupResponse> {
		return this.userAuthService.setupMfa(req.user);
	}

	@UseGuards(AuthGuard)
	@HttpCode(HttpStatus.OK)
	@Post('mfa/enable')
	actionEnableMfa(
		@Req()
		req: Request & {
			user: User,
		},
		@Body()
		body: EnableUserMfaDto,
	): Promise<void> {
		return this.userAuthService.enableMfa(req.user, body);
	}

	@UseGuards(AuthGuard)
	@HttpCode(HttpStatus.OK)
	@Put('self')
	actionUpdateUser(
		@Req()
		req: Request & {
			user: User,
		},
		@Body()
		body: UpdateUserDto,
	): Promise<User> {
		return this.userAuthService.updateProfile(req.user, body);
	}

	@UseGuards(AuthGuard)
	@HttpCode(HttpStatus.OK)
	@Put('self/email-address')
	actionUpdateUserEmailAddress(
		@Req()
		req: Request & {
			user: User,
		},
		@Body()
		body: UpdateUserEmailAddressDto,
	): Promise<User> {
		return this.userAuthService.updateEmailAddress(req.user, body);
	}

	@UseGuards(AuthGuard)
	@HttpCode(HttpStatus.OK)
	@Put('self/password')
	action(
		@Req()
		req: Request & {
			user: User,
		},
		@Body()
		body: UpdateUserPasswordDto,
	): Promise<User> {
		return this.userAuthService.updatePassword(req.user, body);
	}
}

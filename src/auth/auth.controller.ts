import {
	Body,
	Controller,
	HttpCode,
	HttpStatus,
	Inject,
	Post,
} from '@nestjs/common';

import { RegisterUserDto } from './dtos/RegisterUserDto';
import { LoginUserDto } from './dtos/LoginUserDto';

import { AuthResponse } from './response/AuthResponse';

import { AuthService } from './auth.service';

@Controller('auth/user')
export class AuthController {
	constructor(@Inject(AuthService) private readonly authService: AuthService) { }

	@HttpCode(HttpStatus.CREATED)
	@Post('/register')
	actionRegister(@Body() body: RegisterUserDto): Promise<AuthResponse> {
		return this.authService.register(body);
	}

	@HttpCode(HttpStatus.CREATED)
	@Post('/login')
	actionLogin(@Body() body: LoginUserDto): Promise<AuthResponse> {
		return this.authService.login(body);
	}
}

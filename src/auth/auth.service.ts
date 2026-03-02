import * as crypto from "node:crypto";

import {
	BadRequestException,
	Inject,
	Injectable,
	Logger,
} from '@nestjs/common';

import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { JwtService } from '@nestjs/jwt';

import { Cache, CACHE_MANAGER } from '@nestjs/cache-manager';

import { RegisterUserDto } from './dtos/RegisterUserDto';

import { User } from '../users/entities/user.entity';
import { UserRole } from '../users/enums/UserRole';
import { UsersService } from '../users/users.service';
import { LoginUserDto } from './dtos/LoginUserDto';

import { AuthResponse } from './response/AuthResponse';

@Injectable()
export class AuthService {
	private readonly logger = new Logger(AuthService.name);

	constructor(
		@InjectRepository(User) private readonly userRepository: Repository<User>,
		@Inject(CACHE_MANAGER) private readonly cacheManager: Cache,
		private readonly jwtService: JwtService,
		private readonly usersService: UsersService,
	) {
	}

	/**
	 * Register a new user
	 *
	 * @param body
	 * @returns
	 */
	async register(body: RegisterUserDto): Promise<AuthResponse> {
		this.logger.log(`Attempting to register user ${body.emailAddress}`);

		const user = await this.usersService.createUser({
			fullName: body.fullName,
			emailAddress: body.emailAddress,
			password: body.password,
			role: UserRole.User,
		});

		// Create the payload for the jwt
		const payload = {
			jti: crypto.randomUUID(),
			type: "user",
			sub: user.uuid,
		};

		// Create a jwt for the user
		const token = await this.jwtService.signAsync(payload);

		// Save the token cache so we can invalidate the user session later.
		await this.cacheManager.set(`auth:user-session:${payload.jti}`, token);

		return {
			user: user,
			token: token,
		};
	}

	/**
	 * Logs in a user
	 *
	 * @param body
	 */
	async login(body: LoginUserDto): Promise<AuthResponse> {
		this.logger.log(`Attempting to login user ${body.emailAddress}`);

		const user = await this.userRepository.findOneBy({
			emailAddress: body.emailAddress.trim().toLowerCase(),
		});

		if (user === null) {
			throw new BadRequestException({
				status: "fail",
				errors: {
					error: "We weren't able to log you in. Give your email and password another look and try again.",
				},
			});
		}

		// Create the payload for the jwt
		const payload = {
			jti: crypto.randomUUID(),
			type: "user",
			sub: user.uuid,
		};

		// Create a jwt for the user
		const token = await this.jwtService.signAsync(payload);

		// Save the token cache so we can invalidate the user session later.
		await this.cacheManager.set(`auth:user-session:${payload.jti}`, token);

		return {
			user: user,
			token: token,
		};
	}
}

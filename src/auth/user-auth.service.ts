import * as crypto from "node:crypto";

import * as bcrypt from "bcrypt";

import speakeasy from "speakeasy";

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

import { ConfigService } from "@nestjs/config";

import { RegisterUserDto } from './dtos/RegisterUserDto';
import { LoginUserDto } from './dtos/LoginUserDto';

import { UpdateUserDto } from "./dtos/UpdateUserDto";
import { UpdateUserEmailAddressDto } from "./dtos/UpdateUserEmailAddressDto";
import { UpdateUserPasswordDto } from "./dtos/UpdateUserPasswordDto";

import { EnableUserMfaDto } from "./dtos/EnableUserMfaDto";

import { User } from '../users/entities/user.entity';
import { UserRole } from '../users/enums/UserRole';

import { UserAuthResponse } from './response/UserAuthResponse';
import { UserMfaSetupResponse } from "./response/UserMfaSetupResponse";

@Injectable()
export class UserAuthService {
	private readonly logger = new Logger(UserAuthService.name);

	constructor(
		@InjectRepository(User) private readonly userRepository: Repository<User>,
		@Inject(CACHE_MANAGER) private readonly cacheManager: Cache,
		private readonly configService: ConfigService,
		private readonly jwtService: JwtService,
	) {
	}

	/**
	 * Register a new user
	 *
	 * @param body
	 * @returns
	 */
	async register(body: RegisterUserDto): Promise<UserAuthResponse> {
		this.logger.log(`Attempting to register user ${body.emailAddress}`);

		// Check if the user exists by email address
		const userByEmailAddress = await this.userRepository.findOneBy({
			emailAddress: body.emailAddress.trim().toLowerCase(),
		});

		// Make sure we don't create another user using the same email address
		if (userByEmailAddress !== null) {
			throw new BadRequestException({
				errors: {
					emailAddress: "Email address already exists. Please use a different email address.",
				},
			});
		}

		// Create a new user
		const user = new User();
		user.uuid = crypto.randomUUID();
		user.fullName = body.fullName.trim();
		user.emailAddress = body.emailAddress.trim().toLowerCase();
		user.password = await bcrypt.hash(body.password.trim(), 10);
		user.role = UserRole.SuperAdmin;
		user.isActive = true;
		this.userRepository.save(user);

		// Create the payload for the jwt
		const payload = {
			jti: crypto.randomUUID(),
			type: "user",
			sub: user.uuid,
		};

		// Create a jwt for the user
		const token = await this.jwtService.signAsync(payload);

		// Save the token in cache so we can invalidate the user session later.
		await this.cacheManager.set(`auth:user-session:${payload.jti}`, token, (this.configService.get<number>('JWT_EXPIRES_IN') ?? 86400) * 1000);

		return {
			token: token,
			user: user,
		};
	}

	/**
	 * Logs in a user
	 *
	 * @param body
	 */
	async login(body: LoginUserDto): Promise<UserAuthResponse> {
		this.logger.log(`Attempting to login user ${body.emailAddress}`);

		const user = await this.userRepository.findOneBy({
			emailAddress: body.emailAddress.trim().toLowerCase(),
		});

		if (user === null) {
			throw new BadRequestException({
				error: "We weren't able to log you in. Give your email and password another look and try again.",
			});
		}

		// Match the password of the user
		if (!bcrypt.compareSync(body.password, user.password)) {
			throw new BadRequestException({
				error: "We weren't able to log you in. Give your email and password another look and try again.",
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

		// Save the token in cache so we can invalidate the user session later.
		await this.cacheManager.set(`auth:user-session:${payload.jti}`, token, (this.configService.get<number>('JWT_EXPIRES_IN') ?? 86400) * 1000);

		return {
			token: token,
			user: user,
		};
	}

	/**
	 * Remove the session token for a user from the cache to log them out
	 *
	 * @param jti
	 * @param auth
	 */
	async logout(jti: string, auth: User): Promise<void> {
		try {
			this.logger.log(`Attempting to log out user: ${auth.uuid} with jti: ${jti}`);
			await this.cacheManager.del(`auth:user-session:${jti}`);
		} catch (err) {
			this.logger.error(err);
		}
	}

	/**
	 * Sets up the mfa on the user account
	 *
	 * @param principal
	 * @returns
	 */
	async setupMfa(principal: User): Promise<UserMfaSetupResponse> {
		this.logger.log(`Setting up mfa for user: ${principal.uuid}`);

		// Find the user
		const self = await this.userRepository.findOneBy({ id: principal.id, });
		if (self === null) {
			throw new BadRequestException({
				error: "Failed to find the user.",
			});
		}

		// Make sure mfa isn't already enabled.
		if (self.isMfaEnabled) {
			throw new BadRequestException({
				error: "MFA is already been enabled.",
			});
		}

		// Generate a secret for the MFA
		const secret = speakeasy.generateSecret({
			otpauth_url: true,
			name: `${self.emailAddress} (Camion)`,
		});

		// Setup MFA for the user account
		self.secret = secret.base32;
		this.userRepository.save(self);

		return {
			otpauth_url: secret.otpauth_url as string,
		};
	}

	/**
	 * Enable MFA on a user account
	 *
	 * @param principal
	 * @param body
	 */
	async enableMfa(principal: User, body: EnableUserMfaDto): Promise<void> {
		this.logger.log(`Enabling mfa for user: ${principal.uuid}`);

		// Find the user
		const self = await this.userRepository.findOneBy({ id: principal.id, });
		if (self === null) {
			throw new BadRequestException({
				error: "Failed to find the user.",
			});
		}

		// Make sure mfa isn't already enabled.
		if (self.isMfaEnabled) {
			throw new BadRequestException({
				error: "MFA is already been enabled.",
			});
		}

		// Verify user password before enabling mfa
		if (!bcrypt.compareSync(body.password, self.password)) {
			throw new BadRequestException({
				error: "We weren't able to verify your password. Please check your password and try again.",
			});
		}

		// Verify the verification code against the secret stored.
		if (!speakeasy.totp.verify({ secret: self.secret, encoding: "base32", token: body.verificationCode, window: 1 })) {
			throw new BadRequestException({
				error: "Failed to verify your token. Please check and try again.",
			});
		}

		// Enable mfa on user accounts
		self.isMfaEnabled = true;
		this.userRepository.save(self);
	}

	/**
	 * Updates the current user
	 *
	 * @param principal
	 * @param body
	 * @returns
	 */
	async updateProfile(principal: User, body: UpdateUserDto): Promise<User> {
		this.logger.log(`Updating user: ${principal.uuid}`);

		// Find the user
		const self = await this.userRepository.findOneBy({ id: principal.id, });
		if (self === null) {
			throw new BadRequestException({
				error: "Failed to find the user.",
			});
		}

		self.fullName = body.fullName.trim();
		return this.userRepository.save(self);
	}

	/**
	 * Updates the current user's email address
	 *
	 * @param principal
	 * @param body
	 * @returns
	 */
	async updateEmailAddress(principal: User, body: UpdateUserEmailAddressDto) {
		this.logger.log(`Updating user email address: ${principal.uuid}`);

		// Check if another user exists by the same email address
		const userByEmailAddress = await this.userRepository.findOneBy({
			emailAddress: body.emailAddress.trim().toLowerCase(),
		});

		// Make sure we don't assign the same email address to more than 1 users
		if (userByEmailAddress !== null && userByEmailAddress.uuid !== principal.uuid) {
			throw new BadRequestException({
				errors: {
					emailAddress: "Email address already exists. Please use a different email address.",
				},
			});
		}

		// Find the user
		const self = await this.userRepository.findOneBy({ id: principal.id, });
		if (self === null) {
			throw new BadRequestException({
				error: "Failed to find the user.",
			});
		}

		self.emailAddress = body.emailAddress.trim().toLowerCase();
		return this.userRepository.save(self);
	}

	/**
	 * Updates the password of the current user
	 *
	 * @param principal
	 * @param body
	 * @returns
	 */
	async updatePassword(principal: User, body: UpdateUserPasswordDto): Promise<User> {
		this.logger.log(`Updating user password: ${principal.uuid}`);

		// Make sure new and confirmed passwords match
		if (body.passwordNew.trim() !== body.passwordConfirm.trim()) {
			throw new BadRequestException({
				errors: {
					passwordConfirm: "Your confirmed password don't match your new password. Please check and try again.",
				},
			});
		}

		// Find the user
		const self = await this.userRepository.findOneBy({ id: principal.id, });
		if (self === null) {
			throw new BadRequestException({
				error: "Failed to find the user by the provided id. Please check and try again.",
			});
		}

		// Make sure the old password matches
		if (!bcrypt.compareSync(body.passwordOld, self.password)) {
			throw new BadRequestException({
				errors: {
					passwordOld: "Failed to match the password. Please check and try again.",
				},
			});
		}

		self.password = await bcrypt.hash(body.passwordNew.trim(), 10);
		return this.userRepository.save(self);
	}
}

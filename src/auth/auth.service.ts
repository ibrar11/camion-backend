import * as crypto from "node:crypto";

import * as bcrypt from "bcrypt";

import {
	BadRequestException,
	Inject,
	Injectable,
	Logger,
	UnauthorizedException,
} from '@nestjs/common';

import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { JwtService } from '@nestjs/jwt';

import { Cache, CACHE_MANAGER } from '@nestjs/cache-manager';

import { ConfigService } from "@nestjs/config";

import { CountryCode, parsePhoneNumberFromString } from "libphonenumber-js";

import { RegisterUserDto } from './dtos/RegisterUserDto';
import { LoginUserDto } from './dtos/LoginUserDto';

import { UpdateUserDto } from "./dtos/UpdateUserDto";
import { UpdateUserEmailAddressDto } from "./dtos/UpdateUserEmailAddressDto";
import { UpdateUserPasswordDto } from "./dtos/UpdateUserPasswordDto";

import { RegisterCustomerByEmailAddressDto } from "./dtos/RegisterCustomerByEmailAddressDto";
import { RegisterCustomerByPhoneNumberDto } from "./dtos/RegisterCustomerByPhoneNumberDto";
import { VerifyCustomerDto } from "./dtos/VerifyCustomerDto";
import { RegisterCustomerDto } from "./dtos/RegisterCustomerDto";
import { LoginCustomerByEmailAddressDto } from "./dtos/LoginCustomerByEmailAddressDto";
import { LoginCustomerByPhoneNumberDto } from "./dtos/LoginCustomerByPhoneNumberDto";

import { User } from '../users/entities/user.entity';
import { UserRole } from '../users/enums/UserRole';

import { Customer } from "../customers/entities/customer.entity";

import { RegistrationRequest } from "./entities/registration-request.entity";

import { UserAuthResponse } from './response/UserAuthResponse';
import { CustomerAuthVerificationResponse } from "./response/CustomerAuthVerificationResponse";
import { CustomerAuthResponse } from "./response/CustomerAuthResponse";

@Injectable()
export class AuthService {
	private readonly logger = new Logger(AuthService.name);

	constructor(
		@InjectRepository(User) private readonly userRepository: Repository<User>,
		@InjectRepository(Customer) private readonly customerRepository: Repository<Customer>,
		@InjectRepository(RegistrationRequest) private readonly registrationRequestRepository: Repository<RegistrationRequest>,
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
	async registerUser(body: RegisterUserDto): Promise<UserAuthResponse> {
		this.logger.log(`Attempting to register user ${body.emailAddress}`);

		// Check if the user exists by email address
		const userByEmailAddress = await this.userRepository.findOneBy({
			emailAddress: body.emailAddress.trim().toLowerCase(),
		});

		// Make sure we don't create another user using the same email address
		if (userByEmailAddress !== null) {
			throw new BadRequestException({
				status: "fail",
				errors: {
					error: "Email address already exists. Please use a different email address.",
				},
			});
		}

		// Create a new user
		const user = new User();
		user.uuid = crypto.randomUUID();
		user.fullName = body.fullName.trim();
		user.emailAddress = body.emailAddress.trim().toLowerCase();
		user.password = await bcrypt.hash(body.password.trim(), 10);
		user.role = UserRole.User;
		user.isActive = false;
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
		await this.cacheManager.set(`auth:user-session:${payload.jti}`, token, this.configService.get<number>('JWT_EXPIRES_IN'));

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
	async loginUser(body: LoginUserDto): Promise<UserAuthResponse> {
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

		// Match the password of the user
		if (!bcrypt.compareSync(body.password, user.password)) {
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

		// Save the token in cache so we can invalidate the user session later.
		await this.cacheManager.set(`auth:user-session:${payload.jti}`, token, this.configService.get<number>('JWT_EXPIRES_IN'));

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
	async logoutUser(jti: string, auth: User): Promise<void> {
		try {
			this.logger.log(`Attempting to log out user: ${auth.uuid} with jti: ${jti}`);
			await this.cacheManager.del(`auth:user-session:${jti}`);
		} catch (err) {
			this.logger.error(err);
		}
	}

	/**
	 * Updates the current user
	 *
	 * @param body
	 */
	async updateUser(auth: User, body: UpdateUserDto): Promise<User> {
		this.logger.log(`Updating user: ${auth.uuid}`);

		// Find the user
		const user = await this.userRepository.findOneBy({ uuid: auth.uuid, });
		if (user === null) {
			throw new BadRequestException({
				errors: {
					error: "Faild to find the user.",
				},
			});
		}

		user.fullName = body.fullName.trim();
		return this.userRepository.save(user);
	}

	/**
	 * Updates the current user's email address
	 *
	 * @param auth
	 * @param body
	 */
	async updateUserEmailAddress(auth: User, body: UpdateUserEmailAddressDto) {
		this.logger.log(`Updating user email address: ${auth.uuid}`);

		// Check if another user exists by the same email address
		const userByEmailAddress = await this.userRepository.findOneBy({
			emailAddress: body.emailAddress.trim().toLowerCase(),
		});

		// Make sure we don't assign the same email address to more than 1 users
		if (userByEmailAddress !== null && userByEmailAddress.uuid !== auth.uuid) {
			throw new BadRequestException({
				errors: {
					emailAddress: "Email address already exists. Please use a different email address.",
				},
			});
		}

		// Find the user
		const user = await this.userRepository.findOneBy({ uuid: auth.uuid, });
		if (user === null) {
			throw new BadRequestException({
				errors: {
					error: "Faild to find the user.",
				},
			});
		}

		user.emailAddress = body.emailAddress.trim().toLowerCase();
		return this.userRepository.save(user);
	}

	/**
	 * Updates the password of the current user
	 *
	 * @param auth
	 * @param body
	 * @returns
	 */
	async updateUserPassword(auth: User, body: UpdateUserPasswordDto): Promise<User> {
		this.logger.log(`Update user password: ${auth.uuid}`);

		// Make sure new and confirmed passwords match
		if (body.passwordNew.trim() !== body.passwordConfirm.trim()) {
			throw new BadRequestException({
				status: "fail",
				errors: {
					passwordConfirm: "Your confirmed password don't match your new password. Please check and try again.",
				},
			});
		}

		// Find the user
		const user = await this.userRepository.findOneBy({ uuid: auth.uuid, });
		if (user === null) {
			throw new BadRequestException({
				status: "fail",
				errors: {
					error: "Failed to find the user by the provided id. Please check and try again.",
				},
			});
		}

		// Make sure the old password matches
		if (!bcrypt.compareSync(body.passwordOld, user.password)) {
			throw new BadRequestException({
				status: "fail",
				errors: {
					passwordOld: "Failed to match the password. Please check and try again.",
				},
			});
		}

		user.password = await bcrypt.hash(body.passwordNew.trim(), 10);
		return this.userRepository.save(user);
	}

	/**
	 * Registers a user using their email address
	 *
	 * @param body
	 * @returns
	 */
	async registerCustomerEmailAddress(body: RegisterCustomerByEmailAddressDto): Promise<CustomerAuthVerificationResponse> {
		this.logger.log(`Attempting to register customer ${body.emailAddress}`);

		// Make sure we don't already have a registration request for the same email
		const requestByEmailAddress = await this.registrationRequestRepository.findOneBy({
			emailAddress: body.emailAddress.trim().toLowerCase(),
		});

		if (requestByEmailAddress !== null) {
			throw new BadRequestException({
				status: "fail",
				errors: {
					error: "You've already started to register using this email address. Please use a different email address.",
				},
			});
		}

		// Generate a random secret to verify user email address
		const secret = crypto.randomInt(100000, 1000000).toString();

		// Create a registration request
		const request = new RegistrationRequest();
		request.uuid = crypto.randomUUID();
		request.emailAddress = body.emailAddress.trim().toLowerCase();
		request.secret = await bcrypt.hash(secret, 10);
		this.registrationRequestRepository.save(request);

		// TODO: Send the secret to the customer using their email address
		console.log(secret);

		// Create a payload for the session token
		const payload = {
			jti: crypto.randomUUID(),
			sub: request.uuid,
		};

		return {
			token: await this.jwtService.signAsync(payload),
		};
	}

	/**
	 * Register a user using their phone number
	 *
	 * @param body
	 * @returns
	 */
	async registerCustomerPhoneNumber(body: RegisterCustomerByPhoneNumberDto): Promise<CustomerAuthVerificationResponse> {
		this.logger.log(`Attempting to register customer ${body.phoneNumber}`);

		// Trim the phone number
		if (body.phoneNumber !== null) {
			body.phoneNumber = body.phoneNumber.trim();
		}

		// Format the phone number if a country code is provided
		if (body.phoneNumber !== null && body.countryCode !== null) {
			body.phoneNumber = parsePhoneNumberFromString(body.phoneNumber, body.countryCode as CountryCode)?.formatInternational() as string;
		}

		// Make sure we don't already have a registration request for the same phone number
		const requestByPhoneNumber = await this.registrationRequestRepository.findOneBy({
			phoneNumber: body.phoneNumber.trim(),
		});

		if (requestByPhoneNumber !== null) {
			throw new BadRequestException({
				status: "fail",
				errors: {
					error: "You've already started to register using this phone number. Please use a different phone number.",
				},
			});
		}

		// Generate a random secret to verify user email address
		const secret = crypto.randomInt(100000, 1000000).toString();
		console.log(secret);

		// Create a registration request
		const request = new RegistrationRequest();
		request.uuid = crypto.randomUUID();
		request.phoneNumber = body.phoneNumber.trim();
		request.secret = await bcrypt.hash(secret, 10);
		this.registrationRequestRepository.save(request);

		// TODO: Send the secret to the customer using their phone number

		// Create a payload for the session token
		const payload = {
			jti: crypto.randomUUID(),
			sub: request.uuid,
		};

		return {
			token: await this.jwtService.signAsync(payload),
		};
	}

	/**
	 * Verify customer email address
	 *
	 * @param body
	 */
	async verifyCustomerEmailAddress(body: VerifyCustomerDto): Promise<void> {
		this.logger.log(`Attempting to verify customer using email address`);

		// Make sure we have a valid token
		if (!body.token) {
			throw new UnauthorizedException();
		}

		try {
			const tokenPayload: { sub: string, } = await this.jwtService.verifyAsync(body.token);
			if (!tokenPayload.sub) {
				throw new UnauthorizedException();
			}

			// Find the request
			const request = await this.registrationRequestRepository.findOneBy({
				uuid: tokenPayload.sub,
			});
			if (request === null) {
				throw new UnauthorizedException();
			}

			// Mark the email address as verified
			request.isEmailAddressVerified = true;
			this.registrationRequestRepository.save(request);
		} catch (err) {
			this.logger.error(err);
		}
	}

	/**
	 * Verifies the customer phone number
	 *
	 * @param body
	 */
	async verifyCustomerPhoneNumber(body: VerifyCustomerDto): Promise<void> {
		this.logger.log(`Attempting to verify customer using phone number`);

		// Make sure we have a valid token
		if (!body.token) {
			throw new UnauthorizedException();
		}

		try {
			const tokenPayload: { sub: string, } = await this.jwtService.verifyAsync(body.token);
			if (!tokenPayload.sub) {
				throw new UnauthorizedException();
			}

			// Find the request
			const request = await this.registrationRequestRepository.findOneBy({
				uuid: tokenPayload.sub,
			});
			if (request === null) {
				throw new UnauthorizedException();
			}

			// Mark the phone number as verified
			request.isPhoneNumberVerified = true;
			this.registrationRequestRepository.save(request);
		} catch (err) {
			this.logger.error(err);
		}
	}

	/**
	 * Registers a customer
	 *
	 * @param body
	 * @returns
	 */
	async registerCustomer(body: RegisterCustomerDto): Promise<CustomerAuthResponse | null> {
		this.logger.log(`Attempting to register a customer`);

		// Make sure we have a valid token
		if (!body.token) {
			throw new UnauthorizedException();
		}

		try {
			const tokenPayload: { sub: string, } = await this.jwtService.verifyAsync(body.token);
			if (!tokenPayload.sub) {
				throw new UnauthorizedException();
			}

			// Find the request
			const request = await this.registrationRequestRepository.findOneBy({
				uuid: tokenPayload.sub,
			});

			if (request === null) {
				throw new UnauthorizedException();
			}

			// Make sure we don't have a customer using the same email address
			if (request.emailAddress !== null) {
				const customerByEmailAddress = await this.customerRepository.findOneBy({
					emailAddress: request.emailAddress,
				});

				if (customerByEmailAddress !== null) {
					throw new BadRequestException({
						errors: {
							emailAddress: "Email address already exists. Please use a different email address.",
						},
					});
				}
			}

			// Make sure we don't have a customer using the same phone number
			if (request.phoneNumber !== null) {
				const customerByPhoneNumber = await this.customerRepository.findOneBy({
					phoneNumber: request.phoneNumber,
				});

				if (customerByPhoneNumber !== null) {
					throw new BadRequestException({
						errors: {
							emailAddress: "Phone number already exists. Please use a different phone number.",
						},
					});
				}
			}

			// Create the customer
			const customer = new Customer();
			customer.uuid = crypto.randomUUID();
			customer.fullName = body.fullName.trim();
			customer.emailAddress = request.emailAddress;
			customer.phoneNumber = request.phoneNumber;
			customer.password = await bcrypt.hash(body.password.trim(), 10);
			customer.isEmailAddressVerified = request.isEmailAddressVerified;
			customer.isPhoneNumberVerified = request.isPhoneNumberVerified;
			customer.isActive = true;
			this.customerRepository.save(customer);

			// Delete the registration request after the sign up was successful
			await this.registrationRequestRepository.delete({
				uuid: tokenPayload.sub,
			});

			// Create the payload
			const payload = {
				jti: crypto.randomUUID(),
				type: "customer",
				sub: customer.uuid,
			};

			// Create the jwt for the customer
			const token = await this.jwtService.signAsync(payload);

			// Save the token in cache so we can invalidate the customer session later.
			await this.cacheManager.set(`auth:customer-session:${payload.jti}`, token, this.configService.get<number>('JWT_EXPIRES_IN'));

			return {
				token: token,
				customer: customer,
			};
		} catch (err) {
			this.logger.error(err);
		}

		return null;
	}

	/**
	 * Logs in a customer using their email address
	 *
	 * @param body
	 * @returns
	 */
	async loginCustomerByEmailAddress(body: LoginCustomerByEmailAddressDto): Promise<CustomerAuthResponse> {
		this.logger.log(`Attempting to login customer by email address ${body.emailAddress}`);

		// Check if the customer exists by email address
		const customer = await this.customerRepository.findOneBy({
			emailAddress: body.emailAddress.trim().toLowerCase(),
		});

		if (customer === null) {
			throw new BadRequestException({
				status: "fail",
				errors: {
					error: "We weren't able to log you in. Give your email and password another look and try again.",
				},
			});
		}

		// Match the password of the customer
		if (!bcrypt.compareSync(body.password, customer.password)) {
			throw new BadRequestException({
				status: "fail",
				errors: {
					error: "We weren't able to log you in. Give your email and password another look and try again.",
				},
			});
		}

		// Create the payload to the jwt
		const payload = {
			jti: crypto.randomUUID(),
			type: "customer",
			sub: customer.uuid,
		};

		// Create a jwt for the customer
		const token = await this.jwtService.signAsync(payload);

		// Save the token in cache so we can invalidate the customer session later.
		await this.cacheManager.set(`auth:customer-session:${payload.jti}`, token, this.configService.get<number>('JWT_EXPIRES_IN'));

		return {
			token: token,
			customer: customer,
		};
	}

	/**
	 * Logs in a customer using their phone number
	 *
	 * @param body
	 * @returns
	 */
	async loginCustomerByPhoneNumber(body: LoginCustomerByPhoneNumberDto): Promise<CustomerAuthResponse> {
		this.logger.log(`Attempting to login customer by phone number ${body.phoneNumber}`);

		// Trim the phone number
		if (body.phoneNumber !== null) {
			body.phoneNumber = body.phoneNumber.trim();
		}

		// Format the phone number if a country code is provided
		if (body.phoneNumber !== null && body.countryCode !== null) {
			body.phoneNumber = parsePhoneNumberFromString(body.phoneNumber, body.countryCode as CountryCode)?.formatInternational() as string;
		}

		// Check if the customer exists by phone number
		const customer = await this.customerRepository.findOneBy({
			phoneNumber: body.phoneNumber.trim(),
		});

		if (customer === null) {
			throw new BadRequestException({
				status: "fail",
				errors: {
					error: "We weren't able to log you in. Give your email and password another look and try again.",
				},
			});
		}

		// Match the password of the customer
		if (!bcrypt.compareSync(body.password, customer.password)) {
			throw new BadRequestException({
				status: "fail",
				errors: {
					error: "We weren't able to log you in. Give your email and password another look and try again.",
				},
			});
		}

		// Create the payload to the jwt
		const payload = {
			jti: crypto.randomUUID(),
			type: "customer",
			sub: customer.uuid,
		};

		// Create a jwt for the customer
		const token = await this.jwtService.signAsync(payload);

		// Save the token in cache so we can invalidate the customer session later.
		await this.cacheManager.set(`auth:customer-session:${payload.jti}`, token, this.configService.get<number>('JWT_EXPIRES_IN'));

		return {
			token: token,
			customer: customer,
		};
	}

	/**
	 * Remove the session token for a customer from the cache to log them out
	 *
	 * @param jti
	 * @param customer
	 */
	async logoutCustomer(jti: string, customer: Customer): Promise<void> {
		try {
			this.logger.log(`Attempting to log out customer: ${customer.uuid} with jti: ${jti}`);
			await this.cacheManager.del(`auth:customer-session:${jti}`);
		} catch (err) {
			this.logger.error(err);
		}
	}
}

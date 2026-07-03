import * as crypto from "node:crypto";

import * as bcrypt from "bcrypt";

import { OAuth2Client, LoginTicket } from "google-auth-library";
import { createRemoteJWKSet, jwtVerify, SignJWT, importPKCS8 } from "jose";

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

import { parsePhoneNumberFromString } from "libphonenumber-js";

import { isPhoneNumberValid } from "../common/phone-number-validation";

import { GoogleMobileAuthDto } from "./dtos/GoogleMobileAuthDto";
import { FacebookMobileAuthDto } from "./dtos/FacebookMobileAuthDto";
import { AppleMobileAuthDto } from "./dtos/AppleMobileAuthDto";
import { VerifyCustomerDto } from "./dtos/VerifyCustomerDto";
import { RegisterCustomerDto } from "./dtos/RegisterCustomerDto";
import { LoginCustomerByEmailAddressDto } from "./dtos/LoginCustomerByEmailAddressDto";
import { LoginCustomerByPhoneNumberDto } from "./dtos/LoginCustomerByPhoneNumberDto";

import { UpdateCustomerDto } from "./dtos/UpdateCustomerDto";

import { Customer } from "../customers/entities/customer.entity";
import { LoginRequest } from "./entities/login-request.entity";

import { CustomerAuthVerificationResponse } from "./response/CustomerAuthVerificationResponse";
import { CustomerAuthResponse } from "./response/CustomerAuthResponse";

import { CustomerRole } from "src/customers/enums/CustomerRole";
import { TwilioService } from "src/common/twilio.service";

import { EmailService } from "src/email/email.service";

import { CartItem } from "../cart/entities/cart-items.entity";

import { calculateStock } from "../common/calculateStock";

import { ProductStatus } from "../inventory/enums/ProductStatus.enum";

@Injectable()
export class CustomerAuthService {
	private readonly logger = new Logger(CustomerAuthService.name);
	private readonly isLocal: boolean;
	private readonly devMagicCode: string | null;

	constructor(
		@InjectRepository(Customer) private readonly customerRepository: Repository<Customer>,
		@InjectRepository(LoginRequest) private readonly loginRequestRepository: Repository<LoginRequest>,
		@InjectRepository(CartItem) private readonly cartItemRepository: Repository<CartItem>,
		@Inject(CACHE_MANAGER) private readonly cacheManager: Cache,
		private readonly configService: ConfigService,
		private readonly jwtService: JwtService,
		private readonly twilioService: TwilioService,
		private readonly emailService: EmailService,
	) {
		this.isLocal = this.configService.get<string>('NODE_ENV') === 'local';
		const magicOtpEnabled = this.configService.get<string>('ENABLE_MAGIC_OTP') === 'Yes';
		this.devMagicCode = magicOtpEnabled
			? (this.configService.get<string>('MAGIC_OTP') ?? '123456')
			: null;
	}

	/**
	 * Register customer using the phone number and email address
	 *
	 * @param body
	 * @returns
	 */
	async registerCustomer(body: RegisterCustomerDto): Promise<CustomerAuthResponse> {
		this.logger.log(`Attempting to register customer: ${body.fullName}`);

		// Check if the phone number is valid
		if (!isPhoneNumberValid(body.phoneNumber, body.countryCode)) {
			throw new BadRequestException({
				phoneNumber: "Please enter a valid phone number.",
			});
		}

		// Remove the prefix + sign from the country code
		let countryCode = body.countryCode;
		if (countryCode !== null && countryCode !== undefined && countryCode.startsWith('+')) {
			countryCode = countryCode.substring(1);
		}

		// Trim the phone number
		if (body.phoneNumber !== null && body.phoneNumber !== undefined) {
			body.phoneNumber = body.phoneNumber.trim();
		}

		// Format the phone number if a country code is provided
		if (body.phoneNumber !== null && countryCode !== null) {
			body.phoneNumber = parsePhoneNumberFromString(body.phoneNumber, { defaultCallingCode: countryCode, extract: false })?.formatInternational() ?? body.phoneNumber;
		}

		// Make sure we don't have a customer using the same email address
		const customerByEmailAddress = await this.customerRepository.findOneBy({
			emailAddress: body.emailAddress.trim().toLowerCase(),
		});

		if (customerByEmailAddress !== null) {
			throw new BadRequestException({
				errors: {
					emailAddress: "Email address already exists. Please use a different email address.",
				},
			});
		}

		// Make sure we don't have a customer using the same phone number
		const customerByPhoneNumber = await this.customerRepository.findOneBy({
			phoneNumber: body.phoneNumber.trim(),
		});

		if (customerByPhoneNumber !== null) {
			throw new BadRequestException({
				errors: {
					phoneNumber: "Phone number already exists. Please use a different phone number.",
				},
			});
		}

		// Create the customer
		const customer = new Customer();
		customer.uuid = crypto.randomUUID();
		customer.fullName = body.fullName.trim();
		customer.emailAddress = body.emailAddress.toLowerCase().trim();
		customer.phoneNumber = body.phoneNumber.trim();
		customer.password = "";
		customer.role = CustomerRole.Customer;
		customer.isActive = true;
		if (body.firebaseDeviceToken?.trim()) {
			customer.firebaseDeviceToken ??= [];

			const token = body.firebaseDeviceToken.trim();

			if (!customer.firebaseDeviceToken.includes(token)) {
				customer.firebaseDeviceToken.push(token);
			}
		}
		await this.customerRepository.save(customer);

		await this.mergeGuestCart(customer, body.guestUUID);

		// Create the payload
		const payload = {
			jti: crypto.randomUUID(),
			type: "customer",
			sub: customer.uuid,
		};

		// Create the jwt for the customer
		const token = await this.jwtService.signAsync(payload);

		// Save the token in the cache so we can invalidate the customer session later.
		await this.cacheManager.set(`auth:customer-session:${payload.jti}`, token, (this.configService.get<number>('JWT_EXPIRES_IN') ?? 86400) * 1000);

		return {
			token: token,
			customer: customer,
		};
	}

	/**
	 * Logs a customer in using their phone number
	 *
	 * @param body
	 * @returns
	 */
	async loginCustomerByPhoneNumber(body: LoginCustomerByPhoneNumberDto): Promise<CustomerAuthVerificationResponse> {
		this.logger.log(`Attempting to login customer by phone number: ${body.countryCode} ${body.phoneNumber}`);

		// Check if the phone number is valid
		if (!isPhoneNumberValid(body.phoneNumber, body.countryCode)) {
			throw new BadRequestException({
				phoneNumber: "Please enter a valid phone number.",
			});
		}

		// Remove the prefix + sign from the country code
		let countryCode = body.countryCode;
		if (countryCode !== null && countryCode !== undefined && countryCode.startsWith('+')) {
			countryCode = countryCode.substring(1);
		}

		// Trim the phone number
		if (body.phoneNumber !== null && body.phoneNumber !== undefined) {
			body.phoneNumber = body.phoneNumber.trim();
		}

		// Format the phone number if a country code is provided
		if (body.phoneNumber !== null && countryCode !== null) {
			body.phoneNumber = parsePhoneNumberFromString(body.phoneNumber, { defaultCallingCode: countryCode, extract: false })?.formatInternational() ?? body.phoneNumber;
		}

		// Find the customer using their phone number
		const customer = await this.customerRepository.findOneBy({
			phoneNumber: body.phoneNumber?.trim(),
		});

		if (customer === null) {
			throw new BadRequestException({
				errors: {
					phoneNumber: "Customer not found with the provided phone number.",
				},
			});
		}

		if (!customer.isActive) {
			if (customer.deletedAt) {
				throw new UnauthorizedException({ error: 'Account has been permanently deleted. Please contact support to restore your account.' });
			}
			if (!customer.markedForDeletionAt) {
				throw new UnauthorizedException({ error: 'Account is deactivated.' });
			}
			// Customer is in grace period — allow OTP; reactivation completes on successful verify
		}

		if (body.firebaseDeviceToken?.trim()) {
			const firebaseToken = body.firebaseDeviceToken.trim();
			customer.firebaseDeviceToken = Array.isArray(customer.firebaseDeviceToken)
				? customer.firebaseDeviceToken
				: [];

			customer.firebaseDeviceToken = [
				...new Set([
					...customer.firebaseDeviceToken,
					firebaseToken,
				]),
			];

			await this.customerRepository.save(customer);
		}

		await this.mergeGuestCart(customer, body.guestUUID);

		const secret = crypto.randomInt(100000, 1000000).toString();

		// Create a login request
		const request = new LoginRequest();
		request.uuid = crypto.randomUUID();
		request.customer = customer;
		request.secret = await bcrypt.hash(secret, 10);
		await this.loginRequestRepository.save(request);

		if (this.isLocal) {
			this.logger.log(`[LOCAL] OTP for ${customer.phoneNumber}: ${secret}`);
		} else {
			await this.twilioService.sendOtp(customer.phoneNumber!, secret);
		}

		// Create a payload for the session token
		const payload = {
			jti: crypto.randomUUID(),
			sub: request.uuid,
		};

		// Generate a token for the customer to continue login
		return {
			token: await this.jwtService.signAsync(payload),
		};
	}

	/**
	 * Logs a customer in using their email address
	 *
	 * @param body
	 * @returns
	 */
	async loginCustomerByEmailAddress(body: LoginCustomerByEmailAddressDto): Promise<CustomerAuthVerificationResponse> {
		this.logger.log(`Attempting to login customer by email address: ${body.emailAddress}`);

		// Find the customer using their phone number
		const customer = await this.customerRepository.findOneBy({
			emailAddress: body.emailAddress.toLowerCase().trim(),
		});

		if (customer === null) {
			throw new BadRequestException({
				errors: {
					emailAddress: "Customer not found with the provided email address.",
				},
			});
		}

		if (!customer.isActive) {
			if (customer.deletedAt) {
				throw new UnauthorizedException({ error: 'Account has been permanently deleted. Please contact support to restore your account.' });
			}
			if (!customer.markedForDeletionAt) {
				throw new UnauthorizedException({ error: 'Account is deactivated.' });
			}
			// Customer is in grace period — allow OTP; reactivation completes on successful verify
		}

		if (body.firebaseDeviceToken?.trim()) {
			const firebaseToken = body.firebaseDeviceToken.trim();
			customer.firebaseDeviceToken = Array.isArray(customer.firebaseDeviceToken)
				? customer.firebaseDeviceToken
				: [];

			customer.firebaseDeviceToken = [
				...new Set([
					...customer.firebaseDeviceToken,
					firebaseToken,
				]),
			];

			await this.customerRepository.save(customer);
		}

		await this.mergeGuestCart(customer, body.guestUUID);

		const secret = crypto.randomInt(100000, 1000000).toString();
		// Create a login request
		const request = new LoginRequest();
		request.uuid = crypto.randomUUID();
		request.customer = customer;
		request.secret = await bcrypt.hash(secret, 10);
		await this.loginRequestRepository.save(request);

		if (this.isLocal) {
			this.logger.log(`[LOCAL] OTP for ${customer.emailAddress}: ${secret}`);
		} else {
			await this.emailService.sendOtpEmail(customer.emailAddress, { otp: secret });
		}

		// Create a payload for the session token
		const payload = {
			jti: crypto.randomUUID(),
			sub: request.uuid,
		};

		// Generate a token for the customer to continue login
		return {
			token: await this.jwtService.signAsync(payload),
		};
	}

	/**
	 * Verify customer login using their phone number
	 *
	 * @param body
	 * @returns
	 */
	async verifyCustomerByPhoneNumber(body: VerifyCustomerDto): Promise<CustomerAuthResponse> {
		this.logger.log(`Attempting to verify customer using email address`);

		// Make sure we have a valid token
		if (!body.token) {
			throw new UnauthorizedException({
				error: "Please provide a valid session token to continue login.",
			});
		}

		// Verify the jwt
		const tokenPayload: { sub: string, } = await this.jwtService.verifyAsync(body.token);
		if (!tokenPayload.sub) {
			throw new UnauthorizedException({
				error: "Authentication failed. Invalid or expired token.",
			});
		}

		// Find the login request
		const request = await this.loginRequestRepository.findOne({
			where: {
				uuid: tokenPayload.sub,
			},
			relations: {
				customer: true,
			},
		});
		if (request === null) {
			throw new UnauthorizedException({
				error: "Your login session has expired. Please try again.",
			});
		}

		// Accept magic OTP or the real OTP stored in the login request
		const magicMatch = this.devMagicCode !== null && body.secret === this.devMagicCode;
		if (!magicMatch && !bcrypt.compareSync(body.secret, request.secret)) {
			throw new BadRequestException({
				error: "We weren't able to log you in. Give your phone number another look and try again.",
			});
		}

		// Delete the login request after successful login
		await this.loginRequestRepository.delete({ uuid: request.uuid, });

		// Cancel pending deletion if customer is in grace period
		if (request.customer.markedForDeletionAt) {
			request.customer = await this.reactivateOrThrow(request.customer);
		}

		await this.mergeGuestCart(request.customer, body.guestUUID);

		// Create the payload for the jwt
		const payload = {
			jti: crypto.randomUUID(),
			type: "customer",
			sub: request.customer.uuid,
		};

		// Create a jwt for the customer
		const token = await this.jwtService.signAsync(payload);

		// Save the token in cache so we can invalidate the customer session later.
		await this.cacheManager.set(`auth:customer-session:${payload.jti}`, token, (this.configService.get<number>('JWT_EXPIRES_IN') ?? 86400) * 1000);

		return {
			token: token,
			customer: request.customer,
		};
	}

	/**
	 * Verify customer login using their email address
	 *
	 * @param body
	 * @returns
	 */
	async verifyCustomerByEmailAddress(body: VerifyCustomerDto): Promise<CustomerAuthResponse> {
		this.logger.log(`Attempting to verify customer using phone number`);

		// Make sure we have a valid token
		if (!body.token) {
			throw new UnauthorizedException({
				error: "Please provide a valid session token to continue login.",
			});
		}

		// Verify the jwt
		const tokenPayload: { sub: string, } = await this.jwtService.verifyAsync(body.token);
		if (!tokenPayload.sub) {
			throw new UnauthorizedException({
				error: "Authentication failed. Invalid or expired token.",
			});
		}

		// Find the login request
		const request = await this.loginRequestRepository.findOne({
			where: {
				uuid: tokenPayload.sub,
			},
			relations: {
				customer: true,
			},
		});
		if (request === null) {
			throw new UnauthorizedException({
				error: "Your login session has expired. Please try again.",
			});
		}

		// Accept magic OTP or the real OTP stored in the login request
		const magicMatch = this.devMagicCode !== null && body.secret === this.devMagicCode;
		if (!magicMatch && !bcrypt.compareSync(body.secret, request.secret)) {
			throw new BadRequestException({
				error: "We weren't able to log you in. Give your email address another look and try again.",
			});
		}

		// Delete the login request after successful login
		await this.loginRequestRepository.delete({ uuid: request.uuid, });

		// Cancel pending deletion if customer is in grace period
		if (request.customer.markedForDeletionAt) {
			request.customer = await this.reactivateOrThrow(request.customer);
		}

		await this.mergeGuestCart(request.customer, body.guestUUID);

		// Create the payload for the jwt
		const payload = {
			jti: crypto.randomUUID(),
			type: "customer",
			sub: request.customer.uuid,
		};

		// Create a jwt for the customer
		const token = await this.jwtService.signAsync(payload);

		// Save the token in cache so we can invalidate the customer session later.
		await this.cacheManager.set(`auth:customer-session:${payload.jti}`, token, (this.configService.get<number>('JWT_EXPIRES_IN') ?? 86400) * 1000);

		return {
			token: token,
			customer: request.customer,
		};
	}

	/**
	 * Remove the session token for a customer from the cache to log them out
	 *
	 * @param jti
	 * @param customer
	 */
	async logout(jti: string, customer: Customer): Promise<void> {
		try {
			this.logger.log(`Attempting to log out customer: ${customer.uuid} with jti: ${jti}`);
			await this.cacheManager.del(`auth:customer-session:${jti}`);
		} catch (err) {
			this.logger.error(err);
		}
	}

	async loginWithGoogleMobile(dto: GoogleMobileAuthDto): Promise<CustomerAuthResponse> {
		this.logger.log(`Attempting to login customer by google mobile: ${JSON.stringify(dto)}`);

		const { idToken, firebaseDeviceToken, guestUUID } = dto;

		const allowedAudiences: string[] = [];
		const iosClientId = this.configService.get<string>('GOOGLE_IOS_CLIENT_ID');
		const androidClientId = this.configService.get<string>('GOOGLE_ANDROID_CLIENT_ID');
		if (iosClientId) allowedAudiences.push(iosClientId);
		if (androidClientId) allowedAudiences.push(androidClientId);

		if (allowedAudiences.length === 0) {
			throw new UnauthorizedException({ error: 'Google authentication not configured.' });
		}

		let ticket: LoginTicket;
		try {
			const client = new OAuth2Client();
			ticket = await client.verifyIdToken({ idToken, audience: allowedAudiences });
		} catch {
			throw new UnauthorizedException({ error: 'Invalid or expired Google ID token.' });
		}

		const payload = ticket.getPayload();
		if (!payload) {
			throw new UnauthorizedException({ error: 'Invalid token payload.' });
		}

		const googleId = payload.sub;
		const email = payload.email || '';
		const fullName = payload.name || '';

		if (!email || !googleId) {
			throw new UnauthorizedException({ error: 'Email or Google ID not found in token.' });
		}

		const result = await this.findOrCreateGoogleCustomer({ email, fullName, googleId, firebaseDeviceToken });
		await this.mergeGuestCart(result.customer, guestUUID);
		return result;
	}

	async loginWithGoogleWeb(profile: { email: string; fullName: string; googleId: string }, guestUUID?: string): Promise<CustomerAuthResponse> {
		const result = await this.findOrCreateGoogleCustomer(profile);
		await this.mergeGuestCart(result.customer, guestUUID);
		return result;
	}

	async loginWithFacebookMobile(dto: FacebookMobileAuthDto): Promise<CustomerAuthResponse> {
		this.logger.log(`Attempting to login customer by facebook mobile: ${JSON.stringify(dto)}`);

		this.logger.log(`Face mobile login firebase device token: ${dto.firebaseDeviceToken}`)

		const isJwt = dto.accessToken.split('.').length === 3;

		const result = isJwt
			? await this.loginWithFacebookLimitedLogin(dto.accessToken, dto.firebaseDeviceToken)
			: await this.loginWithFacebookAccessToken(dto.accessToken, dto.firebaseDeviceToken);
		await this.mergeGuestCart(result.customer, dto.guestUUID);
		return result;
	}

	private async loginWithFacebookAccessToken(accessToken: string, firebaseDeviceToken?: string): Promise<CustomerAuthResponse> {
		const appId = this.configService.get<string>('FACEBOOK_APP_ID');
		const appSecret = this.configService.get<string>('FACEBOOK_APP_SECRET');

		if (!appId || !appSecret) {
			throw new UnauthorizedException({ error: 'Facebook authentication not configured.' });
		}

		const appAccessToken = `${appId}|${appSecret}`;

		const debugRes = await fetch(
			`https://graph.facebook.com/debug_token?input_token=${accessToken}&access_token=${appAccessToken}`,
		);
		const debugData = (await debugRes.json()) as { data?: { is_valid?: boolean; app_id?: string } };

		if (!debugData.data?.is_valid) {
			throw new UnauthorizedException({ error: 'Invalid Facebook access token.' });
		}
		if (debugData.data.app_id !== appId) {
			throw new UnauthorizedException({ error: 'Facebook token app mismatch.' });
		}

		const profileRes = await fetch(
			`https://graph.facebook.com/me?fields=id,name,email&access_token=${accessToken}`,
		);
		const profileData = (await profileRes.json()) as { id?: string; name?: string; email?: string };

		const facebookId = profileData.id;
		if (!facebookId) {
			throw new UnauthorizedException({ error: 'Facebook ID not found.' });
		}

		return this.findOrCreateFacebookCustomer({
			email: profileData.email || '',
			fullName: profileData.name || '',
			facebookId,
			firebaseDeviceToken: firebaseDeviceToken || '',
		});
	}

	private async loginWithFacebookLimitedLogin(idToken: string, firebaseDeviceToken?: string): Promise<CustomerAuthResponse> {
		const appId = this.configService.get<string>('FACEBOOK_APP_ID');
		if (!appId) {
			throw new UnauthorizedException({ error: 'Facebook authentication not configured.' });
		}

		let payload: { sub?: string; name?: string; email?: string; aud?: string | string[] };
		try {
			const JWKS = createRemoteJWKSet(new URL('https://limited.facebook.com/.well-known/oauth/openid/jwks/'));
			const { payload: verified } = await jwtVerify(idToken, JWKS, {
				issuer: 'https://www.facebook.com',
				audience: appId,
			});
			payload = verified as typeof payload;
		} catch {
			throw new UnauthorizedException({ error: 'Invalid Facebook Limited Login token.' });
		}

		const facebookId = payload.sub;
		if (!facebookId) {
			throw new UnauthorizedException({ error: 'Facebook ID not found in token.' });
		}

		return this.findOrCreateFacebookCustomer({
			email: payload.email || '',
			fullName: payload.name || '',
			facebookId,
			firebaseDeviceToken: firebaseDeviceToken || '',
		});
	}

	async loginWithFacebookWeb(profile: { email: string; fullName: string; facebookId: string }, guestUUID?: string): Promise<CustomerAuthResponse> {
		const result = await this.findOrCreateFacebookCustomer(profile);
		await this.mergeGuestCart(result.customer, guestUUID);
		return result;
	}

	private async findOrCreateFacebookCustomer(profile: { email: string; fullName: string; facebookId: string, firebaseDeviceToken?: string }): Promise<CustomerAuthResponse> {
		const { email, fullName, facebookId, firebaseDeviceToken } = profile;

		let customer = await this.customerRepository.findOneBy({ facebookId });

		if (!customer) {
			if (email) {
				customer = await this.customerRepository.findOneBy({
					emailAddress: email.toLowerCase().trim(),
				});
				if (customer) {
					customer.facebookId = facebookId;

					this.logger.log(`Attempting to store firebase device token: ${firebaseDeviceToken} for facebookId: ${facebookId}`);

					if (firebaseDeviceToken?.trim()) {
						const token = firebaseDeviceToken.trim();
						customer.firebaseDeviceToken = Array.isArray(customer.firebaseDeviceToken)
							? customer.firebaseDeviceToken
							: [];

						if (!customer.firebaseDeviceToken.includes(token)) {
							customer.firebaseDeviceToken = [
								...customer.firebaseDeviceToken,
								token,
							];
						}
					}
					customer = await this.customerRepository.save(customer);
				}
			}

			if (!customer) {
				if (!email) {
					throw new UnauthorizedException({ error: 'Email address is required for Facebook login.' });
				}
				const newCustomer = new Customer();
				newCustomer.uuid = crypto.randomUUID();
				newCustomer.fullName = (fullName || email.split('@')[0]).trim();
				newCustomer.emailAddress = email.toLowerCase().trim();
				newCustomer.phoneNumber = null;
				newCustomer.password = '';
				newCustomer.facebookId = facebookId;
				newCustomer.role = CustomerRole.Customer;
				newCustomer.isActive = true;
				newCustomer.firebaseDeviceToken = [];

				this.logger.log(`Attempting to store firebase device token in facebook mobile logi: ${firebaseDeviceToken}`);

				if (firebaseDeviceToken?.trim()) {
					newCustomer.firebaseDeviceToken = [firebaseDeviceToken.trim()];
				}
				customer = await this.customerRepository.save(newCustomer);
			}
		}

		if (!customer.isActive || customer.markedForDeletionAt || customer.deletedAt) {
			customer = await this.reactivateOrThrow(customer);
		}

		const jwtPayload = {
			jti: crypto.randomUUID(),
			type: 'customer',
			sub: customer.uuid,
		};

		const token = await this.jwtService.signAsync(jwtPayload);

		await this.cacheManager.set(
			`auth:customer-session:${jwtPayload.jti}`,
			token,
			(this.configService.get<number>('JWT_EXPIRES_IN') ?? 86400) * 1000,
		);

		return { token, customer };
	}

	private async findOrCreateGoogleCustomer(profile: { email: string; fullName: string; googleId: string, firebaseDeviceToken?: string }): Promise<CustomerAuthResponse> {
		const { email, fullName, googleId, firebaseDeviceToken } = profile;

		let customer = await this.customerRepository.findOneBy({ googleId });

		if (!customer) {
			customer = await this.customerRepository.findOneBy({
				emailAddress: email.toLowerCase().trim(),
			});

			if (customer) {
				customer.googleId = googleId;

				this.logger.log(`Attempting to store firebase device token: ${firebaseDeviceToken} for googleId: ${googleId}`);

				if (firebaseDeviceToken?.trim()) {
					const token = firebaseDeviceToken.trim();
					customer.firebaseDeviceToken = Array.isArray(customer.firebaseDeviceToken)
						? customer.firebaseDeviceToken
						: [];

					if (!customer.firebaseDeviceToken.includes(token)) {
						customer.firebaseDeviceToken = [
							...customer.firebaseDeviceToken,
							token,
						];
					}
				}
				customer = await this.customerRepository.save(customer);
			} else {
				const newCustomer = new Customer();
				newCustomer.uuid = crypto.randomUUID();
				newCustomer.fullName = (fullName || email.split('@')[0]).trim();
				newCustomer.emailAddress = email.toLowerCase().trim();
				newCustomer.phoneNumber = null;
				newCustomer.password = '';
				newCustomer.googleId = googleId;
				newCustomer.role = CustomerRole.Customer;
				newCustomer.isActive = true;
				newCustomer.firebaseDeviceToken = [];

				this.logger.log(`Attempting to store firebase device token in google mobile logi: ${firebaseDeviceToken}`);

				if (firebaseDeviceToken?.trim()) {
					newCustomer.firebaseDeviceToken = [firebaseDeviceToken.trim()];
				}
				customer = await this.customerRepository.save(newCustomer);
			}
		}

		if (!customer.isActive || customer.markedForDeletionAt || customer.deletedAt) {
			customer = await this.reactivateOrThrow(customer);
		}

		const jwtPayload = {
			jti: crypto.randomUUID(),
			type: 'customer',
			sub: customer.uuid,
		};

		const token = await this.jwtService.signAsync(jwtPayload);

		await this.cacheManager.set(
			`auth:customer-session:${jwtPayload.jti}`,
			token,
			(this.configService.get<number>('JWT_EXPIRES_IN') ?? 86400) * 1000,
		);

		return { token, customer };
	}

	async loginWithAppleMobile(dto: AppleMobileAuthDto): Promise<CustomerAuthResponse> {
		const { identityToken, authorizationCode, fullName, firebaseDeviceToken } = dto;

		if (!identityToken && !authorizationCode) {
			throw new BadRequestException({ error: 'Identity token or authorization code is required.' });
		}

		const audience = this.configService.get<string>('APPLE_AUDIENCE');
		const issuer = this.configService.get<string>('APPLE_ISSUER') || 'https://appleid.apple.com';

		if (!audience) {
			throw new UnauthorizedException({ error: 'Apple authentication not configured.' });
		}

		let tokenToVerify = identityToken;

		if (!tokenToVerify && authorizationCode) {
			tokenToVerify = await this.exchangeAppleCode(authorizationCode, audience, issuer);
		}

		if (!tokenToVerify) {
			throw new UnauthorizedException({ error: 'Identity token not available.' });
		}

		let payload: Awaited<ReturnType<typeof jwtVerify>>['payload'];
		try {
			const appleJwks = createRemoteJWKSet(new URL('https://appleid.apple.com/auth/keys'));
			({ payload } = await jwtVerify(tokenToVerify, appleJwks, { issuer, audience }));
		} catch (err) {
			this.logger.error(`Apple JWT verification failed: ${err instanceof Error ? err.message : String(err)}`);
			throw new UnauthorizedException({ error: 'Invalid or expired Apple identity token.' });
		}

		const appleId = payload.sub;
		if (!appleId) {
			throw new UnauthorizedException({ error: 'Apple ID not found in token.' });
		}

		const email = (payload['email'] as string) || '';
		const name = (payload['name'] as string) || fullName || '';

		const result = await this.findOrCreateAppleCustomer({ email, fullName: name, appleId, firebaseDeviceToken });
		await this.mergeGuestCart(result.customer, dto.guestUUID);
		return result;
	}

	private async exchangeAppleCode(code: string, audience: string, issuer: string): Promise<string> {
		const teamId = this.configService.get<string>('APPLE_TEAM_ID');
		const keyId = this.configService.get<string>('APPLE_KEY_ID');
		const privateKey = this.configService.get<string>('APPLE_PRIVATE_KEY');

		if (!teamId || !keyId || !privateKey) {
			throw new UnauthorizedException({ error: 'Apple code exchange not configured.' });
		}

		const rawKey = privateKey.replace(/\\n/g, '\n').trim();
		const normalizedKey = rawKey.includes('BEGIN PRIVATE KEY')
			? rawKey
			: `-----BEGIN PRIVATE KEY-----\n${rawKey}\n-----END PRIVATE KEY-----`;

		const clientSecret = await new SignJWT({})
			.setProtectedHeader({ alg: 'ES256', kid: keyId })
			.setIssuedAt()
			.setExpirationTime('5m')
			.setIssuer(teamId)
			.setAudience(issuer)
			.setSubject(audience)
			.sign(await importPKCS8(normalizedKey, 'ES256'));

		const response = await fetch('https://appleid.apple.com/auth/token', {
			method: 'POST',
			headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
			body: new URLSearchParams({
				grant_type: 'authorization_code',
				code,
				client_id: audience,
				client_secret: clientSecret,
			}),
		});

		const data = await response.json() as { id_token?: string; error?: string };
		if (!data.id_token) {
			throw new UnauthorizedException({ error: 'Apple token exchange failed.' });
		}

		return data.id_token;
	}

	private async findOrCreateAppleCustomer(profile: { email: string; fullName: string; appleId: string, firebaseDeviceToken?: string }): Promise<CustomerAuthResponse> {
		const { email, fullName, appleId, firebaseDeviceToken } = profile;

		let customer = await this.customerRepository.findOneBy({ appleId });

		if (!customer) {
			if (email) {
				customer = await this.customerRepository.findOneBy({
					emailAddress: email.toLowerCase().trim(),
				});
				if (customer) {
					customer.appleId = appleId;
					this.logger.log(`Attempting to store firebase device token: ${firebaseDeviceToken} for appleId: ${appleId}`);
					if (firebaseDeviceToken?.trim()) {
						const token = firebaseDeviceToken.trim();
						customer.firebaseDeviceToken = Array.isArray(customer.firebaseDeviceToken)
							? customer.firebaseDeviceToken
							: [];

						if (!customer.firebaseDeviceToken.includes(token)) {
							customer.firebaseDeviceToken = [
								...customer.firebaseDeviceToken,
								token,
							];
						}
					}
					customer = await this.customerRepository.save(customer);
				}
			}

			if (!customer) {
				if (!email) {
					throw new UnauthorizedException({ error: 'Email address is required for first-time Apple login.' });
				}
				const newCustomer = new Customer();
				newCustomer.uuid = crypto.randomUUID();
				newCustomer.fullName = (fullName || email.split('@')[0]).trim();
				newCustomer.emailAddress = email.toLowerCase().trim();
				newCustomer.phoneNumber = null;
				newCustomer.password = '';
				newCustomer.appleId = appleId;
				newCustomer.role = CustomerRole.Customer;
				newCustomer.isActive = true;
				newCustomer.firebaseDeviceToken = [];

				this.logger.log(`Attempting to store firebase device token in apple mobile login: ${firebaseDeviceToken}`);

				if (firebaseDeviceToken?.trim()) {
					newCustomer.firebaseDeviceToken = [firebaseDeviceToken.trim()];
				}
				customer = await this.customerRepository.save(newCustomer);
			}
		}

		if (!customer.isActive || customer.deletedAt || customer.markedForDeletionAt) {
			this.logger.log(`Apple customer needs reactivation check: ${customer.uuid}`);
			customer = await this.reactivateOrThrow(customer);
		}

		const jwtPayload = {
			jti: crypto.randomUUID(),
			type: 'customer',
			sub: customer.uuid,
		};

		const token = await this.jwtService.signAsync(jwtPayload);

		await this.cacheManager.set(
			`auth:customer-session:${jwtPayload.jti}`,
			token,
			(this.configService.get<number>('JWT_EXPIRES_IN') ?? 86400) * 1000,
		);

		return { token, customer };
	}

	private async mergeGuestCart(customer: Customer, guestUUID?: string): Promise<void> {
		if (!guestUUID) return;

		const guestCustomer = await this.customerRepository.findOne({
			where: { uuid: guestUUID.trim() },
		});

		if (!guestCustomer || guestCustomer.id === customer.id || !guestCustomer.isActive) return;

		const guestCartItems = await this.cartItemRepository.find({
			where: { customer: { id: guestCustomer.id } },
			relations: { product: true, variant: true },
		});

		if (guestCartItems.length > 0) {
			const existingCartItems = await this.cartItemRepository.find({
				where: { customer: { id: customer.id } },
				relations: {
					product: true,
					variant: { inventoryItem: { levels: true } },
				},
			});

			const existingMap = new Map<string, CartItem>();
			for (const item of existingCartItems) {
				existingMap.set(`${item.product.id}-${item.variant.id}`, item);
			}

			const itemsToSave: CartItem[] = [];
			const guestItemsToRemove: CartItem[] = [];

			for (const guestItem of guestCartItems) {
				const existingItem = existingMap.get(`${guestItem.product.id}-${guestItem.variant.id}`);
				if (existingItem) {
					const availableStock = calculateStock(existingItem.variant);
					const totalQuantity = existingItem.quantity + guestItem.quantity;
					existingItem.quantity = availableStock < totalQuantity ? availableStock : totalQuantity;
					existingItem.subTotal = {
						...existingItem.subTotal,
						amount: existingItem.quantity * existingItem.variant.cost.amount,
					};
					itemsToSave.push(existingItem);
					guestItemsToRemove.push(guestItem);
				} else {
					guestItem.customer = customer;
					itemsToSave.push(guestItem);
				}
			}

			if (itemsToSave.length > 0) await this.cartItemRepository.save(itemsToSave);
			if (guestItemsToRemove.length > 0) await this.cartItemRepository.remove(guestItemsToRemove);
		}

		const cartItemsCount = await this.cartItemRepository.count({
			where: { customer: { id: customer.id }, product: { status: ProductStatus.ACTIVE } },
		});
		customer.cartItemsCount = cartItemsCount;
		await this.customerRepository.save(customer);

		guestCustomer.isActive = false;
		await this.customerRepository.save(guestCustomer);
	}

	/**
	 * Reactivates a customer if they are within the grace period (markedForDeletionAt set, deletedAt null).
	 * Throws UnauthorizedException if the account is permanently deleted or deactivated outside a grace period.
	 */
	private async reactivateOrThrow(customer: Customer): Promise<Customer> {
		if (customer.deletedAt) {
			throw new UnauthorizedException({ error: 'Account has been permanently deleted. Please contact support to restore your account.' });
		}
		if (!customer.isActive && !customer.markedForDeletionAt) {
			throw new UnauthorizedException({ error: 'Account is deactivated.' });
		}
		customer.isActive = true;
		customer.markedForDeletionAt = null;
		return this.customerRepository.save(customer);
	}

	/***
	 * Updates the current customer
	 *
	 * @param principal
	 * @param body
	 * @returns
	 */
	async updateProfile(principal: Customer, body: UpdateCustomerDto): Promise<Customer> {
		this.logger.log(`Updating customer: ${principal.uuid}`);

		// Check if the phone number is valid
		if (!isPhoneNumberValid(body.phoneNumber, body.countryCode)) {
			throw new BadRequestException({
				phoneNumber: "Please enter a valid phone number.",
			});
		}

		// Remove the prefix + sign from the country code
		let countryCode = body.countryCode;
		if (countryCode !== null && countryCode !== undefined && countryCode.startsWith('+')) {
			countryCode = countryCode.substring(1);
		}

		// Trim the phone number
		if (body.phoneNumber !== null && body.phoneNumber !== undefined) {
			body.phoneNumber = body.phoneNumber.trim();
		}

		// Format the phone number if a country code is provided
		if (body.phoneNumber !== null && countryCode !== null) {
			body.phoneNumber = parsePhoneNumberFromString(body.phoneNumber, { defaultCallingCode: countryCode, extract: false })?.formatInternational() ?? body.phoneNumber;
		}

		// Make sure we don't have a customer using the same email address
		const customerByEmailAddress = await this.customerRepository.findOneBy({
			emailAddress: body.emailAddress.trim().toLowerCase(),
		});

		if (customerByEmailAddress !== null && customerByEmailAddress.uuid !== principal.uuid) {
			throw new BadRequestException({
				errors: {
					emailAddress: "Email address already exists. Please use a different email address.",
				},
			});
		}

		// Make sure we don't have a customer using the same phone number
		const customerByPhoneNumber = await this.customerRepository.findOneBy({
			phoneNumber: body.phoneNumber.trim(),
		});

		if (customerByPhoneNumber !== null && customerByPhoneNumber.uuid !== principal.uuid) {
			throw new BadRequestException({
				errors: {
					phoneNumber: "Phone number already exists. Please use a different phone number.",
				},
			});
		}

		// Find the customer
		const customer = await this.customerRepository.findOneBy({ id: principal.id, });
		if (customer === null) {
			throw new BadRequestException({
				error: "Failed to find the customer.",
			});
		}

		customer.fullName = body.fullName.trim();
		customer.emailAddress = body.emailAddress.toLowerCase().toLowerCase();
		customer.phoneNumber = body.phoneNumber;
		return this.customerRepository.save(customer);
	}
}

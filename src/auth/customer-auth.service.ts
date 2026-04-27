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

import { parsePhoneNumberFromString } from "libphonenumber-js";

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

		// Remove the prefix + sign from the country code
		let countryCode = body.countryCode;
		if (countryCode !== null && countryCode !== undefined && countryCode.startsWith('+')) {
			countryCode = countryCode.substring(1);
		}

		// Trim the phone number
		if (body.phoneNumber !== null) {
			body.phoneNumber = body.phoneNumber.trim();
		}

		// Format the phone number if a country code is provided
		if (body.phoneNumber !== null && countryCode !== null) {
			body.phoneNumber = parsePhoneNumberFromString(body.phoneNumber, { defaultCallingCode: countryCode, extract: false, })?.formatInternational() as string;
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
		await this.customerRepository.save(customer);

		// merge the customer guest cart
		if (body.guestUUID) {
			const guestCustomer = await this.customerRepository.findOneBy({
				uuid: body.guestUUID.trim(),
			});

			if (guestCustomer) {
				const cartItems = await this.cartItemRepository.find({
					where: {
						customer: { id: guestCustomer.id }
					}
				});

				for (const item of cartItems) {
					item.customer = customer;
				}

				await this.cartItemRepository.save(cartItems);

				// deactivate the guest user after merge
				guestCustomer.isActive = false;
				await this.customerRepository.save(guestCustomer);
			}
		}

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

		// Remove the prefix + sign from the country code
		let countryCode = body.countryCode;
		if (countryCode !== null && countryCode !== undefined && countryCode.startsWith('+')) {
			countryCode = countryCode.substring(1);
		}

		// Trim the phone number
		if (body.phoneNumber !== null) {
			body.phoneNumber = body.phoneNumber.trim();
		}

		// Format the phone number if a country code is provided
		if (body.phoneNumber !== null && countryCode !== null) {
			body.phoneNumber = parsePhoneNumberFromString(body.phoneNumber, { defaultCallingCode: countryCode, extract: false, })?.formatInternational() as string;
		}

		// Find the customer using their phone number
		const customer = await this.customerRepository.findOneBy({
			phoneNumber: body.phoneNumber.trim(),
		});

		if (customer === null) {
			throw new BadRequestException({
				errors: {
					phoneNumber: "Customer not found with the provided phone number.",
				},
			});
		}

		if (!customer.isActive) {
			throw new UnauthorizedException({
				error: "Account is deactivated.",
			});
		}

		// merge the customer gurst cart
		if (body.guestUUID) {
			const guestCustomer = await this.customerRepository.findOne({
				where: { uuid: body.guestUUID.trim() },
			});

			if (
				guestCustomer &&
				guestCustomer.id !== customer.id &&
				guestCustomer.isActive
			) {
				const guestCartItems = await this.cartItemRepository.find({
					where: { customer: { id: guestCustomer.id } },
					relations: {
						product: true,
						variant: true
					},
				});

				if (guestCartItems.length > 0) {
					const existingCartItems = await this.cartItemRepository.find({
						where: { customer: { id: customer.id } },
						relations: {
							product: true,
							variant: {
								inventoryItem: {
									levels: true,
								},
							},
						},
					});

					// Build lookup map
					const existingMap = new Map<string, CartItem>();
					for (const item of existingCartItems) {
						const key = `${item.product.id}-${item.variant.id}`;
						existingMap.set(key, item);
					}

					const itemsToSave: CartItem[] = [];
					const guestItemsToRemove: CartItem[] = [];

					for (const guestItem of guestCartItems) {
						const key = `${guestItem.product.id}-${guestItem.variant.id}`;
						const existingItem = existingMap.get(key);

						if (existingItem) {
							const availableStock = calculateStock(existingItem.variant);
							const totalQuantity = existingItem.quantity + guestItem.quantity;

							// Merge quantity
							existingItem.quantity = (availableStock < totalQuantity) ? availableStock : totalQuantity;

							existingItem.subTotal = {
								...existingItem.subTotal,
								amount:
									existingItem.quantity *
									existingItem.variant.cost.amount,
							};

							itemsToSave.push(existingItem);
							guestItemsToRemove.push(guestItem);
						} else {
							// Reassign guest item
							guestItem.customer = customer;
							itemsToSave.push(guestItem);
						}
					}

					// Save items
					if (itemsToSave.length > 0) {
						await this.cartItemRepository.save(itemsToSave);
					}

					// remove merged guest items
					if (guestItemsToRemove.length > 0) {
						await this.cartItemRepository.remove(guestItemsToRemove);
					}
				}

				// Deactivate guest to prevent re-merge
				guestCustomer.isActive = false;
				await this.customerRepository.save(guestCustomer);
			}
		}

		// In local/dev env use the magic code; otherwise generate a real OTP
		const secret = this.devMagicCode ?? crypto.randomInt(100000, 1000000).toString();

		// Create a login request
		const request = new LoginRequest();
		request.uuid = crypto.randomUUID();
		request.customer = customer;
		request.secret = await bcrypt.hash(secret, 10);
		await this.loginRequestRepository.save(request);

		// Send OTP via Twilio Messaging Service
		await this.twilioService.sendOtp(customer.phoneNumber, secret);

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
			throw new UnauthorizedException({
				error: "Account is deactivated.",
			});
		}

		// merge the customer gurst cart
		if (body.guestUUID) {
			const guestCustomer = await this.customerRepository.findOne({
				where: { uuid: body.guestUUID.trim() },
			});

			if (
				guestCustomer &&
				guestCustomer.id !== customer.id &&
				guestCustomer.isActive
			) {
				const guestCartItems = await this.cartItemRepository.find({
					where: { customer: { id: guestCustomer.id } },
					relations: {
						product: true,
						variant: true
					},
				});

				if (guestCartItems.length > 0) {
					const existingCartItems = await this.cartItemRepository.find({
						where: { customer: { id: customer.id } },
						relations: {
							product: true,
							variant: {
								inventoryItem: {
									levels: true,
								},
							},
						},
					});

					// Build lookup map
					const existingMap = new Map<string, CartItem>();
					for (const item of existingCartItems) {
						const key = `${item.product.id}-${item.variant.id}`;
						existingMap.set(key, item);
					}

					const itemsToSave: CartItem[] = [];
					const guestItemsToRemove: CartItem[] = [];

					for (const guestItem of guestCartItems) {
						const key = `${guestItem.product.id}-${guestItem.variant.id}`;
						const existingItem = existingMap.get(key);

						if (existingItem) {
							const availableStock = calculateStock(existingItem.variant);
							const totalQuantity = existingItem.quantity + guestItem.quantity;

							// Merge quantity
							existingItem.quantity = (availableStock < totalQuantity) ? availableStock : totalQuantity;

							existingItem.subTotal = {
								...existingItem.subTotal,
								amount:
									existingItem.quantity *
									existingItem.variant.cost.amount,
							};

							itemsToSave.push(existingItem);
							guestItemsToRemove.push(guestItem);
						} else {
							// Reassign guest item
							guestItem.customer = customer;
							itemsToSave.push(guestItem);
						}
					}

					// Save items
					if (itemsToSave.length > 0) {
						await this.cartItemRepository.save(itemsToSave);
					}

					// remove merged guest items
					if (guestItemsToRemove.length > 0) {
						await this.cartItemRepository.remove(guestItemsToRemove);
					}
				}

				// Deactivate guest to prevent re-merge
				guestCustomer.isActive = false;
				await this.customerRepository.save(guestCustomer);
			}
		}

		// In local env use the magic code so no real email is needed; otherwise generate a real OTP
		const secret = this.isLocal
			? (this.devMagicCode ?? crypto.randomInt(100000, 1000000).toString())
			: crypto.randomInt(100000, 1000000).toString();

		console.log("customer login secret", secret)
		// Create a login request
		const request = new LoginRequest();
		request.uuid = crypto.randomUUID();
		request.customer = customer;
		request.secret = await bcrypt.hash(secret, 10);
		await this.loginRequestRepository.save(request);

		// Send OTP to the customer via email
		await this.emailService.sendOtpEmail(customer.emailAddress, {
			otp: secret,
		});

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

	/***
	 * Updates the current customer
	 *
	 * @param principal
	 * @param body
	 * @returns
	 */
	async updateProfile(principal: Customer, body: UpdateCustomerDto): Promise<Customer> {
		this.logger.log(`Updating customer: ${principal.uuid}`);

		// Remove the prefix + sign from the country code
		let countryCode = body.countryCode;
		if (countryCode !== null && countryCode !== undefined && countryCode.startsWith('+')) {
			countryCode = countryCode.substring(1);
		}

		// Trim the phone number
		if (body.phoneNumber !== null) {
			body.phoneNumber = body.phoneNumber.trim();
		}

		// Format the phone number if a country code is provided
		if (body.phoneNumber !== null && countryCode !== null) {
			body.phoneNumber = parsePhoneNumberFromString(body.phoneNumber, { defaultCallingCode: countryCode, extract: false, })?.formatInternational() as string;
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

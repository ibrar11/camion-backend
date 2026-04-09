import * as crypto from "node:crypto";

import {
	BadRequestException,
	Injectable,
	Logger,
} from "@nestjs/common";

import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";

import { JwtService } from "@nestjs/jwt";

import { RegisterGuestDto } from "./dtos/RegisterGuestDto";

import { CustomerAuthResponse } from "./response/CustomerAuthResponse";

import { CustomerRole } from "src/customers/enums/CustomerRole";

import { Customer } from "src/customers/entities/customer.entity";

@Injectable()
export class GuestAuthService {
	private readonly logger = new Logger(GuestAuthService.name);

	constructor(
		@InjectRepository(Customer) private readonly customerRepository: Repository<Customer>,
		private readonly jwtService: JwtService,
	) { }

	/**
	 * Register a new user
	 *
	 * @param body
	 * @returns
	 */
	async registerGuest(body: RegisterGuestDto): Promise<CustomerAuthResponse> {
		this.logger.log(`Attempting to register guest: ${body}`);

		// Make sure we don't have a customer using the same device id
		const customerByDeviceId = await this.customerRepository.findOneBy({
			deviceId: body.deviceId.trim(),
		});

		if (customerByDeviceId !== null) {
			throw new BadRequestException({
				errors: {
					deviceId: "A device using the provided device id has already been registered.",
				},
			});
		}

		// Create the customer
		const customer = new Customer();
		customer.uuid = crypto.randomUUID();
		customer.fullName = "Camion Guest";
		customer.emailAddress = `guest-${crypto.randomInt(1, 1000000)}@camion-app.com`;
		customer.phoneNumber = `gst-${crypto.randomInt(1, 1000000)}`;
		customer.password = "";
		customer.role = CustomerRole.Guest;
		customer.deviceId = body.deviceId.trim()
		customer.isActive = true;
		await this.customerRepository.save(customer);

		// Create the payload
		const payload = {
			jti: crypto.randomUUID(),
			type: "guest",
			sub: customer.uuid,
		};

		// Create the jwt for the guest
		const token = await this.jwtService.signAsync(payload);

		return {
			token: token,
			customer: customer,
		};
	}
}

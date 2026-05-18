import type { Request } from "express";

import {
	CanActivate,
	ExecutionContext,
	Injectable,
	UnauthorizedException,
	Logger,
	Inject,
} from "@nestjs/common";

import { JwtService } from "@nestjs/jwt";

import { Cache, CACHE_MANAGER } from '@nestjs/cache-manager';

import { ClientStatus } from "../clients/enums/client-status";

import { UsersService } from "../users/users.service";
import { CustomersService } from "../customers/customers.service";
import { ClientsService } from "../clients/clients.service";

@Injectable()
export class AuthGuard implements CanActivate {
	private readonly logger = new Logger(AuthGuard.name);

	constructor(
		@Inject(CACHE_MANAGER) private readonly cacheManager: Cache,
		private readonly jwtService: JwtService,
		private readonly usersService: UsersService,
		private readonly customersService: CustomersService,
		private readonly clientsService: ClientsService,
	) { }

	async canActivate(context: ExecutionContext): Promise<boolean> {
		const request = context.switchToHttp().getRequest();

		// Make sure we have a valid token
		const token = this.getToken(request);
		if (token === null) {
			throw new UnauthorizedException();
		}

		try {
			const payload: { jti: string, type: "user" | "customer" | "guest" | "client", sub: string; } = await this.jwtService.verifyAsync(token);
			if (!payload.sub) {
				throw new UnauthorizedException();
			}

			if (payload.type === "client") {
				// Fetch the client for the request
				const client = await this.clientsService.findOneCached(payload.sub);
				if (client === null || client.status !== ClientStatus.ACTIVE) {
					throw new UnauthorizedException();
				}

				request["jti"] = payload.jti;
				request["client"] = client;
				return true;
			}

			if (payload.type === "user") {
				// Make sure the token exists in the cache
				const tokenExists = await this.cacheManager.get(`auth:user-session:${payload.jti}`);
				if (tokenExists === null || tokenExists === undefined) {
					throw new UnauthorizedException();
				}

				// Fetch the user for the request
				const user = await this.usersService.findOneCached(payload.sub);
				if (user === null || !user.isActive) {
					throw new UnauthorizedException();
				}

				request["jti"] = payload.jti;
				request["user"] = user;
				return true;
			}

			// Fetch the customer/guest for the request
			if (payload.type === "customer") {
				// Make sure the token exists in the cache
				const tokenExists = await this.cacheManager.get(`auth:customer-session:${payload.jti}`);
				if (tokenExists === null || tokenExists === undefined) {
					throw new UnauthorizedException();
				}

				// Find the customer for the request
				const customer = await this.customersService.findOne(payload.sub);
				if (customer === null || !customer.isActive || customer.deletedAt) {
					throw new UnauthorizedException();
				}

				request["jti"] = payload.jti;
				request["customer"] = customer;
				return true;
			}

			// We don't store the guest auth token in cache since guest are already logged out
			// So, if the payload type is guest, we just allow them to continue
			if (payload.type === "guest") {
				const customer = await this.customersService.findOneCached(payload.sub);
				if (customer === null || !customer.isActive) {
					throw new UnauthorizedException();
				}

				request["jti"] = payload.jti;
				request["customer"] = customer;
				return true;
			}
		} catch (err) {
			this.logger.error(err);
		}

		throw new UnauthorizedException();
	}

	/**
	 * Returns the token from the authorization header
	 *
	 * @param request
	 * @returns
	 */
	private getToken(request: Request): string | null {
		const [type, token] = request.headers.authorization?.split(' ') ?? [];
		return type === 'Bearer' ? token : null;
	}
}

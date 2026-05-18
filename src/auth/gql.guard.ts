import type { Request } from "express";

import { GqlExecutionContext } from "@nestjs/graphql";

import {
	CanActivate,
	ExecutionContext,
	Inject,
	Injectable,
	Logger,
	UnauthorizedException,
} from "@nestjs/common";

import { JwtService } from "@nestjs/jwt";

import { Cache, CACHE_MANAGER } from '@nestjs/cache-manager';

import { CustomersService } from "../customers/customers.service";

@Injectable()
export class GqlAuthGuard implements CanActivate {
	private readonly logger = new Logger(GqlAuthGuard.name);

	constructor(
		@Inject(CACHE_MANAGER) private readonly cacheManager: Cache,
		private readonly jwtService: JwtService,
		private readonly customersService: CustomersService,
	) { }

	async canActivate(context: ExecutionContext): Promise<boolean> {
		const request: Request = GqlExecutionContext.create(context).getContext().req;

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

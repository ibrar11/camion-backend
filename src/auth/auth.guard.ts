import { Request } from "express";

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

import { UsersService } from "../users/users.service";
import { CustomersService } from "src/customers/customers.service";

@Injectable()
export class AuthGuard implements CanActivate {
	private readonly logger = new Logger(AuthGuard.name);

	constructor(
		@Inject(CACHE_MANAGER) private readonly cacheManager: Cache,
		private readonly jwtService: JwtService,
		private readonly usersService: UsersService,
		private readonly customersService: CustomersService,
	) { }

	async canActivate(context: ExecutionContext): Promise<boolean> {
		const request = context.switchToHttp().getRequest();

		// Make sure we have a valid token
		const token = this.getToken(request);
		if (token === null) {
			throw new UnauthorizedException();
		}

		try {
			const payload: { jti: string, type: "user" | "customer", sub: string; } = await this.jwtService.verifyAsync(token);
			if (!payload.sub) {
				throw new UnauthorizedException();
			}

			// Make sure the token exists in the cache
			const tokenExists = await this.cacheManager.get(
				payload.type === "user"
					? `auth:user-session:${payload.jti}`
					: payload.type === "customer"
						? `auth:customer-session:${payload.jti}`
						: ""
			);

			if (tokenExists === null || tokenExists === undefined) {
				throw new UnauthorizedException();
			}

			// Fetch the user for the request
			if (payload.type === "user") {
				const user = await this.usersService.findOne(payload.sub);
				if (user === null || !user.isActive) {
					throw new UnauthorizedException();
				}

				request["jti"] = payload.jti;
				request["user"] = user;
				return true;
			}

			// Fetch the customer for the request
			if (payload.type === "customer") {
				const customer = await this.customersService.findOne(payload.sub);
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

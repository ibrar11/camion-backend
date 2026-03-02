import { Request } from "express";

import {
	CanActivate,
	ExecutionContext,
	Injectable,
	UnauthorizedException,
	Logger,
} from "@nestjs/common";

import { JwtService } from "@nestjs/jwt";

import { UsersService } from "../users/users.service";

@Injectable()
export class AuthGuard implements CanActivate {
	private readonly logger = new Logger(AuthGuard.name);

	constructor(
		private readonly jwtService: JwtService,
		private readonly userService: UsersService,
	) { }

	async canActivate(context: ExecutionContext): Promise<boolean> {
		const request = context.switchToHttp().getRequest();

		// Make sure we have a valid token
		const token = this.getToken(request);
		if (!token) {
			throw new UnauthorizedException();
		}

		try {
			const payload: { type: "user" | "customer", sub: string; } = await this.jwtService.verifyAsync(token);
			if (!payload.sub) {
				throw new UnauthorizedException();
			}

			// Fetch the user for the request
			if (payload.type === "user") {
				request["user"] = await this.userService.findOne(payload.sub);
				return true;
			}

			// Fetch the customer for the request
			if (payload.type === "customer") {
				return true;
			}
		} catch (err) {
			this.logger.error(err);
		}

		throw new UnauthorizedException();
	}

	private getToken(request: Request): string | undefined {
		const [type, token] = request.headers.authorization?.split(' ') ?? [];
		return type === 'Bearer' ? token : undefined;
	}
}

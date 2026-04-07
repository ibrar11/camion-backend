import {
	CanActivate,
	ExecutionContext,
	Injectable,
} from "@nestjs/common";

import { Reflector } from "@nestjs/core";

import { Request } from "express";

import { ROLES_KEY } from "./roles.decorator";

import { User } from "../users/entities/user.entity";

import { Client } from "src/clients/entities/client.entity";

@Injectable()
export class RolesGuard implements CanActivate {
	constructor(private reflector: Reflector) { }

	canActivate(context: ExecutionContext): boolean {
		const requiredRoles = this.reflector.getAllAndOverride<string[]>(ROLES_KEY, [
			context.getHandler(),
			context.getClass(),
		]);

		if (requiredRoles === null || requiredRoles.length === 0) {
			return true;
		}

		const request: Request & {
			user?: User;
			client?: Client;
		} = context.switchToHttp().getRequest();

		if (request === null) {
			return false;
		}

		if (request.user) {
			return requiredRoles.includes(request.user.role);
		}

		// clients do not have roles → deny if roles are required
		if (request.client) {
			return false;
		}

		return false;
	}
}

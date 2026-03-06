import {
	CanActivate,
	ExecutionContext,
	Injectable,
} from "@nestjs/common";

import { Reflector } from "@nestjs/core";

import { Request } from "express";

import { ROLES_KEY } from "./roles.decorator";

import { User } from "../users/entities/user.entity";

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

		const request: Request & { user: User, } = context.switchToHttp().getRequest();
		if (request === null) {
			return false;
		}

		return requiredRoles.includes(request.user.role);
	}
}

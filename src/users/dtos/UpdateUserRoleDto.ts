import {
	IsEnum,
	IsString,
} from "class-validator";

import { UserRole } from "../enums/UserRole";

export class UpdateUserRoleDto {
	@IsString()
	@IsEnum(UserRole)
	role: UserRole;
}

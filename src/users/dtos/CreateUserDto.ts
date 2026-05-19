import {
	IsBoolean,
	IsEmail,
	IsEnum,
	IsNotEmpty,
	IsString,
	MinLength,
} from "class-validator";

import { UserRole } from "../enums/UserRole";

export class CreateUserDto {
	@IsNotEmpty()
	@MinLength(1)
	fullName: string;

	@IsEmail()
	@MinLength(1)
	emailAddress: string;

	@IsString()
	@MinLength(8, {
		message: "Password must be at least 8 characters long"
	})
	password: string;

	@IsString()
	@IsEnum(UserRole)
	role: UserRole;

	@IsBoolean()
	isActive: boolean = false;
}

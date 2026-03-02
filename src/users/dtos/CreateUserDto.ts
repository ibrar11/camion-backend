import {
	IsEmail,
	IsNotEmpty,
	IsString,
	MinLength,
} from "class-validator";

export class CreateUserDto {
	@IsNotEmpty()
	fullName: string;

	@IsEmail()
	emailAddress: string;

	@IsString()
	@MinLength(8, {
		message: "Password must be at least 8 characters long"
	})
	password: string;

	@IsNotEmpty()
	role:
		| "super-admin"
		| "admin"
		| "manager"
		| "user"
		;
}

import {
	IsEmail,
	IsNotEmpty,
	IsString,
	MaxLength,
	MinLength,
} from "class-validator";

export class RegisterUserDto {
	@IsNotEmpty()
	fullName: string;

	@IsEmail()
	emailAddress: string;

	@IsString()
	@MinLength(8, {
		message: "Password must be at least 8 characters long"
	})
	@MaxLength(64, {
		message: "Password must be maximum 64 characters long"
	})
	password: string;
}

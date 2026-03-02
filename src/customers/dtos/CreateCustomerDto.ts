import {
	IsEmail,
	IsString,
	MaxLength,
	MinLength,
} from "class-validator";

export class CreateCustomerDto {
	@IsString()
	fullName: string;

	@IsEmail()
	emailAddress: string;

	@IsString()
	countryCode: string;

	@IsString()
	phoneNumber: string;

	@IsString()
	@MinLength(8, {
		message: "Password must be at least 8 characters long"
	})
	@MaxLength(64, {
		message: "Password must be maximum 64 characters long"
	})
	password: string;
}

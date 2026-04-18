import {
	IsEmail,
	IsNotEmpty,
	IsString,
	MinLength,
} from "class-validator";

export class RegisterCustomerDto {
	@IsNotEmpty()
	@MinLength(1)
	fullName: string;

	@IsEmail()
	@MinLength(1)
	emailAddress: string;

	@IsString()
	@MinLength(1)
	countryCode: string;

	@IsString()
	@MinLength(1)
	phoneNumber: string;
}

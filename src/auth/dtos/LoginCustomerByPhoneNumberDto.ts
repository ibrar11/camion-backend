import {
	IsNotEmpty,
	IsString,
	MaxLength,
	MinLength
} from "class-validator";

export class LoginCustomerByPhoneNumberDto {
	@IsString()
	countryCode: string;

	@IsString()
	phoneNumber: string;

	@IsNotEmpty()
	@MinLength(8)
	@MaxLength(64)
	password: string;
}

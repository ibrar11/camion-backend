import {
	IsEmail,
	IsNotEmpty,
	MaxLength,
	MinLength,
} from "class-validator";

export class LoginCustomerByEmailAddressDto {
	@IsEmail()
	emailAddress: string;

	@IsNotEmpty()
	@MinLength(8)
	@MaxLength(64)
	password: string;
}

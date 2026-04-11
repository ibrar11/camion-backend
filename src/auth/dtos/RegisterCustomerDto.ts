import {
	IsEmail,
	IsNotEmpty,
	IsString,
} from "class-validator";

export class RegisterCustomerDto {
	@IsNotEmpty()
	fullName: string;

	@IsEmail()
	emailAddress: string;

	@IsString()
	countryCode: string;

	@IsString()
	phoneNumber: string;
}

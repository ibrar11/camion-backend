import {
	IsEmail,
	IsNotEmpty,
	IsString,
} from "class-validator";

export class UpdateCustomerDto {
	@IsNotEmpty()
	fullName: string;

	@IsEmail()
	emailAddress: string;

	@IsString()
	countryCode: string;

	@IsString()
	phoneNumber: string;
}

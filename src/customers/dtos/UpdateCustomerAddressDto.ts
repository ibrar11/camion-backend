import {
	IsString,
	MaxLength,
} from "class-validator";

export class UpdateCustomerAddressDto {
	@IsString()
	fullName: string;

	@IsString()
	countryCode: string;

	@IsString()
	phoneNumber: string;

	@IsString()
	streetAddress: string;

	@IsString()
	apartment: string;

	@IsString()
	@MaxLength(5)
	zipCode: string;

	@IsString()
	city: string;

	@IsString()
	state: string;

	@IsString()
	country: string;
}

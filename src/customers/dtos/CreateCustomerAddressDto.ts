import {
	IsString,
	MaxLength,
	MinLength,
} from "class-validator";

export class CreateCustomerAddressDto {
	@IsString()
	@MinLength(1)
	fullName: string;

	@IsString()
	@MinLength(1)
	countryCode: string;

	@IsString()
	@MinLength(1)
	phoneNumber: string;

	@IsString()
	@MinLength(1)
	streetAddress: string;

	@IsString()
	@MinLength(1)
	apartment: string;

	@IsString()
	@MinLength(4)
	@MaxLength(5)
	zipCode: string;

	@IsString()
	@MinLength(1)
	city: string;

	@IsString()
	@MinLength(1)
	state: string;

	@IsString()
	@MinLength(1)
	country: string;
}

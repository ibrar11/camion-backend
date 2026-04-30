import {
	IsBoolean,
	IsString,
	MaxLength,
	MinLength,
} from "class-validator";

export class UpdateCustomerAddressDto {
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
	@MinLength(1)
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

	@IsBoolean()
	isDefault: boolean = false;
}

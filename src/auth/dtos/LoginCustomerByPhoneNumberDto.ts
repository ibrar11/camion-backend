import {
	IsOptional,
	IsString,
	IsUUID,
	MinLength,
} from "class-validator";

export class LoginCustomerByPhoneNumberDto {
	@IsString()
	@MinLength(1)
	countryCode: string;

	@IsString()
	@MinLength(1)
	phoneNumber: string;

	@IsOptional()
	@IsString()
	@IsUUID('4')
	guestUUID?: string;
}

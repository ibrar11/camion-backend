import {
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

	@IsString()
	@IsUUID(1)
	guestUUID: string;
}

import {
	IsEmail,
	IsOptional,
	IsString,
	IsUUID,
	MinLength,
} from "class-validator";

export class LoginCustomerByEmailAddressDto {
	@IsEmail()
	emailAddress: string;

	@IsOptional()
	@IsString()
	@IsUUID('4')
	guestUUID?: string;

	@IsString()
	@MinLength(1)
	firebaseDeviceToken: string;
}

import {
	IsEmail,
	IsOptional,
	IsString,
	IsUUID,
} from "class-validator";

export class LoginCustomerByEmailAddressDto {
	@IsEmail()
	emailAddress: string;

	@IsOptional()
	@IsString()
	@IsUUID('4')
	guestUUID?: string;

	@IsOptional()
	@IsString()
	firebaseDeviceToken?: string;
}

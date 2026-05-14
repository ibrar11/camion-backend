import {
	IsEmail,
	IsNotEmpty,
	IsOptional,
	IsString,
	IsUUID,
	MinLength,
} from "class-validator";

export class RegisterCustomerDto {
	@IsNotEmpty()
	@MinLength(1)
	fullName: string;

	@IsEmail()
	@MinLength(1)
	emailAddress: string;

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

	@IsString()
	@MinLength(1)
	firebaseDeviceToken: string;
}

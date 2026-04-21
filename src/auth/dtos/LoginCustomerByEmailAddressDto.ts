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
	@IsUUID()
	guestUUID?: string;
}

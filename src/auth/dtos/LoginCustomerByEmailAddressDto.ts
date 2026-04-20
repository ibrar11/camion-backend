import {
	IsEmail,
	IsString,
	IsUUID,
} from "class-validator";

export class LoginCustomerByEmailAddressDto {
	@IsEmail()
	emailAddress: string;

	@IsString()
	@IsUUID(1)
	guestUUID: string;
}

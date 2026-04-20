import {
	IsEmail,
	IsString,
	IsUUID,
} from "class-validator";

export class LoginCustomerByEmailAddressDto {
	@IsEmail()
	emailAddress: string;

	@IsString()
	@IsUUID()
	guestUUID: string;
}

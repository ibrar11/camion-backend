import {
	IsEmail,
} from "class-validator";

export class LoginCustomerByEmailAddressDto {
	@IsEmail()
	emailAddress: string;
}

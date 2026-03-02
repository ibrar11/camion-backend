import {
	IsEmail,
} from "class-validator";

export class RegisterCustomerByEmailAddressDto {
	@IsEmail()
	emailAddress: string;
}

import {
	IsEmail,
} from "class-validator";

export class UpdateCustomerEmailAddressDto {
	@IsEmail()
	emailAddress: string;
}

import {
	IsEmail,
} from "class-validator";

export class UpdateUserEmailAddressDto {
	@IsEmail()
	emailAddress: string;
}

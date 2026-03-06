import {
	IsEmail,
} from "class-validator";

export class UpdateEmailAddressDto {
	@IsEmail()
	emailAddress: string;
}

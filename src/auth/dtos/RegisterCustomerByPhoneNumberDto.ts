import {
	IsString,
} from "class-validator";

export class RegisterCustomerByPhoneNumberDto {
	@IsString()
	countryCode: string;

	@IsString()
	phoneNumber: string;
};

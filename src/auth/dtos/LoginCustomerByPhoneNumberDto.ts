import {
	IsString,
} from "class-validator";

export class LoginCustomerByPhoneNumberDto {
	@IsString()
	countryCode: string;

	@IsString()
	phoneNumber: string;
}

import {
	IsNotEmpty,
} from "class-validator";

export class UpdatePhoneNumberDto {
	@IsNotEmpty()
	phoneNumber: string;
}

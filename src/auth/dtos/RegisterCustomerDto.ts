import {
	IsNotEmpty,
	IsString,
	MinLength,
} from "class-validator";

export class RegisterCustomerDto {
	@IsNotEmpty()
	token: string;

	@IsNotEmpty()
	fullName: string;

	@IsString()
	@MinLength(8, {
		message: "Password must be at least 8 characters long"
	})
	password: string;
}

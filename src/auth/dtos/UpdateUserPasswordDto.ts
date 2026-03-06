import {
	IsString,
	MaxLength,
	MinLength,
} from "class-validator";

export class UpdateUserPasswordDto {
	@IsString()
	passwordOld: string;

	@IsString()
	@MinLength(8, {
		message: "New password must be at least 8 characters long"
	})
	@MaxLength(64, {
		message: "New password must be maximum 64 characters long"
	})
	passwordNew: string;

	@IsString()
	@MinLength(8, {
		message: "Password must be at least 8 characters long"
	})
	@MaxLength(64, {
		message: "Password must be maximum 64 characters long"
	})
	passwordConfirm: string;
}

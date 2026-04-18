import {
	IsString,
	MinLength,
} from "class-validator";

export class RegisterGuestDto {
	@IsString()
	@MinLength(1)
	deviceId: string;

	@IsString()
	@MinLength(1)
	token: string;
}

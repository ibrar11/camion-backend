import {
	IsString,
} from "class-validator";

export class RegisterGuestDto {
	@IsString()
	deviceId: string;

	@IsString()
	token: string;
}

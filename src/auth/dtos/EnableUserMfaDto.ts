import { IsNotEmpty } from "class-validator";

export class EnableUserMfaDto {
	@IsNotEmpty()
	verificationCode: string;

	@IsNotEmpty()
	password: string;
};

import { IsString, Length, MaxLength } from "class-validator";

export class CreateCurrencyDto {
	@IsString()
	@MaxLength(64)
	name: string;

	@IsString()
	@Length(3, 3)
	alphaCode: string;
}

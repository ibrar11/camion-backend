import { IsString, Length, MaxLength, MinLength } from "class-validator";

export class CreateCurrencyDto {
	@IsString()
	@MinLength(1)
	@MaxLength(64)
	name: string;

	@IsString()
	@Length(3, 3)
	alphaCode: string;
}

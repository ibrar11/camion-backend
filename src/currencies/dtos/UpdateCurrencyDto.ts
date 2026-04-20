import { IsOptional, IsString, Length, MaxLength, MinLength } from "class-validator";

export class UpdateCurrencyDto {
	@IsOptional()
	@IsString()
	@MinLength(1)
	@MaxLength(64)
	name?: string;

	@IsOptional()
	@IsString()
	@Length(3, 3)
	alphaCode?: string;
}

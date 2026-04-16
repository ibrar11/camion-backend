import { IsOptional, IsString, Length, MaxLength } from "class-validator";

export class UpdateCurrencyDto {
	@IsOptional()
	@IsString()
	@MaxLength(64)
	name?: string;

	@IsOptional()
	@IsString()
	@Length(3, 3)
	alphaCode?: string;
}

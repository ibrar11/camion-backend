import { IsOptional, IsString, MaxLength, MinLength } from "class-validator";

export class UpdateLanguageDto {
	@IsOptional()
	@IsString()
	@MinLength(1)
	@MaxLength(64)
	name?: string;

	@IsOptional()
	@IsString()
	@MinLength(1)
	@MaxLength(10)
	shortCode?: string;
}

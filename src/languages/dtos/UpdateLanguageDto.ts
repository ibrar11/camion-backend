import { IsOptional, IsString, MaxLength } from "class-validator";

export class UpdateLanguageDto {
	@IsOptional()
	@IsString()
	@MaxLength(64)
	name?: string;

	@IsOptional()
	@IsString()
	@MaxLength(10)
	shortCode?: string;
}

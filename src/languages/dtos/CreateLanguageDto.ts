import { IsString, MaxLength, MinLength } from "class-validator";

export class CreateLanguageDto {
	@IsString()
	@MinLength(1)
	@MaxLength(64)
	name: string;

	@IsString()
	@MinLength(1)
	@MaxLength(10)
	shortCode: string;
}

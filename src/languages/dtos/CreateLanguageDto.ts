import { IsString, MaxLength } from "class-validator";

export class CreateLanguageDto {
	@IsString()
	@MaxLength(64)
	name: string;

	@IsString()
	@MaxLength(10)
	shortCode: string;
}

import {
	IsString,
	MaxLength,
	MinLength,
} from "class-validator";

export class UpdateProductSlugDto {
	@IsString()
	@MinLength(1)
	@MaxLength(64)
	slug: string;
}

import {
	IsString,
	MaxLength,
} from "class-validator";

export class UpdateProductSlugDto {
	@IsString()
	@MaxLength(64)
	slug: string;
}

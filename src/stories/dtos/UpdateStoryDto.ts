import {
	IsBoolean,
	IsString,
	MaxLength,
	MinLength,
	ValidateNested,
} from "class-validator";

export class CaptionField {
	@IsString()
	@MinLength(1)
	@MaxLength(256)
	en: string;

	@IsString()
	@MinLength(1)
	@MaxLength(256)
	ar: string;
}

export class UpdateStoryDto {
	@ValidateNested()
	caption: CaptionField;

	@IsBoolean()
	isHighlighted: boolean;
}

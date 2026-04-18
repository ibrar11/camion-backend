import {
	IsNumber,
	IsString,
	MaxLength,
	MinLength,
	ValidateNested,
} from "class-validator";

export class NameField {
	@IsString()
	@MinLength(1)
	@MaxLength(64)
	en: string;

	@IsString()
	@MinLength(1)
	@MaxLength(64)
	ar: string;
}

export class UpdateProductOptionDto {
	@ValidateNested()
	name: NameField;

	@IsNumber()
	position: number;
}

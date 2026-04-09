import {
	IsNumber,
	IsString,
	MaxLength,
	ValidateNested,
} from "class-validator";

export class NameField {
	@IsString()
	@MaxLength(64)
	en: string;

	@IsString()
	@MaxLength(64)
	ar: string;
}

export class UpdateProductOptionDto {
	@ValidateNested()
	name: NameField;

	@IsNumber()
	position: number;
}

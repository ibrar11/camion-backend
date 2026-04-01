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

export class CreateProductOptionDto {
	@ValidateNested()
	name: NameField;

	@IsNumber()
	position: number;
}

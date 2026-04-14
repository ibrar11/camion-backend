import {
	IsNumber,
	IsString,
	MaxLength,
	ValidateNested,
} from "class-validator";

export class ValueField {
	@IsString()
	@MaxLength(64)
	en: string;

	@IsString()
	@MaxLength(64)
	ar: string;
}

export class CreateProductOptionValueDto {
	@ValidateNested()
	value: ValueField;

	@IsNumber()
	position: number;
}

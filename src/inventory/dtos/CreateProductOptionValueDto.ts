import {
	IsNumber,
	IsString,
	MaxLength,
	MinLength,
	ValidateNested,
} from "class-validator";

export class ValueField {
	@IsString()
	@MinLength(1)
	@MaxLength(64)
	en: string;

	@IsString()
	@MinLength(1)
	@MaxLength(64)
	ar: string;
}

export class CreateProductOptionValueDto {
	@ValidateNested()
	value: ValueField;

	@IsNumber()
	position: number;
}

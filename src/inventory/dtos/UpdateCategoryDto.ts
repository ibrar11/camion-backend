import {
	IsNumber,
	IsString,
	MaxLength,
	Min,
	ValidateNested,
} from "class-validator";

export class NameField {
	@IsString()
	@MaxLength(32)
	en: string;

	@IsString()
	@MaxLength(32)
	ar: string;
}

export class UpdateCategoryDto {
	@IsString()
	@MaxLength(64)
	slug: string;

	@ValidateNested()
	name: NameField;

	@IsNumber()
	@Min(0)
	pricingFactor: number;
}

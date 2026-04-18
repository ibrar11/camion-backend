import {
	IsNumber,
	IsOptional,
	IsString,
	IsUUID,
	MaxLength,
	Min,
	MinLength,
	ValidateNested,
} from "class-validator";

export class NameField {
	@IsString()
	@MinLength(1)
	@MaxLength(32)
	en: string;

	@IsString()
	@MinLength(1)
	@MaxLength(32)
	ar: string;
}

export class CreateCategoryDto {
	@IsOptional()
	@IsUUID('4')
	parentUUID: string | null;

	@IsString()
	@MinLength(1)
	@MaxLength(64)
	slug: string;

	@ValidateNested()
	name: NameField;

	@IsNumber()
	@Min(0)
	pricingFactor: number;
}

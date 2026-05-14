import {
	IsBoolean,
	IsNumber,
	IsString,
	Max,
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

export class UpdateCategoryDto {
	@IsString()
	@MinLength(1)
	@MaxLength(64)
	slug: string;

	@ValidateNested()
	name: NameField;

	@IsNumber()
	@Min(1)
	pricingFactor: number;

	@IsNumber()
	@Min(0)
	@Max(10)
	discountPercentage: number;

	@IsBoolean()
	isFeatured: boolean;

	@IsBoolean()
	isFeaturedOnHomepage: boolean = false;
}

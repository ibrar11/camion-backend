import {
	IsNumber,
	IsString,
	Max,
	MaxLength,
	Min,
	MinLength,
	ValidateNested,
} from "class-validator";

export class TitleField {
	@IsString()
	@MinLength(1)
	en: string;

	@IsString()
	@MinLength(1)
	ar: string;
}

export class BriefField {
	@IsString()
	@MinLength(1)
	en: string;

	@IsString()
	@MinLength(1)
	ar: string;
}

export class UpdateBundleDto {
	@ValidateNested()
	readonly title: TitleField;

	@ValidateNested()
	readonly brief: BriefField;

	@IsString()
	@MinLength(1)
	@MaxLength(64)
	readonly slug: string;

	@IsNumber()
	@Min(1)
	readonly pricingFactor: number;

	@IsNumber()
	@Min(1)
	@Max(99)
	readonly discountPercentage: number;
}

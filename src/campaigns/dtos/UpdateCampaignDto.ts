import {
	IsArray,
	IsBoolean,
	IsNumber,
	IsString,
	IsUUID,
	Matches,
	Max,
	MaxLength,
	Min,
	MinLength,
	ValidateNested,
} from "class-validator";

export class NameField {
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
	@MaxLength(256)
	ar: string;

	@IsString()
	@MinLength(1)
	@MaxLength(256)
	en: string;
}

export class UpdateCampaignDto {
	@ValidateNested()
	readonly name: NameField;

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

	@IsString()
	@MinLength(1)
	@Matches(/^\d{4}-(0[1-9]|1[0-2])-(0[1-9]|[12]\d|3[01])$/)
	readonly startsAt: string;

	@IsString()
	@MinLength(1)
	@Matches(/^\d{4}-(0[1-9]|1[0-2])-(0[1-9]|[12]\d|3[01])$/)
	readonly finishesAt: string;

	@IsBoolean()
	readonly isFeatured: boolean;

	@IsArray()
	@IsUUID('4', { each: true, })
	readonly categories: Array<string>;
}

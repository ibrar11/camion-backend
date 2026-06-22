import {
	IsDefined,
	IsEnum,
	IsNotEmpty,
	IsNotEmptyObject,
	IsNumber,
	IsObject,
	IsString,
	MaxLength,
	MinLength,
	ValidateNested,
} from "class-validator";

import { Type } from "class-transformer";

import { CurrencyCode } from "../enums/CurrencyCode.enum";
import { WeightUnit } from "../enums/WeightUnit.enum";
import { DimensionsUnit } from "../enums/DimensionsUnit.enum";

export class TitleField {
	@IsString()
	@MinLength(1)
	@MaxLength(128)
	en: string;

	@IsString()
	@MinLength(1)
	@MaxLength(128)
	ar: string;
}

export class Money {
	@IsNumber()
	amount: number;

	@IsNumber()
	minorAmount: number = 0;

	@IsString()
	@IsEnum(CurrencyCode)
	currencyCode: CurrencyCode;
}

export class Weight {
	@IsNumber()
	amount: number;

	@IsString()
	@IsEnum(WeightUnit)
	unit: WeightUnit;
}

export class Dimensions {
	@IsNumber()
	width: number;

	@IsNumber()
	height: number;

	@IsNumber()
	length: number;

	@IsString()
	@IsEnum(DimensionsUnit)
	unit: DimensionsUnit;
}

export class UpdateProductVariantDto {
	@ValidateNested()
	title: TitleField;

	@IsString()
	@MinLength(1)
	sku: string;

	@IsString()
	@MinLength(1)
	barcode: string;

	@IsDefined()
	@IsNotEmptyObject()
	@IsObject()
	@ValidateNested()
	@Type(() => Money)
	price: Money;

	@IsDefined()
	@IsNotEmpty()
	@IsObject()
	@ValidateNested()
	@Type(() => Weight)
	weight: Weight;

	@IsDefined()
	@IsNotEmpty()
	@IsObject()
	@ValidateNested()
	@Type(() => Dimensions)
	dimensions: Dimensions;
}

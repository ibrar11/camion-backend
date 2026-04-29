import {
	IsArray,
	IsDefined,
	IsEnum,
	IsNotEmpty,
	IsNotEmptyObject,
	IsNumber,
	IsObject,
	IsOptional,
	IsString,
	IsUUID,
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

export class CreateProductVariantDto {
	@IsUUID('4')
	warehouse: string;

	@ValidateNested()
	title: TitleField;

	@IsString()
	@MinLength(1)
	sku: string;

	@IsNumber()
	quantity: number;

	@IsString()
	@MinLength(1)
	barcode: string;

	@IsDefined()
	@IsNotEmptyObject()
	@IsObject()
	@ValidateNested()
	@Type(() => Money)
	cost: Money;

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

	@IsArray()
	@IsUUID('4', { each: true, })
	optionValues: Array<string>;

	@IsOptional()
	@IsObject()
	skuMeta?: Record<string, any>;
}

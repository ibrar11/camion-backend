import {
	IsArray,
	IsDefined,
	IsEnum,
	IsNotEmpty,
	IsNotEmptyObject,
	IsNumber,
	IsObject,
	IsString,
	IsUUID,
	MaxLength,
	ValidateNested,
} from "class-validator";

import { Type } from "class-transformer";

import { CurrencyCode } from "../enums/CurrencyCode";
import { WeightUnit } from "../enums/WeightUnit";
import { DimensionsUnit } from "../enums/DimensionsUnit";

export class TitleField {
	@IsString()
	@MaxLength(128)
	en: string;

	@IsString()
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
	sku: string;

	@IsNumber()
	quantity: number;

	@IsString()
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

	@IsArray()
	@IsUUID('4', { each: true, })
	optionValues: Array<string>;
}

import {
	IsBoolean,
	IsEnum,
	IsNumber,
	IsString,
	MaxLength,
	MinLength,
} from "class-validator";

import {
	KeyValuePairType,
} from "../enums/KeyValuePairType.enum";

export class CreateKeyValuePairDto {
	@IsString()
	@MinLength(1)
	@MaxLength(32)
	name: string;

	@IsEnum(KeyValuePairType)
	type: KeyValuePairType;

	@IsNumber()
	integerValue: number;

	@IsNumber()
	decimalValue: number;

	@IsString()
	@MaxLength(256)
	stringValue: string;

	@IsBoolean()
	booleanValue: boolean;
}

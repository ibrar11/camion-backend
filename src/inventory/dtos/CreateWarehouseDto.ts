import {
	IsEnum,
	IsString,
	MaxLength,
	MinLength,
} from "class-validator";

import { CountryCode } from "../enums/CountryCode";

export class CreateWarehouseDto {
	@IsString()
	@MinLength(1)
	@MaxLength(64)
	name: string;

	@IsString()
	@MinLength(1)
	@MaxLength(32)
	code: string;

	@IsString()
	@MinLength(1)
	@MaxLength(128)
	addressLine1: string;

	@IsString()
	@MinLength(1)
	@MaxLength(128)
	addressLine2: string;

	@IsString()
	@IsEnum(CountryCode)
	country: CountryCode;

	@IsString()
	@MinLength(1)
	@MaxLength(32)
	state: string;

	@IsString()
	@MinLength(1)
	@MaxLength(32)
	city: string;
}

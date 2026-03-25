import {
	IsEnum,
	IsString,
	MaxLength,
} from "class-validator";

import { CountryCode } from "../enums/CountryCode";

export class CreateWarehouseDto {
	@IsString()
	@MaxLength(64)
	name: string;

	@IsString()
	@MaxLength(32)
	code: string;

	@IsString()
	@MaxLength(128)
	addressLine1: string;

	@IsString()
	@MaxLength(128)
	addressLine2: string;

	@IsString()
	@IsEnum(CountryCode)
	country: CountryCode;

	@IsString()
	@MaxLength(32)
	state: string;

	@IsString()
	@MaxLength(32)
	city: string;
}

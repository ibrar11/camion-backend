import {
	IsEnum,
	IsOptional,
	IsString,
	MaxLength,
	MinLength,
} from "class-validator";

import { CountryCode } from "../enums/CountryCode.enum";

export class UpdateWarehouseDto {
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
	@MinLength(1)
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

	@IsOptional()
	@IsString()
	@MaxLength(32)
	contactName?: string;

	@IsOptional()
	@IsString()
	@MaxLength(32)
	phone?: string;

	@IsOptional()
	@IsString()
	@MaxLength(16)
	postcode?: string;

	@IsOptional()
	@IsString()
	@MaxLength(32)
	district?: string;

	@IsOptional()
	@IsString()
	@MaxLength(64)
	gulltransWarehouseId?: string;

	@IsOptional()
	@IsString()
	@MaxLength(64)
	gulltransUserId?: string;
}

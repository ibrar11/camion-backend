import {
	IsEnum,
	IsNumber,
	IsString,
	MaxLength,
	MinLength,
} from "class-validator";

import { TransactionType } from "../enums/TransactionType.enum";
import { CurrencyCode } from "../../inventory/enums/CurrencyCode.enum";

export class CreateTransactionDto {
	@IsNumber()
	amount: number;

	@IsEnum(CurrencyCode)
	currencyCode: CurrencyCode;

	@IsEnum(TransactionType)
	type: TransactionType;

	@IsString()
	@MinLength(1)
	@MaxLength(256)
	description: string;
}

import {
	IsEnum,
	IsNumber,
	IsString,
	MaxLength,
} from "class-validator";

import { TransactionType } from "../enums/TransactionType.enum";
import { CurrencyCode } from "../../inventory/enums/CurrencyCode";

export class CreateTransactionDto {
	@IsNumber()
	amount: number;

	@IsEnum(CurrencyCode)
	currencyCode: CurrencyCode;

	@IsEnum(TransactionType)
	type: TransactionType;

	@IsString()
	@MaxLength(256)
	description: string;
}

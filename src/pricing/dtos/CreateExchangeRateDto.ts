import {
	IsEnum,
	IsNumber,
	IsString,
	Min,
} from "class-validator";

import { CurrencyCode } from "../../inventory/enums/CurrencyCode.enum";

export class CreateExchangeRateDto {
	@IsString()
	@IsEnum(CurrencyCode)
	srcCurrencyCode: CurrencyCode;

	@IsString()
	@IsEnum(CurrencyCode)
	targetCurrencyCode: CurrencyCode;

	@IsNumber()
	@Min(0)
	factor: number;
}

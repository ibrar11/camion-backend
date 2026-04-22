import {
    IsNumber,
    Min,
    IsUUID,
    IsString,
    IsEnum
} from "class-validator";

import { CurrencyCode } from "../../inventory/enums/CurrencyCode.enum";

export class UpdateCartItemDto {
    @IsUUID('4')
    productUuid: string;

    @IsUUID('4')
    variantUuid: string;

    @IsNumber()
    @Min(1)
    quantity: number;

    @IsString()
    @IsEnum(CurrencyCode)
    currencyCode: CurrencyCode;
}

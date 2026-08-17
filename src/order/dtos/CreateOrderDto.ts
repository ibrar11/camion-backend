import {
    IsArray,
    IsBoolean,
    IsEnum,
    IsOptional,
    IsString,
    IsUUID,
    MinLength,
} from 'class-validator';

import { CurrencyCode } from '../../inventory/enums/CurrencyCode.enum';
import { PaymentMethod } from '../../payments/enums/PaymentMethod';

export class CreateOrderDto {
    @IsString()
    @IsEnum(PaymentMethod)
    paymentMethod: PaymentMethod;

    @IsArray()
    @IsUUID("all", { each: true })
    cartItemUuids: string[];

    @IsString()
    @IsEnum(CurrencyCode)
    currency: CurrencyCode;

    @IsOptional()
    @IsString()
    couponCode?: string;

    @IsString()
    @MinLength(1)
    platform: "web" | "mobile" = "mobile"

    @IsOptional()
    @IsBoolean()
    tokenizeCard?: boolean;
}

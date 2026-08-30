import {
    IsArray,
    IsBoolean,
    IsEnum,
    IsIn,
    IsOptional,
    IsString,
    IsUUID,
    MinLength,
} from 'class-validator';

import { CurrencyCode } from '../../inventory/enums/CurrencyCode.enum';
import { PaymentMethod } from '../../payments/enums/PaymentMethod';

export class CreateOrderDto {
    @IsString()
    @IsOptional()
    @IsEnum(PaymentMethod)
    paymentMethod: PaymentMethod = PaymentMethod.DEFAULT;

    @IsArray()
    @IsUUID("all", { each: true })
    cartItemUuids: string[];

    @IsString()
    @IsEnum(CurrencyCode)
    currency: CurrencyCode;

    @IsOptional()
    @IsString()
    couponCode?: string;

    @IsOptional()
    @IsString()
    @IsIn(['web', 'mobile'])
    platform?: 'web' | 'mobile';

    @IsOptional()
    @IsBoolean()
    tokenizeCard?: boolean;

    @IsOptional()
    @IsString()
    tokenId?: string;

    @IsOptional()
    @IsString()
    redirectUrl?: string;

    apiVersion?: 'v1' | 'v2';
}

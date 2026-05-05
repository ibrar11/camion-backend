import {
    IsArray,
    IsEnum,
    IsOptional,
    IsString,
    IsUUID,
    MinLength,
} from 'class-validator';

import { CurrencyCode } from '../../inventory/enums/CurrencyCode.enum';

export class CreateOrderDto {
    @IsString()
    @MinLength(1)
    paymentMethod: string;

    @IsArray()
    @IsUUID("all", { each: true })
    cartItemUuids: string[];

    @IsString()
    @IsEnum(CurrencyCode)
    currency: CurrencyCode;

    @IsOptional()
    @IsString()
    couponCode?: string;
}

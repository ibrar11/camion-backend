import {
    IsArray,
    IsEnum,
    IsOptional,
    IsString,
    IsUUID,
} from 'class-validator';

import { CurrencyCode } from '../../inventory/enums/CurrencyCode.enum';

export class OrderPreviewV2Dto {

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

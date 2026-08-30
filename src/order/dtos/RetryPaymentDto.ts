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

import { PaymentMethod } from '../../payments/enums/PaymentMethod';

export class RetryPaymentDto {
    @IsString()
    @IsOptional()
    @IsEnum(PaymentMethod)
    paymentMethod: PaymentMethod = PaymentMethod.DEFAULT;

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

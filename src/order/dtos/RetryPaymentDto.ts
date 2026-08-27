import {
    IsArray,
    IsBoolean,
    IsEnum,
    IsOptional,
    IsString,
    IsUUID,
    MinLength,
} from 'class-validator';

import { PaymentMethod } from '../../payments/enums/PaymentMethod';

export class RetryPaymentDto {
    @IsString()
    @IsEnum(PaymentMethod)
    paymentMethod: PaymentMethod;

    @IsString()
    @MinLength(1)
    platform: "web" | "mobile" = "mobile"

    @IsOptional()
    @IsBoolean()
    tokenizeCard?: boolean;

    @IsOptional()
    @IsString()
    tokenId?: string;

    @IsOptional()
    @IsString()
    redirectUrl?: string;
}

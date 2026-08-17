import {
    IsEmail,
    IsNumber,
    IsString,
    MinLength,
    IsUUID,
    IsEnum,
    IsOptional
} from "class-validator";

import { CurrencyCode } from "../../inventory/enums/CurrencyCode.enum";
import { PaymentStatus } from "../enums/PaymentStatus";

export class SkipcashSdkResultDto {
    @IsString()
    amount: string;

    @IsString()
    @MinLength(1)
    currency: CurrencyCode;

    @IsString()
    @IsUUID()
    @MinLength(1)
    orderUUID: string;

    @IsString()
    @IsEnum(PaymentStatus)
    paymentStatus: PaymentStatus;

    @IsString()
    @MinLength(1)
    paymentId: string;

    @IsOptional()
    @IsString()
    tokenId?: string;

    @IsOptional()
    @IsString()
    failureReason?: string;

    @IsOptional()
    @IsString()
    errorCode?: string;

}

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
import { PaymentMoney } from "../entities/payment-transaction.entity";
import { PaymentStatus } from "../enums/PaymentStatus";

export class SkipcashSdkResultDto {
    @IsNumber()
    amount: PaymentMoney;

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

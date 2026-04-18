import {
    IsEmail,
    IsEnum,
    IsNumber,
    IsString,
    MinLength, 
    IsUUID
} from "class-validator";

import { PaymentProvider } from "../enums/PaymentProvider";

export class CreatePaymentDto {
    @IsEnum(PaymentProvider)
    provider: PaymentProvider;

    @IsNumber()
    amount: number;

    @IsString()
    @MinLength(1)
    currency: string;

    @IsString()
    @IsUUID()
    @MinLength(1)
    orderUUID: string;

    // Customer info (needed by SkipCash)
    @IsString()
    @MinLength(1)
    firstName: string;

    @IsString()
    @MinLength(1)
    lastName: string;

    @IsString()
    @MinLength(1)
    phoneNumber: string;

    @IsString()
    @IsEmail()
    @MinLength(1)
    emailAddress: string;

    @IsString()
    @MinLength(1)
    street: string;

    @IsString()
    @MinLength(1)
    city: string;

    @IsString()
    @MinLength(1)
    state: string;

    @IsString()
    @MinLength(1)
    country: string;

    @IsString()
    @MinLength(1)
    postalCode: string;
}

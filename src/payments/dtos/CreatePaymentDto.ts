import { 
    IsEnum, 
    IsNumber, 
    IsString, 
    IsUUID
} from "class-validator";

import { PaymentProvider } from "../enums/PaymentProvider";

export class CreatePaymentDto {
    @IsEnum(PaymentProvider)
    provider: PaymentProvider;

    @IsNumber()
    amount: number;

    @IsString()
    currency: string;

    @IsString()
    @IsUUID()
    orderUUID: string;

    // Customer info (needed by SkipCash)
    @IsString()
    firstName: string;

    @IsString()
    lastName: string;

    @IsString()
    phone: string;

    @IsString()
    email: string;

    @IsString()
    street: string;

    @IsString()
    city: string;

    @IsString()
    state: string;

    @IsString()
    country: string;

    @IsString()
    postalCode: string;
}
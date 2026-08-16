import {
    IsBoolean,
    IsCurrency,
    IsEmail,
    IsEnum,
    IsNotEmpty,
    IsNumber,
    IsOptional,
    IsPhoneNumber,
    IsString,
    IsUUID,
    Min,
    MinLength,
    ValidateNested,
} from 'class-validator';

import { PaymentMethod } from '../enums/PaymentMethod';
import { PaymentProvider } from '../enums/PaymentProvider';
import { CurrencyCode } from '../../inventory/enums/CurrencyCode.enum';

import { Order } from '../../order/entities/order.entity';

import { PaymentMoney } from '../entities/payment-transaction.entity';
import { Type } from 'class-transformer';


export class CreateSkipCashSessionDto {
    @IsEnum(PaymentProvider)
    provider: PaymentProvider;
    
    @ValidateNested()
    @Type(() => Order)
    @IsNotEmpty()
    order: Order;

    @IsNumber()
    amount: PaymentMoney;

    @IsCurrency()
    currency: CurrencyCode;

    @IsString()
    paymentMethod: PaymentMethod;

    @IsOptional()
    @IsBoolean()
    tokenizeCard?: boolean;

    @IsEmail()
    emailAddress: string;

    @IsString()
    firstName: string;

    @IsString()
    lastName: string;

    @IsPhoneNumber()
    phoneNumber: string;

    @IsString()
    @MinLength(1)
    platform: "web" | "mobile" = "mobile"
}
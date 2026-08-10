import {
    IsBoolean,
    IsCurrency,
    IsEmail,
    IsNotEmpty,
    IsNumber,
    IsOptional,
    IsPhoneNumber,
    IsString,
    IsUUID,
    Min,
} from 'class-validator';

export class CreateSkipCashSessionDto {
    @IsUUID('4')
    @IsNotEmpty()
    orderUuid: string;

    @IsNumber()
    @Min(0.01)
    amount: number;

    @IsCurrency()
    currency: string;

    @IsOptional()
    @IsString()
    paymentMethod?: 'credit_card' | 'apple_pay' | 'google_pay' | 'all';

    @IsOptional()
    @IsBoolean()
    tokenizeCard?: boolean;

    @IsOptional()
    @IsString()
    savedCardTokenId?: string; // For charging a saved card

    @IsEmail()
    email: string;

    @IsString()
    firstName: string;

    @IsString()
    lastName: string;

    @IsPhoneNumber()
    phone: string;
}
import { 
    IsString, 
    ValidateNested, 
    IsOptional, 
    IsEmail, 
    MaxLength, 
    IsUUID 
} from 'class-validator';

import { Type } from 'class-transformer';

class ShippingAddressDto {
    @IsString()
    fullName: string;

    @IsString()
    countryCode: string;

    @IsString()
    phoneNumber: string;

    @IsString()
    streetAddress: string;

    @IsString()
    apartment: string;

    @IsString()
    @MaxLength(5)
    zipCode: string;

    @IsString()
    city: string;

    @IsString()
    state: string;

    @IsString()
    country: string;
}

class CustomerDataDto {
    @IsOptional()
    @IsString()
    fullName?: string;

    @IsOptional()
    @IsEmail()
    email?: string;

    @IsOptional()
    @IsString()
    phoneNumber?: string;

    @IsOptional()
    @IsString()
    streetAddress?: string;

    @IsOptional()
    @IsString()
    apartment?: string;

    @IsOptional()
    @IsString()
    city?: string;

    @IsOptional()
    @IsString()
    state?: string;

    @IsOptional()
    @IsString()
    zipCode?: string;

    @IsOptional()
    @IsString()
    country?: string;

    @IsOptional()
    @ValidateNested()
    @Type(() => ShippingAddressDto)
    shippingAddress?: ShippingAddressDto;

    @IsOptional()
    shippingOption?: any;
}

export class CreateOrderDto {
    @IsOptional()
    @ValidateNested()
    @Type(() => CustomerDataDto)
    customerData?: CustomerDataDto;

    @IsString()
    paymentMethod: string;
}
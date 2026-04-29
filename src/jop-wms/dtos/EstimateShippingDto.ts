import { IsArray, IsInt, IsNumber, IsOptional, IsString, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

export class ShippingConsignee {
    // Two-character country code
    @IsString()
    country: string;

    @IsString()
    address: string;

    @IsOptional()
    @IsString()
    province?: string;

    @IsString()
    city: string;

    @IsString()
    postcode: string;
}

export class ShippingBoxDetail {
    @IsNumber()
    weight: number;

    @IsOptional()
    @IsNumber()
    length?: number;

    @IsOptional()
    @IsNumber()
    width?: number;

    @IsOptional()
    @IsNumber()
    height?: number;

    @IsOptional()
    @IsInt()
    qty?: number;
}

export class EstimateShippingDto {
    @IsString()
    logisticsChannelCode: string;

    // 1 = residential, 0 = commercial
    @IsOptional()
    @IsInt()
    addressType?: number;

    @ValidateNested()
    @Type(() => ShippingConsignee)
    consignee: ShippingConsignee;

    @IsArray()
    @ValidateNested({ each: true })
    @Type(() => ShippingBoxDetail)
    boxDetails: ShippingBoxDetail[];
}

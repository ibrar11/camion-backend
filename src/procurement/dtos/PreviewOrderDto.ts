import {
    IsString,
    IsOptional,
    IsArray,
    IsNotEmpty,
    IsDefined,
    IsNotEmptyObject,
    IsObject,
    ValidateNested,
    ArrayMinSize,
} from 'class-validator';
import { Type } from 'class-transformer';

export class PreviewOrderAddressDto {
    @IsString()
    @IsNotEmpty()
    receiver_name: string;

    @IsString()
    @IsNotEmpty()
    postcode: string;

    @IsString()
    @IsNotEmpty()
    province: string;

    @IsString()
    @IsNotEmpty()
    city: string;

    @IsString()
    @IsNotEmpty()
    district: string;

    @IsOptional()
    @IsString()
    street?: string;

    @IsString()
    @IsNotEmpty()
    address: string;

    @IsString()
    @IsNotEmpty()
    phone: string;
}

export class PreviewOrderSkuDto {
    @IsString()
    @IsNotEmpty()
    goods_id: string;

    @IsString()
    @IsNotEmpty()
    sku_id: string;

    @IsString()
    @IsNotEmpty()
    sum: string;

    @IsOptional()
    @IsString()
    spec_id?: string;
}

export class PreviewOrderDto {
    @IsString()
    @IsNotEmpty()
    platform: string = '1688';

    @IsArray()
    @ArrayMinSize(1)
    @ValidateNested({ each: true })
    @Type(() => PreviewOrderSkuDto)
    skus: PreviewOrderSkuDto[];

    @IsDefined()
    @IsNotEmptyObject()
    @IsObject()
    @ValidateNested()
    @Type(() => PreviewOrderAddressDto)
    address: PreviewOrderAddressDto;
}

import {
    IsString,
    IsOptional,
    IsArray,
    IsNotEmpty,
    IsNotEmptyObject,
    IsObject,
    IsDefined,
    ValidateNested,
    ArrayMinSize,
} from 'class-validator';
import { Type } from 'class-transformer';

import { OrderAddressDto, OrderSkuDto } from './CreateProcurementOrderDto';

export class BulkOrderItemDto {
    @IsOptional()
    @IsString()
    shop_id?: string;

    @IsOptional()
    @IsString()
    shop_name?: string;

    @IsString()
    @IsNotEmpty()
    platform: string = '1688';

    @IsString()
    @IsNotEmpty()
    platform_url: string;

    @IsString()
    @IsNotEmpty()
    name: string;

    @IsOptional()
    @IsString()
    title_cn?: string;

    @IsString()
    @IsNotEmpty()
    goods_amount: string;

    @IsOptional()
    @IsString()
    freight_fee?: string;

    @IsOptional()
    @IsString()
    remark?: string;

    @IsArray()
    @ArrayMinSize(1)
    @ValidateNested({ each: true })
    @Type(() => OrderSkuDto)
    skus: OrderSkuDto[];
}

export class BulkCreateProcurementOrderDto {
    @IsArray()
    @ArrayMinSize(1)
    @ValidateNested({ each: true })
    @Type(() => BulkOrderItemDto)
    orders: BulkOrderItemDto[];

    @IsDefined()
    @IsNotEmptyObject()
    @IsObject()
    @ValidateNested()
    @Type(() => OrderAddressDto)
    address: OrderAddressDto;
}

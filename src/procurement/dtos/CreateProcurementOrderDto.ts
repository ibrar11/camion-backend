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

export class CountryDto {
    @IsString()
    @IsNotEmpty()
    country_code: string;

    @IsString()
    @IsNotEmpty()
    name: string;
}

export class OrderAddressDto {
    @IsString()
    @IsNotEmpty()
    address: string;

    @IsString()
    @IsNotEmpty()
    province: string;

    @IsString()
    @IsNotEmpty()
    city: string;

    @IsOptional()
    @IsString()
    company?: string;

    @IsOptional()
    @IsString()
    district?: string;

    @IsOptional()
    @IsString()
    street?: string;

    @IsOptional()
    @IsString()
    postcode?: string;

    @IsString()
    @IsNotEmpty()
    phone: string;

    @IsString()
    @IsNotEmpty()
    receiver_name: string;

    @IsOptional()
    @IsString()
    email?: string;

    @IsString()
    @IsNotEmpty()
    country_name: string;

    @IsDefined()
    @IsNotEmptyObject()
    @IsObject()
    @ValidateNested()
    @Type(() => CountryDto)
    country: CountryDto;
}

export class SkuSpecDto {
    @IsString()
    @IsNotEmpty()
    label: string;

    @IsString()
    @IsNotEmpty()
    value: string;
}

export class PriceRangeDto {
    @IsString()
    @IsNotEmpty()
    startQuantity: string;

    @IsString()
    @IsNotEmpty()
    price: string;
}

export class SkuInfoDto {
    @IsOptional()
    @IsString()
    shop_id?: string;

    @IsOptional()
    @IsString()
    shop_name?: string;

    @IsOptional()
    @IsString()
    sku_img?: string;

    @IsOptional()
    @IsString()
    spec_id?: string;

    @IsOptional()
    @IsString()
    min_order_quantity?: string;

    @IsOptional()
    @IsString()
    batch_number?: string;

    @IsOptional()
    @IsArray()
    @IsString({ each: true })
    imgs?: string[];

    @IsOptional()
    @IsArray()
    @ValidateNested({ each: true })
    @Type(() => SkuSpecDto)
    specs?: SkuSpecDto[];

    @IsOptional()
    @IsArray()
    @ValidateNested({ each: true })
    @Type(() => PriceRangeDto)
    priceRangeList?: PriceRangeDto[];
}

export class OrderSkuDto {
    @IsString()
    @IsNotEmpty()
    price: string;

    @IsString()
    @IsNotEmpty()
    platform_sku: string;

    @IsString()
    @IsNotEmpty()
    quantity: string;

    @IsOptional()
    @IsString()
    freight_fee?: string;

    @IsDefined()
    @IsNotEmptyObject()
    @IsObject()
    @ValidateNested()
    @Type(() => SkuInfoDto)
    sku_info: SkuInfoDto;
}

export class CreateProcurementOrderDto {
    @IsOptional()
    @IsString()
    orderUuid?: string;

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

    @IsDefined()
    @IsNotEmptyObject()
    @IsObject()
    @ValidateNested()
    @Type(() => OrderAddressDto)
    address: OrderAddressDto;
}

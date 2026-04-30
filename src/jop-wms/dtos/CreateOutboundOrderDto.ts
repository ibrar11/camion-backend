import { IsArray, IsInt, IsNumber, IsOptional, IsString, Min, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

export class OutboundConsignee {
    @IsString()
    name: string;

    @IsOptional()
    @IsString()
    company?: string;

    // Two-character country code e.g. US, GB, AE
    @IsString()
    country: string;

    @IsString()
    province: string;

    @IsString()
    city: string;

    @IsOptional()
    @IsString()
    district?: string;

    @IsOptional()
    @IsString()
    houseNo?: string;

    @IsString()
    address: string;

    @IsString()
    postcode: string;

    @IsString()
    phone: string;

    @IsOptional()
    @IsString()
    email?: string;
}

export class OutboundProductItem {
    @IsString()
    sku: string;

    @IsInt()
    @Min(1)
    qty: number;
}

export class CreateOutboundOrderDto {
    // Our customer-side reference number (customerVoucherNo in WMS)
    @IsString()
    customerVoucherNo: string;

    @IsString()
    logisticsChannelCode: string;

    // Order source: 4=Other, 10=Ebay, 11=Amazon, 20=Shopify etc. Default: 4
    @IsOptional()
    @IsInt()
    orderSource?: number = 4;

    // Pre-existing waybill number (if we upload our own label)
    @IsOptional()
    @IsString()
    waybillNo?: string;

    // Base64-encoded label PDF (for self-upload label channel)
    @IsOptional()
    @IsString()
    logisticsLabelInfo?: string;

    @IsOptional()
    @IsString()
    memo?: string;

    // Insurance: 0=No, 1=Yes
    @IsOptional()
    @IsInt()
    insurance?: number = 0;

    @IsOptional()
    @IsNumber()
    insuranceValue?: number;

    @IsOptional()
    @IsString()
    insuranceCurrency?: string;

    @IsOptional()
    @IsNumber()
    orderSaleSum?: number;

    @IsOptional()
    @IsString()
    orderSaleCurrency?: string;

    @ValidateNested()
    @Type(() => OutboundConsignee)
    consignee: OutboundConsignee;

    @IsArray()
    @ValidateNested({ each: true })
    @Type(() => OutboundProductItem)
    productList: OutboundProductItem[];
}

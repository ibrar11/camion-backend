import { IsArray, IsInt, IsNumber, IsOptional, IsString, Min, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

export class InboundProductItem {
    @IsString()
    sku: string;

    @IsInt()
    @Min(1)
    qty: number;
}

export class InboundBox {
    @IsString()
    boxNo: string;

    @IsInt()
    @Min(1)
    serialNumber: number;

    @IsNumber()
    length: number;

    @IsNumber()
    width: number;

    @IsNumber()
    height: number;

    @IsNumber()
    weight: number;

    @IsArray()
    @ValidateNested({ each: true })
    @Type(() => InboundProductItem)
    productList: InboundProductItem[];
}

export class CreateInboundOrderDto {
    // Our customer-side reference number (customerVoucherNo in WMS)
    @IsString()
    customerVoucherNo: string;

    // 0: sea freight, 1: air freight, 2: express, 3: rail, 4: land transport
    @IsInt()
    @Min(0)
    shipperMethod: number;

    @IsOptional()
    @IsString()
    shipperCompany?: string;

    // Container number
    @IsOptional()
    @IsString()
    equipmentNumber?: string;

    // Freight tracking number
    @IsOptional()
    @IsString()
    waybillNo?: string;

    @IsOptional()
    @IsString()
    vat?: string;

    @IsOptional()
    @IsString()
    vatInfo?: string;

    @IsOptional()
    @IsString()
    memo?: string;

    @IsOptional()
    @IsArray()
    @IsString({ each: true })
    sourceOrderUuids?: string[];

    @IsArray()
    @ValidateNested({ each: true })
    @Type(() => InboundBox)
    boxList: InboundBox[];
}

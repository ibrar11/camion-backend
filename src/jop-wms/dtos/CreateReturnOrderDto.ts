import { IsArray, IsInt, IsOptional, IsString, Min, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

export class ReturnCargoItem {
    @IsString()
    sku: string;

    @IsInt()
    @Min(1)
    qty: number;
}

export class CreateReturnOrderDto {
    // Original outbound customerVoucherNo (required when original=1)
    @IsOptional()
    @IsString()
    sourceNo?: string;

    // 1 = return of an outbound order, 0 = standalone return
    @IsInt()
    original: number;

    // Freight tracking number of the returning shipment
    @IsOptional()
    @IsString()
    waybillNo?: string;

    @IsOptional()
    @IsString()
    reason?: string;

    @IsArray()
    @ValidateNested({ each: true })
    @Type(() => ReturnCargoItem)
    cargoList: ReturnCargoItem[];
}

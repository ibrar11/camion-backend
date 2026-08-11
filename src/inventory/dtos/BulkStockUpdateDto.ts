import { IsArray, IsUUID, IsNumber, Min, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

export class StockUpdateItemDto {
    @IsUUID('4')
    variantUuid: string;

    @IsNumber()
    @Min(0)
    quantity: number;

    @IsUUID('4')
    warehouseUuid: string;
}

export class BulkStockUpdateDto {
    @IsArray()
    @ValidateNested({ each: true })
    @Type(() => StockUpdateItemDto)
    updates: StockUpdateItemDto[];
}
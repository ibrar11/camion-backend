import { IsInt, IsOptional, IsString, Min } from 'class-validator';
import { Type } from 'class-transformer';

export class QueryInventoryDto {
    @IsOptional()
    @IsString()
    sku?: string;

    @IsOptional()
    @IsString()
    warehouseCode?: string;

    // 0 = qualified items, 1 = damaged items
    @IsOptional()
    @IsInt()
    @Type(() => Number)
    inventoryType?: number;

    @IsOptional()
    @IsInt()
    @Min(1)
    @Type(() => Number)
    page?: number = 1;

    @IsOptional()
    @IsInt()
    @Min(1)
    @Type(() => Number)
    limit?: number = 10;
}

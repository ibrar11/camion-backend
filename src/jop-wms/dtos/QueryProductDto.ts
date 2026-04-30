import { IsOptional, IsString, IsInt, Min } from 'class-validator';
import { Type } from 'class-transformer';

export class QueryProductDto {
    // SKU / product code — supports comma-separated multiple values
    @IsOptional()
    @IsString()
    code?: string;

    @IsOptional()
    @IsString()
    barcode?: string;

    // Chinese name
    @IsOptional()
    @IsString()
    name?: string;

    // English name
    @IsOptional()
    @IsString()
    enName?: string;

    @IsOptional()
    @IsInt()
    @Min(1)
    @Type(() => Number)
    page?: number = 1;
}

import { IsOptional, IsString, IsNumberString } from 'class-validator';

export class SearchProductsDto {
    @IsString()
    keyword: string;

    @IsOptional()
    @IsNumberString()
    page?: string = '1';

    @IsOptional()
    @IsNumberString()
    pageSize?: string = '4';

    @IsOptional()
    @IsString()
    sort?: string;

    @IsOptional()
    @IsString()
    priceStart?: string;

    @IsOptional()
    @IsString()
    priceEnd?: string;
}

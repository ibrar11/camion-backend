import {
    IsArray,
    ArrayMinSize,
    IsBoolean,
    IsInt,
    IsNotEmpty,
    IsOptional,
    IsString,
    IsUUID,
    Length,
    Min,
    ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';

import { CurrencyCode } from '../../inventory/enums/CurrencyCode.enum';
import { WeightUnit } from 'src/inventory/enums/WeightUnit.enum';
import { DimensionsUnit } from 'src/inventory/enums/DimensionsUnit.enum';

class LocalizedTextDto {
    @IsString()
    @IsNotEmpty()
    en!: string;

    @IsString()
    @IsNotEmpty()
    ar: string; // allow empty string
}

class ImportOptionValueDto {
    @ValidateNested()
    @Type(() => LocalizedTextDto)
    value!: LocalizedTextDto;

    @IsInt()
    @Min(0)
    position!: number;
}

class ImportOptionDto {
    @ValidateNested()
    @Type(() => LocalizedTextDto)
    name!: LocalizedTextDto;

    @IsInt()
    @Min(0)
    position!: number;

    @IsArray()
    @ValidateNested({ each: true })
    @Type(() => ImportOptionValueDto)
    values!: ImportOptionValueDto[];
}

class ImportVariantAttributeDto {
    @IsString()
    @IsNotEmpty()
    optionNameEn!: string;

    @IsString()
    @IsOptional()
    optionNameAr?: string;

    @IsString()
    @IsNotEmpty()
    optionValueEn!: string;

    @IsString()
    @IsOptional()
    optionValueAr?: string;
}

class MoneyDto {
    @IsInt()
    @Min(0)
    amount!: number;

    @IsString()
    @Length(3, 3)
    currencyCode!: CurrencyCode; // cny, qar, etc
}

class WeightDto {
    @IsInt()
    @Min(0)
    amount!: number;

    @IsString()
    @IsNotEmpty()
    unit!: WeightUnit; // kg
}

class DimensionsDto {
    @IsInt()
    @Min(0)
    width!: number;

    @IsInt()
    @Min(0)
    height!: number;

    @IsInt()
    @Min(0)
    length!: number;

    @IsString()
    @IsNotEmpty()
    unit!: DimensionsUnit; // mm
}

class ImportVariantDto {
    @ValidateNested()
    @Type(() => LocalizedTextDto)
    title!: LocalizedTextDto;

    @IsString()
    @IsNotEmpty()
    sku!: string;

    @IsString()
    @IsNotEmpty()
    barcode!: string;

    @IsInt()
    @Min(0)
    quantity!: number;

    @ValidateNested()
    @Type(() => MoneyDto)
    cost!: MoneyDto;

    @ValidateNested()
    @Type(() => WeightDto)
    weight!: WeightDto;

    @ValidateNested()
    @Type(() => DimensionsDto)
    dimensions!: DimensionsDto;

    @IsString()
    @IsNotEmpty()
    imageUrl!: string; // RAW URL from procurement source

    @IsArray()
    @ValidateNested({ each: true })
    @Type(() => ImportVariantAttributeDto)
    @IsOptional()
    attributes?: ImportVariantAttributeDto[];
}

class ImportImageDto {
    @IsString()
    @IsNotEmpty()
    url!: string; // RAW URL from procurement source

    @IsBoolean()
    isFeatured!: boolean; // one should be true
}

export class SaveProcurementToStoreItemDto {
    @IsString()
    @IsNotEmpty()
    externalId!: string;

    @IsString()
    @IsNotEmpty()
    slug!: string; // frontend trims to 62

    @ValidateNested()
    @Type(() => LocalizedTextDto)
    title!: LocalizedTextDto;

    @ValidateNested()
    @Type(() => LocalizedTextDto)
    brief!: LocalizedTextDto;

    @ValidateNested()
    @Type(() => LocalizedTextDto)
    description!: LocalizedTextDto;

    @ValidateNested()
    @Type(() => LocalizedTextDto)
    descriptionHtml!: LocalizedTextDto;

    @IsString()
    @IsOptional()
    shopId?: string;

    @IsString()
    @IsOptional()
    shopName?: string;

    @IsArray()
    @ArrayMinSize(1)
    @IsUUID('4', { each: true })
    categories!: string[];

    @IsUUID()
    warehouseUUID!: string;

    @IsArray()
    @ValidateNested({ each: true })
    @Type(() => ImportOptionDto)
    options!: ImportOptionDto[];

    @IsArray()
    @ArrayMinSize(1)
    @ValidateNested({ each: true })
    @Type(() => ImportVariantDto)
    variants!: ImportVariantDto[];

    @IsArray()
    @ValidateNested({ each: true })
    @Type(() => ImportImageDto)
    images!: ImportImageDto[];
}

// top-level array DTO
export class SaveProcurementToStoreDto {
    @IsArray()
    @ArrayMinSize(1)
    @ValidateNested({ each: true })
    @Type(() => SaveProcurementToStoreItemDto)
    items!: SaveProcurementToStoreItemDto[];
}
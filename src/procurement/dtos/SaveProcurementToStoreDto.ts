import {
    IsArray,
    ArrayMinSize,
    IsBoolean,
    IsNotEmpty,
    IsOptional,
    IsString,
    IsUUID,
    ValidateNested,
    MinLength,
    MaxLength,
    IsNumber,
    IsDefined,
    IsNotEmptyObject,
    IsObject,
    IsUrl,
} from 'class-validator';
import { Type } from 'class-transformer';

import { BriefField, DescriptionField, DescriptionHtmlField, TitleField } from '../../inventory/dtos/CreateProductDto';
import { NameField } from '../../inventory/dtos/CreateCategoryDto';
import { ValueField } from '../../inventory/dtos/CreateProductOptionValueDto';
import { Dimensions, Money, Weight } from '../../inventory/entities/product-variant.entity';

class ImportOptionValueDto {
    @ValidateNested({
        message: 'Option value object is invalid',
    })
    @Type(() => ValueField)
    value: ValueField;

    @IsNumber(
        {},
        {
            message: 'Option value position must be a number',
        },
    )
    position: number;
}

/* -------------------------------------------------------------------------- */
/*                                   OPTIONS                                  */
/* -------------------------------------------------------------------------- */

class ImportOptionDto {
    @ValidateNested({
        message: 'Option name is invalid',
    })
    @Type(() => NameField)
    name: NameField;

    @IsNumber(
        {},
        {
            message: 'Option position must be a number',
        },
    )
    position: number;

    @IsArray({
        message: 'Option values must be an array',
    })
    @ValidateNested({
        each: true,
        message: 'Each option value must be valid',
    })
    @Type(() => ImportOptionValueDto)
    values!: ImportOptionValueDto[];
}

/* -------------------------------------------------------------------------- */
/*                             VARIANT ATTRIBUTES                             */
/* -------------------------------------------------------------------------- */

class ImportVariantAttributeDto {
    @IsString({
        message: 'Variant attribute optionNameEn must be a string',
    })
    @IsNotEmpty({
        message: 'Variant attribute optionNameEn is required',
    })
    optionNameEn!: string;

    @IsOptional()
    @IsString({
        message: 'Variant attribute optionNameAr must be a string',
    })
    optionNameAr?: string;

    @IsString({
        message: 'Variant attribute optionValueEn must be a string',
    })
    @IsNotEmpty({
        message: 'Variant attribute optionValueEn is required',
    })
    optionValueEn!: string;

    @IsOptional()
    @IsString({
        message: 'Variant attribute optionValueAr must be a string',
    })
    optionValueAr?: string;
}

/* -------------------------------------------------------------------------- */
/*                                  VARIANTS                                  */
/* -------------------------------------------------------------------------- */

class ImportVariantDto {
    @ValidateNested({
        message: 'Variant title is invalid',
    })
    @Type(() => TitleField)
    title: TitleField;

    @IsString({
        message: 'Variant SKU must be a string',
    })
    @MinLength(1, {
        message: 'Variant SKU cannot be empty',
    })
    sku: string;

    @IsNumber(
        {},
        {
            message: 'Variant quantity must be a number',
        },
    )
    quantity: number;

    @IsString({
        message: 'Variant barcode must be a string',
    })
    @MinLength(1, {
        message: 'Variant barcode cannot be empty',
    })
    barcode: string;

    @IsDefined({
        message: 'Variant cost is required',
    })
    @IsNotEmptyObject(
        {},
        {
            message: 'Variant cost cannot be empty',
        },
    )
    @IsObject({
        message: 'Variant cost must be an object',
    })
    @ValidateNested({
        message: 'Variant cost object is invalid',
    })
    @Type(() => Money)
    cost: Money;

    @IsDefined({
        message: 'Variant weight is required',
    })
    @IsNotEmptyObject(
        {},
        {
            message: 'Variant weight cannot be empty',
        },
    )
    @IsObject({
        message: 'Variant weight must be an object',
    })
    @ValidateNested({
        message: 'Variant weight object is invalid',
    })
    @Type(() => Weight)
    weight: Weight;

    @IsDefined({
        message: 'Variant dimensions are required',
    })
    @IsNotEmptyObject(
        {},
        {
            message: 'Variant dimensions cannot be empty',
        },
    )
    @IsObject({
        message: 'Variant dimensions must be an object',
    })
    @ValidateNested({
        message: 'Variant dimensions object is invalid',
    })
    @Type(() => Dimensions)
    dimensions: Dimensions;

    @IsArray({
        message: 'Variant optionValues must be an array',
    })
    @IsUUID('4', {
        each: true,
        message:
            'Each variant optionValue must be a valid UUID v4',
    })
    optionValues: Array<string>;

    @IsOptional()
    @IsObject({
        message: 'Variant skuMeta must be an object',
    })
    skuMeta?: Record<string, any>;

    @IsString({
        message: 'Variant imageUrl must be a string',
    })
    @IsNotEmpty({
        message: 'Variant imageUrl is required',
    })
    @IsUrl(
        {},
        {
            message: 'Variant imageUrl must be a valid URL',
        },
    )
    imageUrl!: string;

    @IsOptional()
    @IsArray({
        message: 'Variant attributes must be an array',
    })
    @ValidateNested({
        each: true,
        message: 'Each variant attribute must be valid',
    })
    @Type(() => ImportVariantAttributeDto)
    attributes?: ImportVariantAttributeDto[];
}

/* -------------------------------------------------------------------------- */
/*                                   IMAGES                                   */
/* -------------------------------------------------------------------------- */

class ImportImageDto {
    @IsString({
        message: 'Image URL must be a string',
    })
    @IsNotEmpty({
        message: 'Image URL is required',
    })
    @IsUrl(
        {},
        {
            message: 'Image URL must be valid',
        },
    )
    url!: string;

    @IsBoolean({
        message: 'Image isFeatured must be boolean',
    })
    isFeatured!: boolean;
}

/* -------------------------------------------------------------------------- */
/*                                    ITEM                                    */
/* -------------------------------------------------------------------------- */

export class SaveProcurementToStoreItemDto {
    @IsString({
        message: 'Slug must be a string',
    })
    @MinLength(1, {
        message: 'Slug cannot be empty',
    })
    @MaxLength(64, {
        message: 'Slug cannot exceed 64 characters',
    })
    slug: string;

    @ValidateNested({
        message: 'Title object is invalid',
    })
    @Type(() => TitleField)
    title: TitleField;

    @ValidateNested({
        message: 'Brief object is invalid',
    })
    @Type(() => BriefField)
    brief: BriefField;

    @ValidateNested({
        message: 'Description object is invalid',
    })
    @Type(() => DescriptionField)
    description: DescriptionField;

    @ValidateNested({
        message: 'DescriptionHtml object is invalid',
    })
    @Type(() => DescriptionHtmlField)
    descriptionHtml: DescriptionHtmlField;

    @IsArray({
        message: 'Categories must be an array',
    })
    @IsUUID('4', {
        each: true,
        message: 'Each category must be a valid UUID v4',
    })
    categories: Array<string>;

    @IsOptional()
    @IsString({
        message: 'shopId must be a string',
    })
    shopId?: string;

    @IsOptional()
    @IsString({
        message: 'shopName must be a string',
    })
    shopName?: string;

    @IsString({
        message: 'externalId must be a string',
    })
    externalId: string;

    @IsUUID('4', {
        message: 'warehouseUUID must be a valid UUID v4',
    })
    warehouseUUID!: string;

    @IsArray({
        message: 'Options must be an array',
    })
    @ValidateNested({
        each: true,
        message: 'Each option must be valid',
    })
    @Type(() => ImportOptionDto)
    options!: ImportOptionDto[];

    @IsArray({
        message: 'Variants must be an array',
    })
    @ArrayMinSize(1, {
        message: 'At least one variant is required',
    })
    @ValidateNested({
        each: true,
        message: 'Each variant must be valid',
    })
    @Type(() => ImportVariantDto)
    variants!: ImportVariantDto[];

    @IsArray({
        message: 'Images must be an array',
    })
    @ValidateNested({
        each: true,
        message: 'Each image must be valid',
    })
    @Type(() => ImportImageDto)
    images!: ImportImageDto[];
}

/* -------------------------------------------------------------------------- */
/*                               TOP LEVEL DTO                                */
/* -------------------------------------------------------------------------- */

export class SaveProcurementToStoreDto {
    @IsArray({
        message: 'Items must be an array',
    })
    @ArrayMinSize(1, {
        message: 'At least one item is required',
    })
    @ValidateNested({
        each: true,
        message: 'Each item must be valid',
    })
    @Type(() => SaveProcurementToStoreItemDto)
    items!: SaveProcurementToStoreItemDto[];
}
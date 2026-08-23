import {
  ArrayUnique,
  IsArray,
  IsEnum,
  IsOptional,
  IsString,
  IsUUID,
  Min,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';

import { CurrencyCode } from '../../inventory/enums/CurrencyCode.enum';

export class AddBundleToCartSelectionItemDto {
  @IsOptional()
  @IsUUID('4')
  productUuid?: string;

  @IsOptional()
  @IsUUID('4')
  variantUuid?: string;
}

export class AddBundleToCartDto {
  @IsUUID('4')
  bundleUuid: string;

  @IsString()
  @IsEnum(CurrencyCode)
  currency: CurrencyCode;

  @IsOptional()
  @IsString()
  countryCode?: string;

  @IsOptional()
  @Min(1)
  quantity?: number;

  @IsOptional()
  @IsArray()
  @ArrayUnique((item: AddBundleToCartSelectionItemDto) =>
    `${item.productUuid ?? 'none'}:${item.variantUuid ?? 'none'}`,
  )
  @ValidateNested({ each: true })
  @Type(() => AddBundleToCartSelectionItemDto)
  items?: Array<AddBundleToCartSelectionItemDto>;
}

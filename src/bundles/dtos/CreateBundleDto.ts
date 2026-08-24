import {
  ArrayUnique,
  IsArray,
  IsBoolean,
  IsEnum,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  Matches,
  Max,
  MaxLength,
  Min,
  MinLength,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import { CurrencyCode } from '../../inventory/enums/CurrencyCode.enum';
import { BundleDiscountType, BundleMode } from '../entities/bundle.entity';

export class TitleField {
  @IsString()
  @MinLength(1)
  en: string;

  @IsString()
  @MinLength(1)
  ar: string;
}

export class BriefField {
  @IsOptional()
  @IsString()
  @MaxLength(256)
  en?: string;

  @IsOptional()
  @IsString()
  @MaxLength(256)
  ar?: string;
}

export class BundleItemInputDto {
  @IsOptional()
  @IsUUID('4')
  productUuid?: string;

  @IsOptional()
  @IsUUID('4')
  variantUuid?: string;

  @IsNumber()
  @Min(1)
  quantity: number;
}

export class CreateBundleDto {
  @ValidateNested()
  @Type(() => TitleField)
  title: TitleField;

  @IsOptional()
  @ValidateNested()
  @Type(() => BriefField)
  brief?: BriefField;

  @IsString()
  @MinLength(1)
  @MaxLength(64)
  slug: string;

  @IsEnum(BundleDiscountType)
  discountType: BundleDiscountType;

  @IsOptional()
  @IsEnum(BundleMode)
  mode?: BundleMode;

  @IsOptional()
  @IsNumber()
  @Min(0)
  flatPriceValue?: number;

  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(99)
  discountPercentage?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  discountAmountValue?: number;

  @IsOptional()
  @IsEnum(CurrencyCode)
  amountCurrencyCode?: CurrencyCode;

  @IsBoolean()
  isActive: boolean;

  @IsOptional()
  @IsUUID('4')
  anchorProductUuid?: string;

  @IsOptional()
  @IsArray()
  @ArrayUnique()
  @IsUUID('4', { each: true })
  sourceCategoryUuids?: Array<string>;

  @IsOptional()
  @IsNumber()
  @Min(1)
  autoFillCount?: number;

  @IsOptional()
  @IsNumber()
  @Min(2)
  minimumSelectionCount?: number;

  @IsString()
  @MinLength(1)
  @Matches(
    /^\d{4}-\d{2}-\d{2}(T\d{2}:\d{2}(:\d{2}(\.\d{3})?)?(Z|[+-]\d{2}:\d{2})?)?$/,
  )
  startsAt: string;

  @IsString()
  @MinLength(1)
  @Matches(
    /^\d{4}-\d{2}-\d{2}(T\d{2}:\d{2}(:\d{2}(\.\d{3})?)?(Z|[+-]\d{2}:\d{2})?)?$/,
  )
  finishesAt: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => BundleItemInputDto)
  items: Array<BundleItemInputDto>;
}

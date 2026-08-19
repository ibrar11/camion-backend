import { IsEnum, IsOptional, IsString, IsUUID, Min } from 'class-validator';

import { CurrencyCode } from '../../inventory/enums/CurrencyCode.enum';

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
}

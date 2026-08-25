import { Type } from "class-transformer";
import {
	IsEnum,
	IsOptional,
	IsString,
	IsUUID,
	MaxLength,
	MinLength,
} from "class-validator";

import { ProductReportReason } from "../enums/ProductReportReason.enum";

export class CreateProductReportDto {
	@IsUUID("4")
	productUuid: string;

	@IsEnum(ProductReportReason)
	reason: ProductReportReason;

	@Type(() => String)
	@IsString()
	@MinLength(10)
	@MaxLength(1024)
	details: string;

	@IsOptional()
	@Type(() => String)
	@IsString()
	@MaxLength(128)
	orderNumber?: string;
}

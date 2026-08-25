import { Type } from "class-transformer";
import {
	IsEnum,
	IsOptional,
	IsString,
	MaxLength,
} from "class-validator";

import { ProductReportStatus } from "../enums/ProductReportStatus.enum";

export class UpdateProductReportStatusDto {
	@IsEnum(ProductReportStatus)
	status: ProductReportStatus;

	@IsOptional()
	@Type(() => String)
	@IsString()
	@MaxLength(1024)
	adminNote?: string;
}

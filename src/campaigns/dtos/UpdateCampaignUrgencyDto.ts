import {
	IsBoolean,
	IsInt,
	IsOptional,
	Min,
} from "class-validator";

import { Type } from "class-transformer";

export class UpdateCampaignUrgencyDto {
	@IsBoolean()
	enabled: boolean;

	@IsOptional()
	@Type(() => Number)
	@IsInt()
	@Min(0)
	minStockCount?: number;

	@IsOptional()
	@Type(() => Number)
	@IsInt()
	@Min(0)
	maxStockCount?: number;
}

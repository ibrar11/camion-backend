import {
	IsBoolean,
	IsInt,
	IsOptional,
	Min,
} from "class-validator";

import { Type } from "class-transformer";

export class UpdateProductUrgencyDto {
	@IsBoolean()
	enabled: boolean;

	@IsOptional()
	@Type(() => Number)
	@IsInt()
	@Min(0)
	stockCount?: number;
}

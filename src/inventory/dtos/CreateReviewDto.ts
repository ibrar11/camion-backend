import { Type } from "class-transformer";
import {
	IsInt,
	IsOptional,
	IsString,
	IsUUID,
	Max,
	MaxLength,
	Min,
	MinLength,
} from "class-validator";

export class CreateReviewDto {
	@IsOptional()
	@IsUUID('4')
	orderUuid?: string;

	@Type(() => Number)
	@IsInt()
	@Min(1)
	@Max(5)
	rating: number;

	@Type(() => String)
	@IsString()
	@MinLength(1)
	@MaxLength(512)
	comment: string;
}

import {
	IsNumber,
	IsString,
	Max,
	MaxLength,
	Min,
	MinLength,
} from "class-validator";

export class UpdateReviewDto {
	@IsNumber()
	@Min(1)
	@Max(5)
	rating: number;

	@IsString()
	@MinLength(1)
	@MaxLength(512)
	comment: string;
}

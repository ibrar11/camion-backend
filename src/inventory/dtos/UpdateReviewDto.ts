import {
	IsNumber,
	IsString,
	MaxLength,
	MinLength,
} from "class-validator";

export class UpdateReviewDto {
	@IsNumber()
	rating: number;

	@IsString()
	@MinLength(1)
	@MaxLength(512)
	comment: string;
}

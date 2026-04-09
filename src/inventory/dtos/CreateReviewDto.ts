import {
	IsNumber,
	IsString,
	Max,
	MaxLength,
	Min,
} from "class-validator";

export class CreateReviewDto {
	@IsNumber()
	@Min(1)
	@Max(5)
	rating: number;

	@IsString()
	@MaxLength(512)
	comment: string;
}

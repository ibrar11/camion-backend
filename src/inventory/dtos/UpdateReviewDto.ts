import {
	IsNumber,
	IsString,
	MaxLength,
} from "class-validator";

export class UpdateReviewDto {
	@IsNumber()
	rating: number;

	@IsString()
	@MaxLength(512)
	comment: string;
}

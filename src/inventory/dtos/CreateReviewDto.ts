import {
	IsNumber,
	IsString,
	MaxLength,
} from "class-validator";

export class CreateReviewDto {
	@IsNumber()
	rating: number;

	@IsString()
	@MaxLength(512)
	comment: string;
}

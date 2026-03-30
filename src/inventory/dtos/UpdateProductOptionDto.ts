import {
	IsNumber,
	IsString,
	MaxLength,
	MinLength,
} from "class-validator";

export class UpdateProductOptionDto {
	@IsString()
	@MinLength(2, { message: "Option name must be at least 2 characters long" })
	@MaxLength(64, { message: "Option name must be maximum 64 characters long" })
	name: string;

	@IsNumber()
	position: number;
}

import {
	IsNumber,
	IsString,
	MaxLength,
	MinLength,
} from "class-validator";

export class CreateProductOptionValueDto {
	@IsString()
	@MinLength(2, { message: "Option value must be at least 2 characters long" })
	@MaxLength(64, { message: "Option value must be maximum 64 characters long" })
	value: string;

	@IsNumber()
	position: number;
}

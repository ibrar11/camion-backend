import {
	IsBoolean,
	IsNumber,
	IsString,
	MaxLength,
	MinLength,
} from "class-validator";

export class UpdateProductVariantImageDto {
	@IsString()
	@MinLength(1)
	@MaxLength(128, { message: "Please add alternative text for this image." })
	alt: string;

	@IsNumber()
	position: number;

	@IsBoolean()
	isFeatured: boolean;
}

import {
	IsBoolean,
	IsNumber,
	IsString,
	MaxLength,
} from "class-validator";

export class UpdateProductVariantImageDto {
	@IsString()
	@MaxLength(128, { message: "Please add alternative text for this image." })
	alt: string;

	@IsNumber()
	position: number;

	@IsBoolean()
	isFeatured: boolean;
}

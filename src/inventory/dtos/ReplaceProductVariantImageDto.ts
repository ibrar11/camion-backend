import {
	IsString,
	MinLength,
} from "class-validator";

export class ReplaceProductVariantImageDto {
	@IsString()
	@MinLength(1)
	key: string;
}

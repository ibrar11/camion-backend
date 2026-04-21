import {
	IsString,
	MaxLength,
	MinLength,
} from "class-validator";

export class UpdatePromoDto {
	@IsString()
	@MinLength(1)
	@MaxLength(64)
	name: string;

	@IsString()
	@MinLength(1)
	@MaxLength(256)
	text: string;

	@IsString()
	@MinLength(1)
	@MaxLength(256)
	callToActionText: string;

	@IsString()
	@MinLength(1)
	@MaxLength(256)
	callToActionLink: string;
}

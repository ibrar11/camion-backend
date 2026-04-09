import {
	IsBoolean,
	IsString,
	ValidateNested,
} from "class-validator";

export class TitleField {
	@IsString()
	en: string;

	@IsString()
	ar: string;
}

export class UpdateBannerDto {
	@ValidateNested()
	title: TitleField;

	@IsString()
	linkUrl: string;

	@IsBoolean()
	isActive: boolean;

	@IsString()
	placement: string;
}

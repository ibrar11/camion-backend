import {
	IsBoolean,
	IsString,
	MinLength,
	ValidateNested,
} from "class-validator";

export class TitleField {
	@IsString()
	@MinLength(1)
	en: string;

	@IsString()
	@MinLength(1)
	ar: string;
}

export class LinkUrlField {
	@IsString()
	@MinLength(1)
	en: string;

	@IsString()
	@MinLength(1)
	ar: string;
}

export class UpdateBannerDto {
	@ValidateNested()
	title: TitleField;

	@ValidateNested()
	linkUrl: LinkUrlField;

	@IsBoolean()
	isActive: boolean;

	@IsString()
	@MinLength(1)
	placement: string;

	@IsString()
	@MinLength(1)
	color: string;
}

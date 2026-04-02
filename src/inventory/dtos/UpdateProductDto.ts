import {
	IsArray,
	IsString,
	IsUUID,
	MaxLength,
	ValidateNested,
} from "class-validator";

export class TitleField {
	@IsString()
	@MaxLength(128)
	ar: string;

	@IsString()
	@MaxLength(128)
	en: string;
}

export class BriefField {
	@IsString()
	@MaxLength(256)
	ar: string;

	@IsString()
	@MaxLength(256)
	en: string;
}

export class DescriptionField {
	@IsString()
	@MaxLength(1024)
	ar: string;

	@IsString()
	@MaxLength(1024)
	en: string;
}

export class DescriptionHtmlField {
	@IsString()
	ar: string;

	@IsString()
	en: string;
}

export class UpdateProductDto {
	@ValidateNested()
	title: TitleField;

	@ValidateNested()
	brief: BriefField;

	@ValidateNested()
	description: DescriptionField;

	@ValidateNested()
	descriptionHtml: DescriptionHtmlField;

	@IsArray()
	@IsUUID('4', { each: true, })
	categories: Array<string>;
}

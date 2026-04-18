import {
	IsArray,
	IsString,
	IsUUID,
	MaxLength,
	MinLength,
	ValidateNested,
} from "class-validator";

export class TitleField {
	@IsString()
	@MinLength(1)
	@MaxLength(128)
	ar: string;

	@IsString()
	@MinLength(1)
	@MaxLength(128)
	en: string;
}

export class BriefField {
	@IsString()
	@MinLength(1)
	@MaxLength(256)
	ar: string;

	@IsString()
	@MinLength(1)
	@MaxLength(256)
	en: string;
}

export class DescriptionField {
	@IsString()
	@MinLength(1)
	@MaxLength(1024)
	ar: string;

	@IsString()
	@MinLength(1)
	@MaxLength(1024)
	en: string;
}

export class DescriptionHtmlField {
	@IsString()
	@MinLength(1)
	ar: string;

	@IsString()
	@MinLength(1)
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

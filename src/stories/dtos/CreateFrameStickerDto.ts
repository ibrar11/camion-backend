import {
	IsEnum,
	IsNumber,
	IsString,
	Max,
	MaxLength,
	Min,
	MinLength,
	ValidateNested,
} from "class-validator";

import { StoryStickerType } from "../enums/StoryStickerType.enum";

export class TextField {
	@IsString()
	@MinLength(1)
	@MaxLength(256)
	en: string;

	@IsString()
	@MinLength(1)
	@MaxLength(256)
	ar: string;
}

export class QuestionField {
	@IsString()
	@MinLength(1)
	@MaxLength(256)
	en: string;

	@IsString()
	@MinLength(1)
	@MaxLength(256)
	ar: string;
}

export class OptionField {
	@IsString()
	@MinLength(1)
	@MaxLength(256)
	en: string;

	@IsString()
	@MinLength(1)
	@MaxLength(256)
	ar: string;
}

export class EmojiSticker {
	@IsString()
	@MinLength(1)
	emoji: string;
}

export class LinkSticker {
	@IsString()
	@MinLength(1)
	@MaxLength(256)
	link: string;
}

export class PollSticker {
	@ValidateNested()
	question: QuestionField;

	@ValidateNested({ each: true, })
	options: Array<OptionField>;
}

export class TextSticker {
	@ValidateNested()
	text: TextField;

	@IsString()
	@MinLength(1)
	fontFamily: string;

	@IsString()
	@MinLength(1)
	color: string;
}

export class CreateFrameStickerDto {
	@IsString()
	@IsEnum(StoryStickerType)
	type: StoryStickerType;

	@IsNumber()
	@Min(0)
	x: number;

	@IsNumber()
	@Min(0)
	y: number;

	@IsNumber()
	@Min(0)
	@Max(100)
	scale: number;

	@IsNumber()
	@Min(0)
	@Max(359)
	rotation: number;

	@ValidateNested()
	emoji: EmojiSticker;

	@ValidateNested()
	link: LinkSticker;

	@ValidateNested()
	poll: PollSticker;

	@ValidateNested()
	text: TextSticker;
}

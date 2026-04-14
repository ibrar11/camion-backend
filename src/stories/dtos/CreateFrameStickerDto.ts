import {
	IsEnum,
	IsNumber,
	IsString,
	Max,
	MaxLength,
	Min,
	ValidateNested,
} from "class-validator";

import { StoryStickerType } from "../enums/StoryStickerType.enum";

export class TextField {
	@IsString()
	@MaxLength(256)
	en: string;

	@IsString()
	@MaxLength(256)
	ar: string;
}

export class QuestionField {
	@IsString()
	@MaxLength(256)
	en: string;

	@IsString()
	@MaxLength(256)
	ar: string;
}

export class OptionField {
	@IsString()
	@MaxLength(256)
	en: string;

	@IsString()
	@MaxLength(256)
	ar: string;
}

export class EmojiSticker {
	@IsString()
	emoji: string;
}

export class LinkSticker {
	@IsString()
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
	fontFamily: string;

	@IsString()
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

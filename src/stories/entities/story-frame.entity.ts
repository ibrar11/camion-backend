import {
	ObjectType,
	Field,
	Int,
} from "@nestjs/graphql";

import {
	Column,
	CreateDateColumn,
	Entity,
	Index,
	ManyToOne,
	PrimaryGeneratedColumn,
	UpdateDateColumn,
} from "typeorm";

import { Exclude } from "class-transformer";

import { StoryMediaType } from "../enums/StoryMediaType.enum";
import { StoryStickerType } from "../enums/StoryStickerType.enum";

import { Story } from "./story.entity";

@ObjectType()
export class EmojiElement {
	@Field()
	content: string;
}

@ObjectType()
export class LinkElement {
	@Field()
	content: string;
}

@ObjectType()
export class PollOptionElement {
	@Field()
	en: string;

	@Field()
	ar: string;
}

@ObjectType()
export class PollElement {
	@Field()
	question: string;

	@Field()
	questionAr: string;

	@Field(() => PollOptionElement)
	options: Array<{
		en: string;
		ar: string;
	}>;
}

@ObjectType()
export class TextElement {
	@Field()
	en: string;

	@Field()
	ar: string;
}

@ObjectType()
export class StorySticker {
	@Field()
	type: StoryStickerType;

	@Field(() => Int)
	x: number;

	@Field(() => Int)
	y: number;

	@Field(() => Int)
	scale: number;

	@Field(() => Int)
	rotation: number;

	@Field(() => EmojiElement)
	emoji?: {
		content: string;
	};

	@Field(() => LinkElement)
	link?: {
		content: string;
	}

	@Field(() => PollElement)
	poll: {
		question: string;
		questionAr: string;
		options: Array<{
			en: string;
			ar: string;
		}>;
	};

	@Field(() => TextElement)
	text?: {
		en: string;
		ar: string;
	};
}

@ObjectType()
@Entity({ name: "story_frames" })
export class StoryFrame {
	@Exclude()
	@PrimaryGeneratedColumn()
	id: number;

	@Field()
	@Column({ type: "uuid", nullable: false, unique: true, })
	uuid: string;

	@ManyToOne(() => Story, (story) => story.frames, { onDelete: "CASCADE", })
	@Index()
	story: Story;

	@Field()
	@Column({
		type: "enum",
		enum: StoryMediaType,
	})
	mediaType: StoryMediaType;

	@Field()
	@Column({ type: "varchar", length: 256, })
	mediaUrl: string;

	@Field()
	@Column({ type: "varchar", length: 256, })
	thumbnailUrl: string;

	@Field(() => Int)
	@Column({ type: "integer", default: 5, })
	duration: number;

	@Field(() => Int)
	@Column({ type: "integer", default: 0, })
	order: number;

	@Field(() => [StorySticker])
	@Column({ type: "jsonb", default: () => "'[]'" })
	stickers: Array<StorySticker>;

	@Exclude()
	@UpdateDateColumn({
		name: "updated_at",
		type: "timestamptz",
	})
	updatedAt: Date;

	@Exclude()
	@CreateDateColumn({
		name: "created_at",
		type: "timestamptz",
	})
	createdAt: Date;
}

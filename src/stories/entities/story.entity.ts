import {
	ObjectType,
	Field,
	Int,
} from "@nestjs/graphql";

import {
	Column,
	CreateDateColumn,
	Entity,
	OneToMany,
	PrimaryGeneratedColumn,
	UpdateDateColumn,
} from "typeorm";

import { Exclude } from "class-transformer";

import { StoryFrame } from "./story-frame.entity";

@ObjectType()
@Entity({ name: "stories", })
export class Story {
	@Exclude()
	@PrimaryGeneratedColumn()
	id: number;

	@Field()
	@Column({ type: "uuid", nullable: false, unique: true, })
	uuid: string;

	@Field(() => String, { name: "caption", })
	caption: string;

	@Field()
	@Column({ type: "varchar", length: 256, })
	captionEn: string;

	@Field()
	@Column({ type: "varchar", length: 256, })
	captionAr: string;

	@Field()
	@Column({ type: "boolean", default: false, })
	isHighlighted: boolean;

	@Field(() => Int)
	@Column({ type: "integer", default: 0, })
	viewsCount: number;

	@Field(() => [StoryFrame])
	@OneToMany(() => StoryFrame, (frame) => frame.story, { cascade: true, })
	frames: Array<StoryFrame>;

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

import { Field, ObjectType } from "@nestjs/graphql";

import {
	Column,
	CreateDateColumn,
	Entity,
	PrimaryGeneratedColumn,
	UpdateDateColumn,
} from "typeorm";

import { Exclude } from "class-transformer";

@ObjectType()
@Entity({ name: "promos", })
export class Promo {
	@Exclude()
	@PrimaryGeneratedColumn()
	id: number;

	@Field()
	@Column({ type: "uuid", nullable: false, unique: true, })
	uuid: string;

	@Field()
	@Column({ type: "varchar", length: 32, unique: true, nullable: false, })
	name: string;

	@Field()
	@Column({ type: "text", nullable: false, })
	text: string;

	@Field()
	@Column({ type: "varchar", length: 256, nullable: false, })
	callToActionText: string;

	@Field()
	@Column({ type: "varchar", length: 256, nullable: false, })
	callToActionLink: string;

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

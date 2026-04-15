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
@Entity({ name: "languages" })
export class Language {
	@Exclude()
	@PrimaryGeneratedColumn()
	id: number;

	@Field()
	@Column({ type: "uuid", nullable: false, unique: true })
	uuid: string;

	@Field()
	@Column({ nullable: false, unique: true })
	name: string;

	@Field()
	@Column({ name: "short_code", nullable: false, unique: true, length: 10 })
	shortCode: string;

	@Field()
	@CreateDateColumn({ name: "created_at", type: "timestamptz" })
	createdAt: Date;

	@Field()
	@UpdateDateColumn({ name: "updated_at", type: "timestamptz" })
	updatedAt: Date;
}

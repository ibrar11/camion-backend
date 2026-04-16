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
@Entity({ name: "currencies" })
export class Currency {
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
	@Column({ name: "alpha_code", nullable: false, unique: true })
	alphaCode: string;

	@Field()
	@CreateDateColumn({ name: "created_at", type: "timestamptz" })
	createdAt: Date;

	@Field()
	@UpdateDateColumn({ name: "updated_at", type: "timestamptz" })
	updatedAt: Date;
}

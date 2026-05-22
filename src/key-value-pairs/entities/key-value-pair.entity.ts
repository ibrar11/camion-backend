import { Exclude } from "class-transformer";
import { Column, Entity, PrimaryGeneratedColumn } from "typeorm";
import { KeyValuePairType } from "../enums/KeyValuePairType.enum";
import { Field, Int, ObjectType } from "@nestjs/graphql";

@ObjectType()
@Entity({ name: "key_value_pairs" })
export class KeyValuePair {
	@Exclude()
	@PrimaryGeneratedColumn()
	id: number;

	@Field(() => String)
	@Column({ type: "uuid", nullable: false, unique: true, })
	uuid: string;

	@Field(() => String)
	@Column({ type: "varchar", length: 32, unique: true, nullable: false, })
	name: string;

	@Field(() => String)
	@Column({
		type: "enum",
		enum: KeyValuePairType,
		default: KeyValuePairType.String,
	})
	type: KeyValuePairType;

	@Field(() => Int)
	@Column({ type: "integer", default: 0, })
	integerValue: number;

	@Field(() => Number)
	@Column({ type: "numeric", default: 0, })
	decimalValue: number;

	@Field(() => String)
	@Column({ type: "varchar", length: 256, default: "", })
	stringValue: string;

	@Field(() => Boolean)
	@Column({ type: "boolean", default: false, })
	booleanValue: boolean;

	@Field(() => Boolean)
	@Column({ type: "boolean", default: false, })
	sensitive: boolean;
}

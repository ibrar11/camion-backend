import { Exclude } from "class-transformer";
import { Column, Entity, PrimaryGeneratedColumn } from "typeorm";
import { KeyValuePairType } from "../enums/KeyValuePairType.enum";

@Entity({ name: "key_value_pairs" })
export class KeyValuePair {
	@Exclude()
	@PrimaryGeneratedColumn()
	id: number;

	@Column({ type: "uuid", nullable: false, unique: true, })
	uuid: string;

	@Column({ type: "varchar", length: 32, unique: true, nullable: false, })
	name: string;

	@Column({
		type: "enum",
		enum: KeyValuePairType,
		default: KeyValuePairType.String,
	})
	type: KeyValuePairType;

	@Column({ type: "integer", default: 0, })
	integerValue: number;

	@Column({ type: "numeric", default: 0, })
	decimalValue: number;

	@Column({ type: "varchar", length: 256, default: "", })
	stringValue: string;

	@Column({ type: "boolean", default: false, })
	booleanValue: boolean;
}

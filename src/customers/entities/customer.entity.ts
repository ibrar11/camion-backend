import {
	Column,
	CreateDateColumn,
	Entity,
	PrimaryGeneratedColumn,
	UpdateDateColumn,
} from "typeorm";

import { Exclude } from "class-transformer";

@Entity()
export class Customer {
	@Exclude()
	@PrimaryGeneratedColumn()
	id: number;

	@Column({ type: "uuid", nullable: false, unique: true, })
	uuid: string;

	@Column({ type: "varchar", length: 64, })
	fullName: string;

	@Exclude()
	@Column({ type: "varchar", length: 256, nullable: true, unique: true, })
	emailAddress: string | null;

	@Exclude()
	@Column({ type: "varchar", length: 16, nullable: true, unique: true, })
	phoneNumber: string | null;

	@Exclude()
	@Column({ type: "varchar", nullable: false, length: 64, })
	password: string;

	@Exclude()
	@Column({ type: "varchar", length: 64, default: "", })
	secret: string;

	@Exclude()
	@Column({ type: "boolean", default: false, })
	isEmailAddressVerified: boolean;

	@Exclude()
	@Column({ type: "boolean", default: false, })
	isPhoneNumberVerified: boolean;

	@Column({ type: "boolean", default: true, })
	isActive: boolean;

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

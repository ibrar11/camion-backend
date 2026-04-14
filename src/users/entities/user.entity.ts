import {
	Column,
	CreateDateColumn,
	Entity,
	PrimaryGeneratedColumn,
	UpdateDateColumn,
} from "typeorm";

import { Exclude } from "class-transformer";

import { UserRole } from "../enums/UserRole";

@Entity({ name: "users", })
export class User {
	@Exclude()
	@PrimaryGeneratedColumn()
	id: number;

	@Column({ type: "uuid", nullable: false, unique: true, })
	uuid: string;

	@Column({ type: "varchar", length: 64, })
	fullName: string;

	@Exclude()
	@Column({ type: "varchar", length: 256, nullable: false, unique: true, })
	emailAddress: string;

	@Exclude()
	@Column({ type: "varchar", nullable: false, length: 64, })
	password: string;

	@Exclude()
	@Column({ type: "varchar", length: 64, default: "", })
	secret: string;

	@Column({
		type: "enum",
		enum: UserRole,
		default: UserRole.User,
	})
	role: UserRole;

	@Exclude()
	@Column({ type: "boolean", default: false, })
	isEmailAddressVerified: boolean;

	@Column({ type: "boolean", default: false, })
	isMfaEnabled: boolean;

	@Column({ type: "boolean", default: false, })
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

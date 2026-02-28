import { Entity, Column, PrimaryGeneratedColumn } from "typeorm";

@Entity()
export class User {
	@PrimaryGeneratedColumn()
	id: number;

	@Column({ type: "varchar", length: 64, })
	fullName: string;

	@Column({ type: "varchar", length: 256, unique: true, })
	emailAddress: string;

	@Column({ type: "varchar", length: 16, unique: true, })
	phoneNumber: string;

	@Column({ type: "varchar", length: 64, })
	password: string;

	@Column({ type: "boolean", default: true, })
	isActive: boolean;
}

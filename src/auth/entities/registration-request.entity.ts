import {
	Column,
	CreateDateColumn,
	Entity,
	PrimaryGeneratedColumn,
	UpdateDateColumn,
} from "typeorm";

@Entity()
export class RegistrationRequest {
	@PrimaryGeneratedColumn()
	id: number;

	@Column({ type: "uuid", unique: true, })
	uuid: string;

	@Column({ type: "varchar", length: 256, nullable: true, unique: true, })
	emailAddress: string;

	@Column({ type: "varchar", length: 20, nullable: true, unique: true, })
	phoneNumber: string;

	@Column({ type: "varchar", length: 64, default: "", })
	secret: string;

	@Column({ type: "boolean", default: false, })
	isEmailAddressVerified: boolean;

	@Column({ type: "boolean", default: false, })
	isPhoneNumberVerified: boolean;

	@UpdateDateColumn({
		name: "updated_at",
		type: "timestamptz",
	})
	updatedAt: Date;

	@CreateDateColumn({
		name: "created_at",
		type: "timestamptz",
	})
	createdAt: Date;
}

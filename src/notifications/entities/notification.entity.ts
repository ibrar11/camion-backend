import { Field, ObjectType } from "@nestjs/graphql";
import {
	Entity,
	PrimaryGeneratedColumn,
	Column,
	CreateDateColumn,
	UpdateDateColumn,
	ManyToOne,
} from "typeorm";
import { Exclude } from "class-transformer";
import { NotificationType } from "../enums/notification-type.enum";
import { NotificationPriority } from "../enums/notification-priority.enum";
import { Customer } from "../../customers/entities/customer.entity";

@ObjectType()
@Entity({ name: "notifications" })
export class Notification {
	@Exclude()
	@PrimaryGeneratedColumn()
	id: number;

	@Field()
	@Column({ type: "uuid", unique: true })
	uuid: string;

	@ManyToOne(() => Customer, { nullable: false })
	customer: Customer;

	@Field()
	@Column({
		type: "enum",
		enum: NotificationType,
	})
	type: NotificationType;

	@Field()
	@Column()
	title: string;

	@Field()
	@Column()
	brief: string;

	@Field()
	@Column("text")
	message: string;

	@Field(() => String)
	@Column({ type: "jsonb", nullable: true })
	payload: Record<string, any>;

	@Field()
	@Column({
		type: "enum",
		enum: NotificationPriority,
		default: NotificationPriority.MEDIUM,
	})
	priority: NotificationPriority;

	@Field()
	@Column({ default: false })
	isRead: boolean;

	@Field()
	@CreateDateColumn({ type: "timestamptz" })
	createdAt: Date;

	@Field()
	@UpdateDateColumn({ type: "timestamptz" })
	updatedAt: Date;
}

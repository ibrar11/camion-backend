import { Field, ObjectType } from "@nestjs/graphql";
import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    CreateDateColumn,
    UpdateDateColumn,
    OneToMany,
} from "typeorm";
import { Exclude } from "class-transformer";
import { NotificationPriority } from "../enums/notification-priority.enum";
import { PushNotificationImage } from "./push-notification-image";
import { NotificationScheduler } from "../enums/notification-scheduler.enum";
import { NotificationStatus } from "../enums/notification-status.enum";

@Entity({ name: "push_notification" })
export class PushNotification {
    @Exclude()
    @PrimaryGeneratedColumn()
    id: number;

    @Column({ type: "uuid", unique: true })
    uuid: string;

    @Column()
    title: string;

    @Column()
    brief: string;

    @Column("text")
    message: string;

    @Column({ type: "varchar", length: 256, nullable: true, })
    imageUrl: string;

    @Column({
        type: "enum",
        enum: NotificationPriority,
        default: NotificationPriority.MEDIUM,
    })
    priority: NotificationPriority;

    @OneToMany(() => PushNotificationImage, (image) => image.pushNotification, { cascade: true, })
    images: Array<PushNotificationImage>;

    @Column({ type: "timestamptz", default: null, nullable: true, })
    scheduledFor: Date | null;

    @Column({
        type: "enum",
        enum: NotificationScheduler,
        nullable: true,
        default: null,
    })
    repeatInterval: NotificationScheduler | null

    @Column({
        type: "enum",
        enum: NotificationStatus,
        default: NotificationStatus.PENDING,
    })
    status: NotificationStatus;

    @Column({
        type: "timestamptz",
        nullable: true,
    })
    processingStartedAt?: Date | null;

    @Column({ default: false })
    isRead: boolean;

    @CreateDateColumn({ type: "timestamptz" })
    createdAt: Date;

    @UpdateDateColumn({ type: "timestamptz" })
    updatedAt: Date;
}

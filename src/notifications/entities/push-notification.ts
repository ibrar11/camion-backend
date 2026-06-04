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
import { NotificationType } from "../enums/notification-type.enum";
import { NotificationPriority } from "../enums/notification-priority.enum";
import { PushNotificationImage } from "./push-notification-image";

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

    @Column({ default: false })
    isRead: boolean;

    @CreateDateColumn({ type: "timestamptz" })
    createdAt: Date;

    @UpdateDateColumn({ type: "timestamptz" })
    updatedAt: Date;
}

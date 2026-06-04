import { Field, ObjectType } from "@nestjs/graphql";

import {
    Column,
    CreateDateColumn,
    Entity,
    Index,
    ManyToOne,
    PrimaryGeneratedColumn,
    UpdateDateColumn,
} from "typeorm";

import { Exclude } from "class-transformer";

import { PushNotification } from "./push-notification";


@Entity({ name: "push_notification_images" })
export class PushNotificationImage {
    @Exclude()
    @PrimaryGeneratedColumn()
    id: number;

    @Column({ type: "uuid", nullable: false, unique: true, })
    uuid: string;

    @ManyToOne(() => PushNotification, (pushNotification) => pushNotification.images, { onDelete: "CASCADE" })
    @Index()
    pushNotification: PushNotification;

    @Column({ type: "varchar", length: 256, nullable: true, })
    imageUrl: string;

    @Column({ type: "varchar", length: 256, nullable: true, })
    thumbnailUrl: string;

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

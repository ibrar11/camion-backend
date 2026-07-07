import { IsEnum, IsNotEmpty, IsOptional, IsString, MaxLength, MinLength } from "class-validator";
import { NotificationPriority } from "../enums/notification-priority.enum";
import { NotificationScheduler } from "../enums/notification-scheduler.enum";

export class UpdateCustomizePushNotificationDto {
    @IsString()
    @IsNotEmpty()
    @MinLength(1)
    @MaxLength(100)
    title: string;

    @IsString()
    @IsNotEmpty()
    @MinLength(1)
    @MaxLength(160)
    brief: string;

    @IsString()
    @IsNotEmpty()
    @MinLength(1)
    message: string;

    @IsOptional()
    @IsEnum(NotificationPriority)
    priority?: NotificationPriority;

    @IsString()
    @IsOptional()
    @IsEnum(NotificationScheduler)
    scheduledFor?: NotificationScheduler;
}

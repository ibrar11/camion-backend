import { IsDateString, IsEnum, IsNotEmpty, IsOptional, IsString, MaxLength, MinLength } from "class-validator";
import { NotificationPriority } from "../enums/notification-priority.enum";
import { NotificationScheduler } from "../enums/notification-scheduler.enum";

export class CreateCustomizePushNotificationDto {
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

    /**
     * Absolute ISO 8601 datetime for a one-time scheduled push. Mutually
     * exclusive with `scheduledFor` (which selects a recurring interval).
     */
    @IsString()
    @IsOptional()
    @IsDateString()
    scheduledAt?: string;
}
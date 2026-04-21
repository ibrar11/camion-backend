import { IsEnum, IsNotEmpty, IsOptional, IsString, IsUUID, MaxLength, MinLength } from "class-validator";
import { NotificationType } from "../enums/notification-type.enum";
import { NotificationPriority } from "../enums/notification-priority.enum";

export class CreateNotificationDto {
	@IsUUID('4')
	customerUUID: string;

	@IsEnum(NotificationType)
	type: NotificationType;

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
	payload?: Record<string, any>;

	@IsOptional()
	@IsEnum(NotificationPriority)
	priority?: NotificationPriority;
}

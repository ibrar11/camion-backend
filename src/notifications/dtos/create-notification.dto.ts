import { IsEnum, IsNotEmpty, IsOptional, IsString, IsUUID, MaxLength } from "class-validator";
import { NotificationType } from "../enums/notification-type.enum";
import { NotificationPriority } from "../enums/notification-priority.enum";

export class CreateNotificationDto {
	@IsUUID()
	customerUUID: string;

	@IsEnum(NotificationType)
	type: NotificationType;

	@IsString()
	@IsNotEmpty()
	@MaxLength(100)
	title: string;

	@IsString()
	@IsNotEmpty()
	@MaxLength(160)
	brief: string;

	@IsString()
	@IsNotEmpty()
	message: string;

	@IsOptional()
	payload?: Record<string, any>;

	@IsOptional()
	@IsEnum(NotificationPriority)
	priority?: NotificationPriority;
}

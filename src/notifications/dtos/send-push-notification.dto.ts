import { ArrayUnique, IsArray, IsString } from "class-validator";

export class SendPushNotificationDto {
    @IsArray()
    @IsString({ each: true })
    @ArrayUnique({ message: "push notification uuid values must be unique" })
    notificationUUID: string[];

}

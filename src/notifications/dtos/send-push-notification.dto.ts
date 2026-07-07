import { ArrayUnique, IsArray, IsIn, IsString } from "class-validator";
import { CustomerRole } from "../../customers/enums/CustomerRole";
import { NotificationReceiver } from "../enums/notification-receiver.enum";

const RECEIVER_TYPES = [
    ...Object.values(CustomerRole),
    NotificationReceiver.ALLCUSTOMER,
];

export class SendPushNotificationDto {
    @IsArray()
    @IsString({ each: true })
    @ArrayUnique({ message: "push notification uuid values must be unique" })
    notificationUUID: string[];

    @IsString()
    @IsIn(RECEIVER_TYPES)
    receiverType: ReceiverType;
}

export type ReceiverType = CustomerRole | NotificationReceiver.ALLCUSTOMER;
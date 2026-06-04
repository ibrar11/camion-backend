import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";

import { Notification } from "./entities/notification.entity";
import { NotificationsService } from "./notifications.service";
import { NotificationsController } from "./notifications.controller";
import { NotificationsResolver } from "./notifications.resolver";

import { User } from "../users/entities/user.entity";
import { UsersService } from "../users/users.service";

import { Customer } from "../customers/entities/customer.entity";
import { CustomersService } from "../customers/customers.service";

import { ClientsModule } from "../clients/clients.module";

import { PushNotification } from "./entities/push-notification";
import { PushNotificationImage } from "./entities/push-notification-image";
import { PushNotificationService } from "./push-notification.service";
import { PushNotificationController } from "./push-notification.controller";

import { FirebaseAdminProvider } from "../firebase/provider/firebase.provider";
import { PushNotificationImageService } from "./push-notification-image.service";

import { S3Service } from "../common/s3.service";
import { FileService } from "../common/file.service";

@Module({
	imports: [
		TypeOrmModule.forFeature([
			Notification,
			PushNotification,
			PushNotificationImage,
			User, 
			Customer
		]),
		ClientsModule,
	],
	providers: [
		NotificationsService,
		NotificationsResolver,
		UsersService,
		CustomersService,
		PushNotificationService,
		PushNotificationImageService,
		FirebaseAdminProvider,
		S3Service,
		FileService,
	],
	controllers: [
		NotificationsController,
		PushNotificationController,
	],
	exports: [NotificationsService],
})
export class NotificationsModule { }

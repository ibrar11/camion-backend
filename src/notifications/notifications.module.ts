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

@Module({
	imports: [
		TypeOrmModule.forFeature([Notification, User, Customer]),
		ClientsModule,
	],
	providers: [
		NotificationsService,
		NotificationsResolver,
		UsersService,
		CustomersService,
	],
	controllers: [NotificationsController],
	exports: [NotificationsService],
})
export class NotificationsModule { }

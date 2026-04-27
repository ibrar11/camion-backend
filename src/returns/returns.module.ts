import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";

import { ReturnRequest } from "./entities/return-request.entity";
import { ReturnEvidence } from "./entities/return-evidence.entity";
import { ReturnsService } from "./returns.service";
import { ReturnsController } from "./returns.controller";
import { ReturnsResolver } from "./returns.resolver";

import { Order } from "../order/entities/order.entity";
import { OrderItem } from "../order/entities/order-item.entity";

import { InventoryItem } from "../inventory/entities/inventory-item.entity";
import { InventoryLevel } from "../inventory/entities/inventory-level.entity";

import { User } from "../users/entities/user.entity";
import { UsersService } from "../users/users.service";

import { Customer } from "../customers/entities/customer.entity";
import { CustomersService } from "../customers/customers.service";

import { Notification } from "../notifications/entities/notification.entity";
import { NotificationsService } from "../notifications/notifications.service";

import { S3Service } from "../common/s3.service";

import { ClientsModule } from "../clients/clients.module";

@Module({
    imports: [
        TypeOrmModule.forFeature([
            ReturnRequest,
            ReturnEvidence,
            Order,
            OrderItem,
            InventoryItem,
            InventoryLevel,
            User,
            Customer,
            Notification,
        ]),
        ClientsModule,
    ],
    providers: [
        ReturnsService,
        ReturnsResolver,
        NotificationsService,
        UsersService,
        CustomersService,
        S3Service,
    ],
    controllers: [ReturnsController],
})
export class ReturnsModule {}

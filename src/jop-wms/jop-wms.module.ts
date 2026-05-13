import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BullModule } from '@nestjs/bullmq';

import { ProductVariant } from '../inventory/entities/product-variant.entity';
import { Product } from '../inventory/entities/product.entity';
import { Warehouse } from '../inventory/entities/warehouse.entity';

import { Order } from '../order/entities/order.entity';
import { OrderItem } from '../order/entities/order-item.entity';

import { User } from '../users/entities/user.entity';
import { UsersService } from '../users/users.service';

import { Customer } from '../customers/entities/customer.entity';
import { CustomersService } from '../customers/customers.service';

import { ClientsModule } from '../clients/clients.module';
import { ProcurementModule } from '../procurement/procurement.module';
import { NotificationsModule } from '../notifications/notifications.module';

import { QueueName } from '../queue/enums/QueueTypes.enum';

import { JopWmsOrder } from './entities/jop-wms-order.entity';
import { JopWmsOrderLink } from './entities/jop-wms-order-link.entity';
import { JopWmsClient } from './jop-wms.client';
import { JopWmsService } from './jop-wms.service';
import { JopWmsController } from './jop-wms.controller';
import { JopWmsScheduler } from './jop-wms.scheduler';
import { DispatchProcessor } from './workers/dispatch.processor';

@Module({
    imports: [
        TypeOrmModule.forFeature([
            ProductVariant,
            Product,
            Warehouse,
            Order,
            OrderItem,
            JopWmsOrder,
            JopWmsOrderLink,
            User,
            Customer,
        ]),
        BullModule.registerQueue({ name: QueueName.WMS_DISPATCH }),
        ClientsModule,
        ProcurementModule,
        NotificationsModule,
    ],
    providers: [
        UsersService,
        CustomersService,
        JopWmsClient,
        JopWmsService,
        JopWmsScheduler,
        DispatchProcessor,
    ],
    controllers: [JopWmsController],
    exports: [JopWmsService],
})
export class JopWmsModule { }

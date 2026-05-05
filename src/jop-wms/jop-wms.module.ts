import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

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

import { JopWmsOrder } from './entities/jop-wms-order.entity';
import { JopWmsClient } from './jop-wms.client';
import { JopWmsService } from './jop-wms.service';
import { JopWmsController } from './jop-wms.controller';
import { JopWmsScheduler } from './jop-wms.scheduler';

@Module({
    imports: [
        TypeOrmModule.forFeature([
            ProductVariant,
            Product,
            Warehouse,
            Order,
            OrderItem,
            JopWmsOrder,
            User,
            Customer,
        ]),
        ClientsModule,
        ProcurementModule,
    ],
    providers: [
        UsersService,
        CustomersService,
        JopWmsClient,
        JopWmsService,
        JopWmsScheduler,
    ],
    controllers: [JopWmsController],
    exports: [JopWmsService],
})
export class JopWmsModule { }

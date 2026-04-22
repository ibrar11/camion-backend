import { Module } from '@nestjs/common';

import { TypeOrmModule } from '@nestjs/typeorm';

import { Order } from './entities/order.entity';
import { OrderItem } from './entities/order-item.entity';
import { OrderService } from './order.service';
import { OrderController } from './order.controller';
import { 
    OrderItemResolver, 
    OrderResolver 
} from './order.resolver';

import { ClientsModule } from 'src/clients/clients.module';

import { User } from 'src/users/entities/user.entity';
import { UsersService } from 'src/users/users.service';

import { Customer } from 'src/customers/entities/customer.entity';
import { CustomerAddress } from 'src/customers/entities/customer-address.entity';
import { CustomersService } from 'src/customers/customers.service';

import { ProductVariant } from 'src/inventory/entities/product-variant.entity';

import { InventoryItem } from 'src/inventory/entities/inventory-item.entity';

import { CartItem } from 'src/cart/entities/cart-items.entity';
import { InventoryLevel } from 'src/inventory/entities/inventory-level.entity';

@Module({
    imports: [
        TypeOrmModule.forFeature([
            Order,
            OrderItem,
            User,
            Customer,
            ProductVariant,
            InventoryItem,
            InventoryLevel,
            CartItem,
            CustomerAddress
        ]),
        ClientsModule,
    ],
    providers: [
        OrderService,
        UsersService,
        CustomersService,
        OrderResolver,
        OrderItemResolver,
    ],
    controllers: [
        OrderController
    ]
})
export class OrderModule { }

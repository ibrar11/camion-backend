import { Module } from '@nestjs/common';

import { TypeOrmModule } from '@nestjs/typeorm';

import { Order } from './entities/order.entity';
import { OrderItem } from './entities/order-item.entity';
import { OrderService } from './order.service';
import { OrderController } from './order.controller';
import { OrderResolver } from './order.resolver';

import { ClientsModule } from '../clients/clients.module';

import { User } from '../users/entities/user.entity';
import { UsersService } from '../users/users.service';

import { Customer } from '../customers/entities/customer.entity';
import { CustomerAddress } from '../customers/entities/customer-address.entity';
import { CustomersService } from '../customers/customers.service';

import { ProductVariant } from '../inventory/entities/product-variant.entity';

import { InventoryItem } from '../inventory/entities/inventory-item.entity';

import { CartItem } from '../cart/entities/cart-items.entity';
import { InventoryLevel } from '../inventory/entities/inventory-level.entity';

import { PaymentTransaction } from '../payments/entities/payment-transaction.entity';
import { PaymentsService } from '../payments/payments.service';
import { PaymentStrategyFactory } from '../payments/factories/PaymentStrategyFactory';

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
            CustomerAddress,
            PaymentTransaction,
        ]),
        ClientsModule,
    ],
    providers: [
        OrderService,
        UsersService,
        CustomersService,
        OrderResolver,
        PaymentsService,
        PaymentStrategyFactory,
    ],
    controllers: [
        OrderController
    ]
})
export class OrderModule { }

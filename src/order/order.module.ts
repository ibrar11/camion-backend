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

import { ClientsModule } from '../clients/clients.module';

import { User } from '../users/entities/user.entity';
import { UsersService } from '../users/users.service';

import { Customer } from '../customers/entities/customer.entity';
import { CustomerAddress } from '../customers/entities/customer-address.entity';
import { CustomersService } from '../customers/customers.service';

import { InventoryItem } from '../inventory/entities/inventory-item.entity';

import { CartItem } from '../cart/entities/cart-items.entity';
import { InventoryLevel } from '../inventory/entities/inventory-level.entity';

import { PaymentTransaction } from '../payments/entities/payment-transaction.entity';
import { PaymentsService } from '../payments/payments.service';
import { PaymentStrategyFactory } from '../payments/factories/PaymentStrategyFactory';

import { ExchangeRate } from '../pricing/entities/exchange-rate.entity';
import { ExchangeRateService } from '../pricing/exchange-rate.service';

import { Coupon } from '../referral/entities/coupon.entity';

import { Wallet } from '../referral/entities/wallet.entity';

import { Affiliate } from '../referral/entities/affiliate.entity';

import { Transaction } from '../referral/entities/transaction.entity';
import { TransactionsService } from '../referral/transactions.service';

import { KeyValuePair } from '../key-value-pairs/entities/key-value-pair.entity';
import { PricingService } from '../pricing/pricing.service';

import { JopWmsOrderLink } from '../jop-wms/entities/jop-wms-order-link.entity';

import { NotificationsModule } from '../notifications/notifications.module';
import { EmailModule } from '../email/email.module';

import { Notification } from '../notifications/entities/notification.entity';
import { PushNotificationService } from '../common/push-notification.service';

import { FirebaseAdminProvider } from '../firebase/provider/firebase.provider';

import { Product } from '../inventory/entities/product.entity';

@Module({
    imports: [
        TypeOrmModule.forFeature([
            Order,
            OrderItem,
            User,
            Customer,
            CustomerAddress,
            InventoryItem,
            InventoryLevel,
            CartItem,
            CustomerAddress,
            PaymentTransaction,
            ExchangeRate,
            Coupon,
            Wallet,
            Affiliate,
            Transaction,
            KeyValuePair,
            JopWmsOrderLink,
            Notification,
            Product,
        ]),
        ClientsModule,
        NotificationsModule,
        EmailModule,
    ],
    exports: [
        OrderService,
    ],
    providers: [
        OrderService,
        UsersService,
        CustomersService,
        OrderResolver,
        OrderItemResolver,
        PaymentsService,
        PaymentStrategyFactory,
        ExchangeRateService,
        TransactionsService,
        PricingService,
        PushNotificationService,
        FirebaseAdminProvider,
    ],
    controllers: [
        OrderController
    ]
})
export class OrderModule { }

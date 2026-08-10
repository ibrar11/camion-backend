import { Module } from '@nestjs/common';

import { TypeOrmModule } from '@nestjs/typeorm';
import { BullModule } from '@nestjs/bullmq';

import { Order } from './entities/order.entity';
import { OrderItem } from './entities/order-item.entity';
import { OrderTrackingEvent } from './entities/order-tracking-event.entity';
import { OrderService } from './order.service';
import { OrderServiceV2 } from './order-v2.service';
import { OrderController } from './order.controller';
import { OrderV2Controller } from './order-v2.controller';
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
import { GlobalCoupon } from '../referral/entities/global-coupon.entity';

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
import { PushNotification } from '../notifications/entities/push-notification';
import { PushNotificationService } from '../notifications/push-notification.service';

import { FirebaseAdminProvider } from '../firebase/provider/firebase.provider';

import { Product } from '../inventory/entities/product.entity';

import { QueueName } from '../queue/enums/QueueTypes.enum';

import { OrderSkuMetaProcessor } from './workers/order-skumeta.processor';
import { OrderScheduler } from './order.scheduler';

import { SkipCashSessionService } from '../payments/skipcash-session.service';

import { SavedCard } from 'src/payments/entities/saved-card.entity';
import { SavedCardsService } from '../payments/saved-cards.service';

@Module({
    imports: [
        TypeOrmModule.forFeature([
            Order,
            OrderItem,
            OrderTrackingEvent,
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
            GlobalCoupon,
            Wallet,
            Affiliate,
            Transaction,
            KeyValuePair,
            JopWmsOrderLink,
            Notification,
            PushNotification,
            Product,
            SavedCard,
        ]),
        BullModule.registerQueue(
            { name: QueueName.ORDER_SKUMETA_VALIDATION },
        ),
        ClientsModule,
        NotificationsModule,
        EmailModule,
    ],
    exports: [
        OrderService,
    ],
    providers: [
        OrderService,
        OrderServiceV2,
        UsersService,
        CustomersService,
        OrderResolver,
        OrderItemResolver,
        PaymentsService,
        SkipCashSessionService,
        SavedCardsService,
        PaymentStrategyFactory,
        ExchangeRateService,
        TransactionsService,
        PricingService,
        PushNotificationService,
        FirebaseAdminProvider,
        OrderSkuMetaProcessor,
        OrderScheduler,
    ],
    controllers: [
        OrderController,
        OrderV2Controller
    ]
})
export class OrderModule { }

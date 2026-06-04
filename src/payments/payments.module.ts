import {
    Module,
    OnModuleInit
} from '@nestjs/common';

import { TypeOrmModule } from '@nestjs/typeorm';

import { User } from '../users/entities/user.entity';
import { UsersService } from '../users/users.service';

import { Customer } from '../customers/entities/customer.entity';
import { CustomersService } from '../customers/customers.service';

import { PaymentProvider } from './enums/PaymentProvider';

import { PaymentTransaction } from './entities/payment-transaction.entity';
import { PaymentsService } from './payments.service';
import { PaymentsController } from './payments.controller';

import { PaymentsWebhookService } from './payments-webhook.service';
import { PaymentsWebhookController } from './payments-webhook.controller';

import { PaymentStrategyFactory } from './factories/PaymentStrategyFactory';

import { SkipCashStrategy } from './strategies/SkipcashStrategy';
import { SkipCashAdapter } from './adapters/SkipcashAdapter';

import { Client } from '../clients/entities/client.entity';
import { ClientsService } from '../clients/clients.service';

import { ClientRefreshToken } from '../oauth/entities/oauth-refresh-token.entity';
import { OauthService } from '../oauth/oauth.service';

import { Order } from '../order/entities/order.entity';

import { ExchangeRate } from '../pricing/entities/exchange-rate.entity';
import { ExchangeRateService } from '../pricing/exchange-rate.service';

import { NotificationsModule } from '../notifications/notifications.module';

import { Notification } from '../notifications/entities/notification.entity';
import { PushNotification } from '../notifications/entities/push-notification';
import { PushNotificationService } from '../notifications/push-notification.service';

import { FirebaseAdminProvider } from '../firebase/provider/firebase.provider';

import { CartItem } from '../cart/entities/cart-items.entity';

@Module({
    imports: [
        TypeOrmModule.forFeature([
            User,
            Customer,
            PaymentTransaction,
            Client,
            ClientRefreshToken,
            Order,
            ExchangeRate,
            Notification,
            PushNotification,
            CartItem,
        ]),
        NotificationsModule,
    ],
    providers: [
        PaymentsService,
        PaymentsWebhookService,
        PaymentStrategyFactory,
        SkipCashStrategy,
        SkipCashAdapter,
        UsersService,
        CustomersService,
        ClientsService,
        OauthService,
        ExchangeRateService,
        PushNotificationService,
        FirebaseAdminProvider,
    ],
    controllers: [
        PaymentsController,
        PaymentsWebhookController
    ],
    exports: [PaymentStrategyFactory],
})
export class PaymentsModule implements OnModuleInit {
    constructor(
        private factory: PaymentStrategyFactory,
        private skipCashStrategy: SkipCashStrategy,
    ) { }

    onModuleInit() {
        this.factory.register(PaymentProvider.SKIPCASH, this.skipCashStrategy);
    }
}

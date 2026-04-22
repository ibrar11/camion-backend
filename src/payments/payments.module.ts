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

@Module({
    imports: [
        TypeOrmModule.forFeature([
            User,
            Customer,
            PaymentTransaction,
            Client,
            ClientRefreshToken,
            Order,
        ]),
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

import { 
  Module, 
  OnModuleInit 
} from '@nestjs/common';

import { TypeOrmModule } from '@nestjs/typeorm';

import { User } from 'src/users/entities/user.entity';
import { UsersService } from 'src/users/users.service';

import { Customer } from 'src/customers/entities/customer.entity';
import { CustomersService } from 'src/customers/customers.service';

import { PaymentProvider } from './enums/PaymentProvider';

import { PaymentsService } from './payments.service';
import { PaymentsController } from './payments.controller';

import { PaymentStrategyFactory } from './factories/PaymentStrategyFactory';

import { SkipCashStrategy } from './strategies/SkipcashStrategy';
import { SkipCashAdapter } from './adapters/SkipcashAdapter';

@Module({
  imports: [
      TypeOrmModule.forFeature([
        User,
        Customer,
      ]),
    ],
  providers: [
    PaymentsService,
    PaymentStrategyFactory,
    SkipCashStrategy,
    SkipCashAdapter,
    UsersService,
    CustomersService
  ],
  controllers: [PaymentsController],
  exports: [PaymentStrategyFactory],
})
export class PaymentsModule implements OnModuleInit {
  constructor(
    private factory: PaymentStrategyFactory,
    private skipCashStrategy: SkipCashStrategy,
  ) {}

  onModuleInit() {
    this.factory.register(PaymentProvider.SKIPCASH, this.skipCashStrategy);
  }
}

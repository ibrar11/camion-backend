import { 
  Module, 
  OnModuleInit 
} from '@nestjs/common';

import { PaymentProvider } from './enums/PaymentProvider';

import { PaymentsService } from './payments.service';
import { PaymentsController } from './payments.controller';

import { PaymentStrategyFactory } from './factories/PaymentStrategyFactory';

import { SkipCashStrategy } from './strategies/SkipcashStrategy';
import { SkipCashAdapter } from './adapters/SkipcashAdapter';

@Module({
  providers: [
    PaymentsService,

    PaymentStrategyFactory,

    SkipCashStrategy,
    SkipCashAdapter

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

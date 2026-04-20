import { Module } from '@nestjs/common';

import { TypeOrmModule } from '@nestjs/typeorm';

import { User } from '../users/entities/user.entity';
import { UsersService } from '../users/users.service';

import { Customer } from '../customers/entities/customer.entity';
import { CustomersService } from '../customers/customers.service';

import { ExchangeRate } from './entities/exchange-rate.entity';
import { ExchangeRateService } from './exchange-rate.service';
import { ExchangeRateController } from './exchange-rate.controller';

import { PricingService } from './pricing.service';

import { Client } from '../clients/entities/client.entity';
import { ClientsService } from '../clients/clients.service';

import { OauthService } from '../oauth/oauth.service';

import { ClientRefreshToken } from '../oauth/entities/oauth-refresh-token.entity';
import { KeyValuePair } from 'src/key-value-pairs/entities/key-value-pair.entity';

@Module({
	imports: [
		TypeOrmModule.forFeature([
			ExchangeRate,
			User,
			Customer,
			Client,
			ClientRefreshToken,
			KeyValuePair,
		]),
	],
	providers: [
		PricingService,
		ExchangeRateService,
		UsersService,
		CustomersService,
		ClientsService,
		OauthService,
	],
	exports: [
		ExchangeRateService,
		PricingService,
	],
	controllers: [
		ExchangeRateController,
	],
})
export class PricingModule { }

import { Module } from '@nestjs/common';

import { TypeOrmModule } from '@nestjs/typeorm';

import { Promo } from './entities/promo.entity';
import { PromosService } from './promos.service';
import { PromosResolver } from './promos.resolver';
import { PromosController } from './promos.controller';

import { User } from '../users/entities/user.entity';
import { UsersService } from '../users/users.service';

import { Customer } from '../customers/entities/customer.entity';
import { CustomersService } from '../customers/customers.service';

import { Client } from '../clients/entities/client.entity';
import { ClientsService } from '../clients/clients.service';

import { OauthService } from '../oauth/oauth.service';

import { ClientRefreshToken } from '../oauth/entities/oauth-refresh-token.entity';

@Module({
	imports: [
		TypeOrmModule.forFeature([
			Promo,
			User,
			Customer,
			Client,
			ClientRefreshToken,
		]),
	],
	providers: [
		PromosService,
		PromosResolver,
		UsersService,
		CustomersService,
		ClientsService,
		OauthService,
	],
	controllers: [PromosController]
})
export class PromosModule { }

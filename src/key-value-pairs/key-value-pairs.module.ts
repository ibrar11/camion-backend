import { Module } from '@nestjs/common';

import { TypeOrmModule } from '@nestjs/typeorm';

import { KeyValuePair } from './entities/key-value-pair.entity';
import { KeyValuePairsService } from './key-value-pairs.service';
import { KeyValuePairController } from './key-value-pairs.controller';

import { User } from '../users/entities/user.entity';
import { UsersService } from '../users/users.service';

import { Customer } from '../customers/entities/customer.entity';
import { CustomersService } from '../customers/customers.service';

import { Client } from '../clients/entities/client.entity';
import { ClientsService } from '../clients/clients.service';

import { OauthService } from '../oauth/oauth.service';

import { ClientRefreshToken } from '../oauth/entities/oauth-refresh-token.entity';

import { KeyValuePairResolver } from './key-value-pairs.resolver';

@Module({
	imports: [
		TypeOrmModule.forFeature([
			KeyValuePair,
			User,
			Customer,
			Client,
			ClientRefreshToken,
		]),
	],
	providers: [
		KeyValuePairsService,
		UsersService,
		CustomersService,
		ClientsService,
		OauthService,
		KeyValuePairResolver,
	],
	controllers: [
		KeyValuePairController,
	],
})
export class KeyValuePairsModule { }

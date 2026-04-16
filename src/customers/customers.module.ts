import { Module } from '@nestjs/common';

import { TypeOrmModule } from '@nestjs/typeorm';

import { User } from '../users/entities/user.entity';
import { UsersService } from '../users/users.service';

import { Customer } from './entities/customer.entity';
import { CustomersService } from './customers.service';
import { CustomersController } from './customers.controller';
import { ClientsModule } from '../clients/clients.module';

import { CustomerAddress } from './entities/customer-address.entity';
import { CustomerAddressesService } from './customer-addresses.service';
import { CustomerAddressesController } from './customer-addresses.controller';
import { CustomerAddressesResolver } from './customer-addresses.resolver';

import { CustomersScheduler } from './customers.scheduler';

@Module({
	imports: [
		TypeOrmModule.forFeature([
			User,
			Customer,
			CustomerAddress,
		]),
		ClientsModule,
	],
	providers: [
		UsersService,
		CustomersService,
		CustomerAddressesService,
		CustomerAddressesResolver,
		CustomersScheduler,
	],
	controllers: [
		CustomersController,
		CustomerAddressesController,
	],
	exports: [CustomersService],
})
export class CustomersModule { }

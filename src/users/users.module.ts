import { Module, forwardRef } from '@nestjs/common';

import { TypeOrmModule } from '@nestjs/typeorm';

import { User } from './entities/user.entity';
import { UsersService } from './users.service';
import { UsersController } from './users.controller';

import { Customer } from 'src/customers/entities/customer.entity';
import { CustomersService } from 'src/customers/customers.service';

import { ClientsModule } from '../clients/clients.module';

@Module({
	imports: [
		TypeOrmModule.forFeature([
			User,
			Customer,
		]),
		forwardRef(() => ClientsModule),
	],
	providers: [
		UsersService,
		CustomersService,
	],
	controllers: [UsersController],
	exports: [UsersService, CustomersService],
})
export class UsersModule { }

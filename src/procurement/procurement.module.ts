import { Module } from '@nestjs/common';

import { TypeOrmModule } from '@nestjs/typeorm';

import { User } from 'src/users/entities/user.entity';
import { UsersService } from 'src/users/users.service';

import { Customer } from 'src/customers/entities/customer.entity';
import { CustomersService } from 'src/customers/customers.service';

import { ClientsModule } from 'src/clients/clients.module';

import { ProcurementService } from './procurement.service';
import { ProcurementController } from './procurement.controller';

@Module({
	imports: [
		TypeOrmModule.forFeature([
			User,
			Customer
		]),
		ClientsModule,
	],
	providers: [
		UsersService,
		CustomersService,
		ProcurementService
	],
	controllers: [ProcurementController]
})
export class ProcurementModule {}

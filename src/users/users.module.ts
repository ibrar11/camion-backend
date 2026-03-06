import { Module } from '@nestjs/common';

import { TypeOrmModule } from '@nestjs/typeorm';

import { User } from './entities/user.entity';
import { UsersService } from './users.service';
import { UsersController } from './users.controller';

import { Customer } from 'src/customers/entities/customer.entity';
import { CustomersService } from 'src/customers/customers.service';

@Module({
	imports: [
		TypeOrmModule.forFeature([
			User,
			Customer,
		])
	],
	providers: [
		UsersService,
		CustomersService,
	],
	controllers: [UsersController],
})
export class UsersModule { }

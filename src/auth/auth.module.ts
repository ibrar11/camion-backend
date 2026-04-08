import { Module } from '@nestjs/common';

import { TypeOrmModule } from '@nestjs/typeorm';

import { Customer } from 'src/customers/entities/customer.entity';
import { CustomersService } from 'src/customers/customers.service';
import { CustomerAuthService } from './customer-auth.service';
import { CustomerAuthController } from './customer-auth.controller';

import { User } from 'src/users/entities/user.entity';
import { UsersService } from 'src/users/users.service';
import { UserAuthService } from './user-auth.service';
import { UserAuthController } from './user-auth.controller';

import { LoginRequest } from './entities/login-request.entity';

@Module({
	imports: [
		TypeOrmModule.forFeature([
			User,
			Customer,
			LoginRequest,
		]),
	],
	providers: [
		CustomerAuthService,
		CustomersService,
		UserAuthService,
		UsersService,
	],
	controllers: [
		CustomerAuthController,
		UserAuthController,
	],
})
export class AuthModule { }

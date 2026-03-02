import { Module } from '@nestjs/common';

import { TypeOrmModule } from '@nestjs/typeorm';

import { User } from 'src/users/entities/user.entity';
import { UsersService } from 'src/users/users.service';

import { Customer } from 'src/customers/entities/customer.entity';
import { CustomersService } from 'src/customers/customers.service';

import { RegistrationRequest } from './entities/registration-request.entity';

import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';

@Module({
	imports: [
		TypeOrmModule.forFeature([
			User,
			Customer,
			RegistrationRequest,
		]),
	],
	providers: [AuthService, UsersService, CustomersService],
	controllers: [AuthController]
})
export class AuthModule { }

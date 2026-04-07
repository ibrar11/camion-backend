import { Module } from '@nestjs/common';

import { TypeOrmModule } from '@nestjs/typeorm';

import { User } from 'src/users/entities/user.entity';
import { UsersService } from 'src/users/users.service';

import { Customer } from 'src/customers/entities/customer.entity';
import { CustomersService } from 'src/customers/customers.service';

import { RegistrationRequest } from './entities/registration-request.entity';

import { UsersModule } from 'src/users/users.module';
import { ClientsModule } from '../clients/clients.module';

import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';

import { AuthGuard } from './auth.guard';
import { RolesGuard } from './roles.guard';

@Module({
	imports: [
		TypeOrmModule.forFeature([
			User,
			Customer,
			RegistrationRequest,
		]),
        UsersModule,
        ClientsModule,
    ],
    providers: [
        AuthService,
        UsersService,
        CustomersService,
        AuthGuard,
        RolesGuard,
    ],
    controllers: [AuthController],
    exports: [
        AuthGuard,
        RolesGuard,
    ],
})
export class AuthModule { }

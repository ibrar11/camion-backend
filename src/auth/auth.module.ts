import { Module } from '@nestjs/common';

import { TypeOrmModule } from '@nestjs/typeorm';

import { Customer } from 'src/customers/entities/customer.entity';
import { CustomersService } from 'src/customers/customers.service';
import { CustomerAuthService } from './customer-auth.service';
import { CustomerAuthController } from './customer-auth.controller';
import { CustomerAuthResolver } from './customer-auth.resolver';

import { User } from 'src/users/entities/user.entity';

import { UsersModule } from 'src/users/users.module';
import { ClientsModule } from '../clients/clients.module';

import { UsersService } from 'src/users/users.service';
import { UserAuthService } from './user-auth.service';
import { UserAuthController } from './user-auth.controller';

import { GuestAuthService } from './guest-auth.service';
import { GuestAuthController } from './guest-auth.controller';

import { LoginRequest } from './entities/login-request.entity';

import { AuthGuard } from './auth.guard';
import { RolesGuard } from './roles.guard';

@Module({
    imports: [
        TypeOrmModule.forFeature([
            User,
            Customer,
            LoginRequest,
        ]),
        UsersModule,
        ClientsModule,
    ],
    providers: [
        CustomerAuthService,
        CustomerAuthResolver,
        CustomersService,
        UserAuthService,
        GuestAuthService,
        UsersService,
        AuthGuard,
        RolesGuard,
    ],
    controllers: [
        CustomerAuthController,
        UserAuthController,
        GuestAuthController,
    ],
    exports: [
        AuthGuard,
        RolesGuard,
    ],
})
export class AuthModule { }

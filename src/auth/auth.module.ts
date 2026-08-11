import { Module } from '@nestjs/common';

import { PassportModule } from '@nestjs/passport';
import { TypeOrmModule } from '@nestjs/typeorm';

import { Customer } from 'src/customers/entities/customer.entity';
import { CustomersService } from 'src/customers/customers.service';
import { CustomerAuthService } from './customer-auth.service';
import { CustomerAuthController } from './customer-auth.controller';
import { CustomerAuthResolver } from './customer-auth.resolver';
import { EmailModule } from 'src/email/email.module';

import { TwilioService } from 'src/common/twilio.service';

import { User } from 'src/users/entities/user.entity';

import { UsersModule } from 'src/users/users.module';
import { ClientsModule } from '../clients/clients.module';

import { UsersService } from 'src/users/users.service';
import { UserAuthService } from './user-auth.service';
import { UserAuthController } from './user-auth.controller';

import { GuestAuthService } from './guest-auth.service';
import { GuestAuthController } from './guest-auth.controller';

import { LoginRequest } from './entities/login-request.entity';

import { CartItem } from '../cart/entities/cart-items.entity';

import { AuthGuard } from './auth.guard';
import { RolesGuard } from './roles.guard';
import { GoogleOAuthStrategy } from './strategies/google.strategy';
import { FacebookOAuthStrategy } from './strategies/facebook.strategy';
import { SocialAuthController } from './social-auth.controller';

import { Client } from '../clients/entities/client.entity';
import { ClientAuthService } from './client-auth.service';
import { ClientAuthController } from './client-auth.controller';

@Module({
    imports: [
        PassportModule,
        TypeOrmModule.forFeature([
            User,
            Customer,
            LoginRequest,
            CartItem,
            Client,
        ]),
        UsersModule,
        ClientsModule,
        EmailModule,
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
        TwilioService,
        GoogleOAuthStrategy,
        FacebookOAuthStrategy,
        ClientAuthService,
    ],
    controllers: [
        CustomerAuthController,
        UserAuthController,
        GuestAuthController,
        SocialAuthController,
        ClientAuthController,
    ],
    exports: [
        AuthGuard,
        RolesGuard,
    ],
})
export class AuthModule { }

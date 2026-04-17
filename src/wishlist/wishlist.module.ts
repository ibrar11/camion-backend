import { Module } from '@nestjs/common';

import { TypeOrmModule } from '@nestjs/typeorm';

import { WishlistItem } from './entities/wishlist.entity';
import { WishlistService } from './wishlist.service';
import { WishlistController } from './wishlist.controller';

import { Product } from '../inventory/entities/product.entity';

import { AuthModule } from '../auth/auth.module';

import { UsersModule } from '../users/users.module';

import { ClientsModule } from '../clients/clients.module';

import { CustomersModule } from '../customers/customers.module';

import { WishListResolver } from './wishlist.resolver';

@Module({
    imports: [
        TypeOrmModule.forFeature([
            WishlistItem,
            Product
        ]),
        AuthModule,
        UsersModule,
        ClientsModule,
        CustomersModule,
    ],
    providers: [
        WishlistService,
        WishListResolver,
    ],
    controllers: [WishlistController]
})
export class WishlistModule { }

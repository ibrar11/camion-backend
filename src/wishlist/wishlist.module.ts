import { Module } from '@nestjs/common';

import { TypeOrmModule } from '@nestjs/typeorm';

import { WishlistItem } from './entities/wishlist.entity';
import { WishlistService } from './wishlist.service';
import { WishlistController } from './wishlist.controller';

import { Product } from 'src/inventory/entities/product.entity';

import { AuthModule } from 'src/auth/auth.module';

import { UsersModule } from 'src/users/users.module';

import { ClientsModule } from 'src/clients/clients.module';

import { CustomersModule } from 'src/customers/customers.module';

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

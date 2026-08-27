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

import { PricingModule } from '../pricing/pricing.module';
import { InventoryModule } from '../inventory/inventory.module';

import { WishListResolver } from './wishlist.resolver';

@Module({
    imports: [
        TypeOrmModule.forFeature([
            Product,
            WishlistItem,
        ]),
        AuthModule,
        ClientsModule,
        CustomersModule,
        InventoryModule,
        PricingModule,
        UsersModule,
    ],
    providers: [
        WishListResolver,
        WishlistService,
    ],
    controllers: [WishlistController]
})
export class WishlistModule { }

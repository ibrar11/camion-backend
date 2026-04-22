import { Module } from '@nestjs/common';

import { TypeOrmModule } from '@nestjs/typeorm';

import { User } from '../users/entities/user.entity';
import { UsersService } from '../users/users.service';

import { Customer } from '../customers/entities/customer.entity';
import { CustomersService } from '../customers/customers.service';

import { CartItem } from './entities/cart-items.entity';
import { CartItemsService } from './cart.service';
import { CartItemsController } from './cart.controller';

import { Product } from '../inventory/entities/product.entity';

import { ProductVariant } from '../inventory/entities/product-variant.entity';

import { ClientsModule } from '../clients/clients.module';

import { CartResolver } from './cart.resolver';
import { PricingModule } from 'src/pricing/pricing.module';

import { ExchangeRate } from '../pricing/entities/exchange-rate.entity';
import { KeyValuePair } from '../key-value-pairs/entities/key-value-pair.entity';
import { PricingService } from '../pricing/pricing.service';

@Module({
    imports: [
        TypeOrmModule.forFeature([
            User,
            Customer,
            CartItem,
            Product,
            ProductVariant,
            ExchangeRate,
            KeyValuePair,
        ]),
        ClientsModule,
        PricingModule,
    ],
    providers: [
        CartItemsService,
        UsersService,
        CustomersService,
        CartResolver,
        PricingService,
    ],
    controllers: [CartItemsController]
})
export class CartModule { }

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

@Module({
    imports: [
        TypeOrmModule.forFeature([
            User,
            Customer,
            CartItem,
            Product,
            ProductVariant,
        ]),
        ClientsModule,
        PricingModule,
    ],
    providers: [
        CartItemsService,
        UsersService,
        CustomersService,
        CartResolver,
    ],
    controllers: [CartItemsController]
})
export class CartModule { }

import { Module } from '@nestjs/common';

import { TypeOrmModule } from '@nestjs/typeorm';

import { User } from 'src/users/entities/user.entity';
import { UsersService } from 'src/users/users.service';

import { Customer } from 'src/customers/entities/customer.entity';
import { CustomersService } from 'src/customers/customers.service';

import { CartItem } from './entities/cart-items.entity';
import { CartService } from './cart.service';
import { CartController } from './cart.controller';

import { Product } from 'src/inventory/entities/product.entity';

import { ProductVariant } from 'src/inventory/entities/product-variant.entity';

@Module({
  imports: [
      TypeOrmModule.forFeature([
        User, 
        Customer , 
        CartItem, 
        Product,
        ProductVariant,
      ]),
  ],
  providers: [
    CartService, 
    UsersService, 
    CustomersService
  ],
  controllers: [CartController]
})
export class CartModule {}

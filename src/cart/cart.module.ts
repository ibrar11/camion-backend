import { Module } from '@nestjs/common';

import { TypeOrmModule } from '@nestjs/typeorm';

import { User } from 'src/users/entities/user.entity';
import { UsersService } from 'src/users/users.service';

import { Customer } from 'src/customers/entities/customer.entity';
import { CustomersService } from 'src/customers/customers.service';

import { CartItem } from './entities/cart-items.entity';
import { CartService } from './cart.service';
import { CartController } from './cart.controller';

import { Product } from 'src/products/entities/product.entity';
import { ProductsService } from 'src/products/products.service';

@Module({
  imports: [
      TypeOrmModule.forFeature([
        User, 
        Customer , 
        CartItem, 
        Product
      ]),
  ],
  providers: [
    CartService, 
    UsersService, 
    CustomersService, 
    ProductsService
  ],
  controllers: [CartController]
})
export class CartModule {}

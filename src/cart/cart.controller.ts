import {
	Body,
	Controller,
	Delete,
	Get,
	HttpCode,
	HttpStatus,
	Inject,
	Post,
    Patch,
    UseGuards,
    Param
} from '@nestjs/common';

import { AuthGuard } from 'src/auth/auth.guard';

import { RolesGuard } from 'src/auth/roles.guard';

import { Roles } from 'src/auth/roles.decorator';

import { CustomerRole } from 'src/customers/enums/CustomerRole';

import { UserRole } from 'src/users/enums/UserRole';

import { CreateCartItemDto } from './dtos/CreateCartItemDto';
import { UpdateCartItemDto } from './dtos/UpdateCartItemDto';

import { CartItem } from './entities/cart-items.entity';
import { CartService } from './cart.service';

import { Customer } from 'src/customers/entities/customer.entity';
import { GetCustomer } from 'src/customers/customer.decorator';

import { 
    FindCartResponse, 
    UpdateCartResponse 
} from './types';

@UseGuards(AuthGuard, RolesGuard)
@Controller('v1/cart-items')
export class CartController {
    constructor(
        @Inject(CartService)
        private readonly cartService: CartService,
    ) {}

    @Roles(UserRole.SuperAdmin,UserRole.Admin, CustomerRole.Customer, CustomerRole.Guest)
    @Post()
    @HttpCode(HttpStatus.CREATED)
    addToCart(
        @Body() dto: CreateCartItemDto,
        @GetCustomer() customer: Customer,
    ): Promise<CartItem> {
        return this.cartService.create(dto, customer);
    }

    @Roles(CustomerRole.Customer, CustomerRole.Guest)
    @Get()
    @HttpCode(HttpStatus.OK)
    getCart(
        @GetCustomer() customer: Customer,
    ): Promise<FindCartResponse> {
        return this.cartService.findCart(customer);
    }

    @Roles(CustomerRole.Customer, CustomerRole.Guest)
    @Patch('update/:uuid')
    @HttpCode(HttpStatus.OK)
    updateCart(
        @Param('uuid') uuid: string,
        @Body() dto: UpdateCartItemDto,
        @GetCustomer() customer: Customer,
    ): Promise<UpdateCartResponse> {
        return this.cartService.update(uuid, dto, customer);
    }

    @Roles(CustomerRole.Customer, CustomerRole.Guest)
    @Delete('remove/:uuid')
    @HttpCode(HttpStatus.OK)
    async removeFromCart(
        @Param('uuid') uuid: string,
    ): Promise<void> {
        return this.cartService.removeItem(uuid);
    }

    @Roles(CustomerRole.Customer, CustomerRole.Guest)
    @Delete()
    @HttpCode(HttpStatus.OK)
    clearCart(
        @GetCustomer() customer: Customer,
    ): Promise<void> {
        return this.cartService.clearCart(customer);
    } 
}
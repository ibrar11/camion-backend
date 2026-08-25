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
    Param,
    Query
} from '@nestjs/common';

import { AuthGuard } from '../auth/auth.guard';

import { RolesGuard } from '../auth/roles.guard';

import { Roles } from '../auth/roles.decorator';

import { CustomerRole } from '../customers/enums/CustomerRole';

import { UserRole } from '../users/enums/UserRole';
import { CurrencyCode } from '../inventory/enums/CurrencyCode.enum';

import { CreateCartItemDto } from './dtos/CreateCartItemDto';
import { AddBundleToCartDto } from './dtos/AddBundleToCartDto';
import { UpdateCartItemDto } from './dtos/UpdateCartItemDto';

import { CartItem } from './entities/cart-items.entity';
import { CartItemsService } from './cart.service';

import { Customer } from '../customers/entities/customer.entity';
import { GetCustomer } from '../customers/customer.decorator';

@UseGuards(AuthGuard, RolesGuard)
@Controller('v1/cart-items')
export class CartItemsController {
    constructor(
        @Inject(CartItemsService)
        private readonly cartService: CartItemsService,
    ) { }

    @Roles(UserRole.SuperAdmin, UserRole.Admin, CustomerRole.Customer, CustomerRole.Influencer, CustomerRole.Affiliate, CustomerRole.Guest)
    @Post()
    @HttpCode(HttpStatus.CREATED)
    addToCart(
        @Body() body: CreateCartItemDto,
        @GetCustomer() customer: Customer,
        @Query("currency") currency: CurrencyCode,
    ): Promise<CartItem> {
        return this.cartService.create(customer, body);
    }

    @Roles(UserRole.SuperAdmin, UserRole.Admin, CustomerRole.Customer, CustomerRole.Influencer, CustomerRole.Affiliate, CustomerRole.Guest)
    @Post('bundles')
    @HttpCode(HttpStatus.CREATED)
    addBundleToCart(
        @Body() body: AddBundleToCartDto,
        @GetCustomer() customer: Customer,
    ): Promise<Array<CartItem>> {
        return this.cartService.createBundle(customer, body);
    }

    @Roles(CustomerRole.Customer, CustomerRole.Influencer, CustomerRole.Affiliate, CustomerRole.Guest)
    @Get()
    @HttpCode(HttpStatus.OK)
    getCart(
        @GetCustomer() customer: Customer,
        @Query("filters") filters: string,
        @Query("sort") sort: string,
    ): Promise<Array<CartItem>> {
        return this.cartService.findCart(customer, filters, CurrencyCode.QAR, sort);
    }

    @Roles(CustomerRole.Customer, CustomerRole.Influencer, CustomerRole.Affiliate, CustomerRole.Guest)
    @Patch(':uuid')
    @HttpCode(HttpStatus.OK)
    updateCart(
        @GetCustomer() customer: Customer,
        @Param('uuid') cartItemUUID: string,
        @Body() body: UpdateCartItemDto,
    ): Promise<CartItem> {
        return this.cartService.update(customer, cartItemUUID, body);
    }

    @Roles(CustomerRole.Customer, CustomerRole.Influencer, CustomerRole.Affiliate, CustomerRole.Guest)
    @Delete(':uuid')
    @HttpCode(HttpStatus.OK)
    async removeFromCart(
        @Param('uuid') cartItemUUID: string,
    ): Promise<void> {
        return this.cartService.removeItem(cartItemUUID);
    }

    @Roles(CustomerRole.Customer, CustomerRole.Influencer, CustomerRole.Affiliate, CustomerRole.Guest)
    @Delete()
    @HttpCode(HttpStatus.OK)
    clearCart(
        @GetCustomer() customer: Customer,
    ): Promise<void> {
        return this.cartService.clearCart(customer);
    }
}

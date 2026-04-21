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
import { UpdateCartItemDto } from './dtos/UpdateCartItemDto';

import { CartItem } from './entities/cart-items.entity';
import { CartItemsService } from './cart.service';

import { Customer } from '../customers/entities/customer.entity';
import { GetCustomer } from '../customers/customer.decorator';

import {
    UpdateCartResponse,
    ValidatedCartItem
} from './types';

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
        @Body() dto: CreateCartItemDto,
        @GetCustomer() customer: Customer,
        @Query("currency") currency: CurrencyCode,
    ): Promise<CartItem> {
        return this.cartService.create(dto, customer, currency);
    }

    @Roles(CustomerRole.Customer, CustomerRole.Influencer, CustomerRole.Affiliate, CustomerRole.Guest)
    @Get()
    @HttpCode(HttpStatus.OK)
    getCart(
        @GetCustomer() customer: Customer,
        @Query("filters") filters: string,
        @Query("sort") sort: string,
        @Query("pageNumber") pageNumber: number,
        @Query("itemsPerPage") itemsPerPage: number,
    ): Promise<Array<ValidatedCartItem>> {
        return this.cartService.findCart(customer, filters, sort, pageNumber, itemsPerPage);
    }

    @Roles(CustomerRole.Customer, CustomerRole.Influencer, CustomerRole.Affiliate, CustomerRole.Guest)
    @Patch(':uuid')
    @HttpCode(HttpStatus.OK)
    updateCart(
        @Param('uuid') uuid: string,
        @Body() dto: UpdateCartItemDto,
        @GetCustomer() customer: Customer,
        @Query("currency") currency: CurrencyCode,
    ): Promise<UpdateCartResponse> {
        return this.cartService.update(uuid, dto, customer, currency);
    }

    @Roles(CustomerRole.Customer, CustomerRole.Influencer, CustomerRole.Affiliate, CustomerRole.Guest)
    @Delete(':uuid')
    @HttpCode(HttpStatus.OK)
    async removeFromCart(
        @Param('uuid') uuid: string,
    ): Promise<void> {
        return this.cartService.removeItem(uuid);
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
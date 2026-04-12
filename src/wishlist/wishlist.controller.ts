import {
    Body,
    Controller,
    Delete,
    Get,
    HttpCode,
    HttpStatus,
    Param,
    Post,
    UseGuards
} from '@nestjs/common';

import { AuthGuard } from 'src/auth/auth.guard';
import { RolesGuard } from 'src/auth/roles.guard';

import { GetCustomer } from 'src/customers/customer.decorator';
import { Roles } from 'src/auth/roles.decorator';

import { UserRole } from 'src/users/enums/UserRole';
import { CustomerRole } from 'src/customers/enums/CustomerRole';

import { CreateWishlistDto } from './dtos/CreateWishListDto';

import { Customer } from 'src/customers/entities/customer.entity';

import { WishlistItem } from './entities/wishlist.entity';
import { WishlistService } from './wishlist.service';

@UseGuards(AuthGuard, RolesGuard)
@Controller('v1/wishlist')
export class WishlistController {
    constructor(private readonly wishlistService: WishlistService) { }

    @Roles(UserRole.SuperAdmin, UserRole.Admin, CustomerRole.Customer, CustomerRole.Guest)
    @Post()
    @HttpCode(HttpStatus.CREATED)
    async create(
        @GetCustomer() customer: Customer,
        @Body() dto: CreateWishlistDto,
    ): Promise<WishlistItem> {
        return await this.wishlistService.addToWishlist(customer, dto);
    }

    @Roles(UserRole.SuperAdmin, UserRole.Admin, CustomerRole.Customer, CustomerRole.Guest)
    @Get()
    @HttpCode(HttpStatus.OK)
    async get(
        @GetCustomer() customer: Customer,
    ): Promise<Array<WishlistItem>> {
        return await this.wishlistService.getWishlist(customer);
    }

    @Roles(UserRole.SuperAdmin, UserRole.Admin, CustomerRole.Customer, CustomerRole.Guest)
    @Get(':uuid')
    @HttpCode(HttpStatus.OK)
    async getOne(
        @GetCustomer() customer: Customer,
        @Param('uuid') uuid: string,
    ): Promise<WishlistItem> {
        return await this.wishlistService.getWishlistItem(customer, uuid);
    }

    @Roles(UserRole.SuperAdmin, UserRole.Admin, CustomerRole.Customer, CustomerRole.Guest)
    @Delete('remove/:uuid')
    @HttpCode(HttpStatus.OK)
    async remove(
        @GetCustomer() customer: Customer,
        @Param('uuid') productUuid: string,
    ): Promise<void> {
        return await this.wishlistService.removeFromWishlist(customer, productUuid);
    }

    @Roles(UserRole.SuperAdmin, UserRole.Admin, CustomerRole.Customer, CustomerRole.Guest)
    @Delete()
    @HttpCode(HttpStatus.OK)
    async clear(
        @GetCustomer() customer: Customer,
    ): Promise<void> {
        return await this.wishlistService.clearWishList(customer);
    }
}

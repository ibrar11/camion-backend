import {
    Body,
    Controller,
    Delete,
    Get,
    HttpCode,
    HttpStatus,
    Param,
    Post,
    Query,
    UseGuards
} from '@nestjs/common';

import { AuthGuard } from '../auth/auth.guard';
import { RolesGuard } from '../auth/roles.guard';

import { GetCustomer } from '../customers/customer.decorator';
import { Roles } from '../auth/roles.decorator';

import { CustomerRole } from '../customers/enums/CustomerRole';

import { CreateWishlistDto } from './dtos/CreateWishListDto';

import { Customer } from '../customers/entities/customer.entity';

import { WishlistItem } from './entities/wishlist.entity';
import { WishlistService } from './wishlist.service';
import { CurrencyCode } from 'src/inventory/enums/CurrencyCode.enum';

@UseGuards(AuthGuard, RolesGuard)
@Controller('v1/wishlist')
export class WishlistController {
    constructor(private readonly wishlistService: WishlistService) { }

    @Roles(CustomerRole.Customer, CustomerRole.Influencer, CustomerRole.Affiliate)
    @Post()
    @HttpCode(HttpStatus.CREATED)
    async create(
        @GetCustomer() customer: Customer,
        @Body() dto: CreateWishlistDto,
    ): Promise<WishlistItem> {
        return await this.wishlistService.addToWishlist(customer, dto);
    }

    @Roles(CustomerRole.Customer, CustomerRole.Influencer, CustomerRole.Affiliate)
    @Get()
    @HttpCode(HttpStatus.OK)
    async get(
        @GetCustomer() customer: Customer,
        @Query("filters") filters: string,
        @Query("sort") sort: string,
        @Query("pageNumber") pageNumber: number,
        @Query("itemsPerPage") itemsPerPage: number,
    ): Promise<Array<WishlistItem>> {
        return await this.wishlistService.getWishlist(customer, filters, CurrencyCode.QAR, sort, pageNumber, itemsPerPage);
    }

    @Roles(CustomerRole.Customer, CustomerRole.Influencer, CustomerRole.Affiliate)
    @Get(':uuid')
    @HttpCode(HttpStatus.OK)
    async getOne(
        @GetCustomer() customer: Customer,
        @Param('uuid') wishlistItemUUID: string,
    ): Promise<WishlistItem> {
        return await this.wishlistService.getWishlistItem(customer, wishlistItemUUID);
    }

    @Roles(CustomerRole.Customer, CustomerRole.Influencer, CustomerRole.Affiliate)
    @Delete(':uuid')
    @HttpCode(HttpStatus.OK)
    async remove(
        @GetCustomer() customer: Customer,
        @Param('uuid') wishlistItemUUID: string,
    ): Promise<void> {
        return await this.wishlistService.removeFromWishlist(customer, wishlistItemUUID);
    }

    @Roles(CustomerRole.Customer, CustomerRole.Influencer, CustomerRole.Affiliate)
    @Delete()
    @HttpCode(HttpStatus.OK)
    async clear(
        @GetCustomer() customer: Customer,
    ): Promise<void> {
        return await this.wishlistService.clearWishList(customer);
    }
}

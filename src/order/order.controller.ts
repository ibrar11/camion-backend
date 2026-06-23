import {
    Body,
    Controller,
    Delete,
    Get,
    HttpCode,
    HttpStatus,
    Inject,
    Param,
    Patch,
    Post,
    Query,
    UseGuards
} from '@nestjs/common';

import { AuthGuard } from '../auth/auth.guard';

import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { CustomerRole } from '../customers/enums/CustomerRole';
import { CurrencyCode } from '../inventory/enums/CurrencyCode.enum';

import { GetCustomer } from '../customers/customer.decorator';

import { OrderStatus } from './enums/OrderStatus';

import { CreateOrderDto } from './dtos/CreateOrderDto';

import { Order } from './entities/order.entity';
import { OrderService } from './order.service';

import { Customer } from '../customers/entities/customer.entity';
import { UserRole } from '../users/enums/UserRole';

import { OrderPreviewResponse, OrderTrackingResponse } from './types';

@UseGuards(AuthGuard, RolesGuard)
@Controller('v1/orders')
export class OrderController {
    constructor(@Inject(OrderService) private readonly orderService: OrderService) { }

    @Roles(CustomerRole.Customer, CustomerRole.Affiliate, CustomerRole.Influencer)
    @Post()
    @HttpCode(HttpStatus.CREATED)
    create(
        @GetCustomer() customer: Customer,
        @Body() dto: CreateOrderDto,
    ): Promise<Order> {
        return this.orderService.create(customer, dto);
    }

    @Roles(UserRole.SuperAdmin, UserRole.Admin, CustomerRole.Customer, CustomerRole.Affiliate, CustomerRole.Influencer)
    @Get()
    @HttpCode(HttpStatus.OK)
    findAll(
        @GetCustomer() customer: Customer,
        @Query("filters") filters: string,
        @Query("sort") sort: string,
        @Query("pageNumber") pageNumber: number,
        @Query("itemsPerPage") itemsPerPage: number,
        @Query("status") status: OrderStatus,
    ): Promise<Array<Order>> {
        if (customer) {
            return this.orderService.findAllByCustomer(customer.uuid, filters, sort, pageNumber, itemsPerPage, status);
        }
        return this.orderService.findAll(filters, sort, pageNumber, itemsPerPage, status);
    }


    @Roles(CustomerRole.Customer, CustomerRole.Affiliate, CustomerRole.Influencer)
    @Get('order-preview')
    orderPreview(
        @GetCustomer() customer: Customer,
        @Query("couponCode") couponCode: string,
        @Query("currency") currencyCode: CurrencyCode,
    ): Promise<OrderPreviewResponse> {
        return this.orderService.orderPreview(customer, currencyCode, couponCode)
    }

    @Roles(UserRole.SuperAdmin, UserRole.Admin, CustomerRole.Customer, CustomerRole.Affiliate, CustomerRole.Influencer)
    @Get(':uuid')
    @HttpCode(HttpStatus.OK)
    findOne(@Param('uuid') uuid: string): Promise<Order> {
        return this.orderService.findOne(uuid);
    }

    @Roles(UserRole.SuperAdmin, UserRole.Admin, CustomerRole.Customer, CustomerRole.Affiliate, CustomerRole.Influencer)
    @Get(':uuid/tracking')
    @HttpCode(HttpStatus.OK)
    getTracking(
        @Param('uuid') uuid: string,
        @GetCustomer() customer: Customer,
        @Query('lang') lang: string = 'en',
    ): Promise<OrderTrackingResponse> {
        const customerUuid = customer?.uuid ?? undefined;
        return this.orderService.getOrderTracking(uuid, customerUuid, lang);
    }

@Roles(UserRole.SuperAdmin, UserRole.Admin)
    @Patch(':uuid/status')
    @HttpCode(HttpStatus.OK)
    updateStatus(
        @Param('uuid') uuid: string,
        @Body('status') status: OrderStatus,
        @Body('cancellationReason') cancellationReason?: string,
    ): Promise<Order> {
        return this.orderService.updateStatus(uuid, status, cancellationReason);
    }

    @Roles(UserRole.SuperAdmin, UserRole.Admin, CustomerRole.Customer, CustomerRole.Affiliate, CustomerRole.Influencer)
    @Delete(':uuid')
    @HttpCode(HttpStatus.OK)
    cancel(@Param('uuid') uuid: string): Promise<void> {
        return this.orderService.cancel(uuid);
    }
}

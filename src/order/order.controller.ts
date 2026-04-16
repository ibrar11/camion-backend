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

import { AuthGuard } from 'src/auth/auth.guard';

import { RolesGuard } from 'src/auth/roles.guard';
import { Roles } from 'src/auth/roles.decorator';
import { CustomerRole } from 'src/customers/enums/CustomerRole';

import { GetCustomer } from 'src/customers/customer.decorator';

import { OrderStatus } from './enums/OrderStatus';

import { CreateOrderDto } from './dtos/CreateOrderDto';

import { Order } from './entities/order.entity';
import { OrderService } from './order.service';

import { Customer } from 'src/customers/entities/customer.entity';
import { UserRole } from 'src/users/enums/UserRole';

import { OrderPreviewResponse } from './types';

@UseGuards(AuthGuard, RolesGuard)
@Controller('v1/orders')
export class OrderController {
    constructor(@Inject(OrderService) private readonly orderService: OrderService) { }

    @Roles(UserRole.SuperAdmin, UserRole.Admin, CustomerRole.Customer, CustomerRole.Affiliate, CustomerRole.Influencer)
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
    ): Promise<Array<Order>> {
        if (customer) {
            return this.orderService.findAllByCustomer(customer.uuid, filters, sort, pageNumber, itemsPerPage);
        }
        return this.orderService.findAll(filters, sort, pageNumber, itemsPerPage);
    }


    @Roles(UserRole.SuperAdmin, UserRole.Admin, CustomerRole.Customer, CustomerRole.Affiliate, CustomerRole.Influencer)
    @Get('order-preview')
    orderPreview(
        @GetCustomer() customer: Customer,
    ): Promise<OrderPreviewResponse> {
        return this.orderService.orderPreview(customer)
    }

    @Roles(UserRole.SuperAdmin, UserRole.Admin, CustomerRole.Customer, CustomerRole.Affiliate, CustomerRole.Influencer)
    @Get(':uuid')
    @HttpCode(HttpStatus.OK)
    findOne(@Param('uuid') uuid: string): Promise<Order> {
        return this.orderService.findOne(uuid);
    }

    @Roles(UserRole.SuperAdmin, UserRole.Admin)
    @Patch(':uuid/status')
    @HttpCode(HttpStatus.OK)
    updateStatus(
        @Param('uuid') uuid: string,
        @Body('status') status: OrderStatus,
    ): Promise<Order> {
        return this.orderService.updateStatus(uuid, status);
    }

    @Roles(UserRole.SuperAdmin, UserRole.Admin, CustomerRole.Customer, CustomerRole.Affiliate, CustomerRole.Influencer)
    @Delete(':uuid')
    @HttpCode(HttpStatus.OK)
    cancel(@Param('uuid') uuid: string): Promise<void> {
        return this.orderService.cancel(uuid);
    }
}

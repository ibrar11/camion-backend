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
    UseGuards
} from '@nestjs/common';

import { AuthGuard } from 'src/auth/auth.guard';

import { GetCustomer } from 'src/customers/customer.decorator';

import { OrderStatus } from './enums/OrderStatus';

import { CreateOrderDto } from './dtos/CreateOrderDto';

import { Order } from './entities/order.entity';
import { OrderService } from './order.service';

import { Customer } from 'src/customers/entities/customer.entity';

@UseGuards(AuthGuard)
@Controller('v1/orders')
export class OrderController {
    constructor(@Inject(OrderService) private readonly orderService: OrderService) { }

    @Post()
    @HttpCode(HttpStatus.CREATED)
    create(
        @GetCustomer() customer: Customer,
        @Body() dto: CreateOrderDto,
    ): Promise<Order> {
        return this.orderService.create(customer, dto);
    }

    @Get()
    @HttpCode(HttpStatus.OK)
    findAll() {
        return this.orderService.findAll();
    }

    @Get(':uuid/orders')
    @HttpCode(HttpStatus.OK)
    findMyOrders(
        @Param('uuid') customerUuid: string
    ) {
        return this.orderService.myOrders(customerUuid);
    }

    @Get(':uuid')
    @HttpCode(HttpStatus.OK)
    findOne(@Param('uuid') uuid: string): Promise<Order> {
        return this.orderService.findOne(uuid);
    }

    @Patch(':uuid/status')
    @HttpCode(HttpStatus.OK)
    updateStatus(
        @Param('uuid') uuid: string,
        @Body('status') status: OrderStatus,
    ): Promise<Order> {
        return this.orderService.updateStatus(uuid, status);
    }

    @Delete(':uuid')
    @HttpCode(HttpStatus.OK)
    cancel(@Param('uuid') uuid: string): Promise<void> {
        return this.orderService.cancel(uuid);
    }
}

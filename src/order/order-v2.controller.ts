import {
    Body,
    Controller,
    Get,
    Inject,
    Post,
    Query,
    UseGuards
} from '@nestjs/common';

import { AuthGuard } from '../auth/auth.guard';

import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { CustomerRole } from '../customers/enums/CustomerRole';

import { GetCustomer } from '../customers/customer.decorator';

import { OrderServiceV2 } from './order-v2.service';

import { Customer } from '../customers/entities/customer.entity';

import { OrderPreviewResponse } from './types';

import { OrderPreviewV2Dto } from './dtos/OrderPreviewV2Dto';

@UseGuards(AuthGuard, RolesGuard)
@Controller('v2/orders')
export class OrderV2Controller {
    constructor(@Inject(OrderServiceV2) private readonly orderServiceV2: OrderServiceV2) { }

    @Roles(CustomerRole.Customer, CustomerRole.Affiliate, CustomerRole.Influencer)
    @Post('order-preview')
    orderPreview(
        @GetCustomer() customer: Customer,
        @Body() body: OrderPreviewV2Dto,
    ): Promise<OrderPreviewResponse> {
        return this.orderServiceV2.orderPreviewV2(customer, body)
    }

}

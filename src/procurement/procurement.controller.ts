import {
    Controller,
    Get,
    UseGuards,
    Query,
    Param,
    Post,
    Body,
    HttpCode,
    HttpStatus
} from '@nestjs/common';

import { ImportProductDto } from './dtos/ImportProductDto';
import { CreateProcurementOrderDto } from './dtos/CreateProcurementOrderDto';
import { BulkCreateProcurementOrderDto } from './dtos/BulkCreateProcurementOrderDto';

import { UserRole } from '../users/enums/UserRole';

import { ProcurementService } from './procurement.service';

import { AuthGuard } from '../auth/auth.guard';
import { RolesGuard } from '../auth/roles.guard';

import { Roles } from '../auth/roles.decorator';

import {
    SearchProducts,
    ProductDetail,
    CreateOrderResponse,
    BulkCreateOrderResponse,
} from './types';

@UseGuards(AuthGuard, RolesGuard)
@Controller('v1/procurement')
export class ProcurementController {
    constructor(private readonly procurementService: ProcurementService) { }

    @Roles(UserRole.SuperAdmin, UserRole.Admin)
    @Get()
    search(
        @Query("keyword") keyword: string,
        @Query("pageNumber") pageNumber: string,
        @Query("itemsPerPage") itemsPerPage: string,
        @Query("sort") sort: string,
        @Query("priceStart") priceStart: string,
        @Query("priceEnd") priceEnd: string,
    ): Promise<SearchProducts> {
        return this.procurementService.searchProduct(keyword, pageNumber, itemsPerPage, sort, priceStart, priceEnd);
    }

    @Roles(UserRole.SuperAdmin, UserRole.Admin)
    @Get(':productId')
    detail(
        @Param('productId') productId: string,
    ): Promise<ProductDetail> {
        return this.procurementService.getProductDetail(productId);
    }

    @Roles(UserRole.SuperAdmin, UserRole.Admin)
    @Post('import')
    @HttpCode(HttpStatus.OK)
    importProducts(
        @Body() body: ImportProductDto
    ) {
        return this.procurementService.importProduct(body)
    }

    @Roles(UserRole.SuperAdmin, UserRole.Admin)
    @Post('order')
    @HttpCode(HttpStatus.OK)
    createOrder(
        @Body() body: CreateProcurementOrderDto
    ): Promise<CreateOrderResponse> {
        return this.procurementService.createOrder(body);
    }

    @Roles(UserRole.SuperAdmin, UserRole.Admin)
    @Post('order/bulk')
    @HttpCode(HttpStatus.OK)
    bulkCreateOrder(
        @Body() body: BulkCreateProcurementOrderDto
    ): Promise<BulkCreateOrderResponse> {
        return this.procurementService.bulkCreateOrder(body);
    }
}

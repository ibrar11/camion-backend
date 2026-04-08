import {
    Controller,
    Get,
    UseGuards,
    Query,
    Param
} from '@nestjs/common';

import { UserRole } from 'src/users/enums/UserRole';

import { ProcurementService } from './procurement.service';

import { AuthGuard } from 'src/auth/auth.guard';
import { RolesGuard } from 'src/auth/roles.guard';

import { Roles } from 'src/auth/roles.decorator';

import {
    SearchProducts,
    ProductDetail
} from './types';

@UseGuards(AuthGuard, RolesGuard)
@Controller('v1/procurement')
export class ProcurementController {
    constructor(private readonly procurementService: ProcurementService) { }

    @Get()
    @Roles(UserRole.SuperAdmin, UserRole.Admin)
    search(
        @Query("keyword") keyword: string,
        @Query("pageNumber") pageNumber: string,
        @Query("itemsPerPage") itemsPerPage: string,
        @Query("sort") sort: string,
        @Query("priceStart") priceStart: string,
        @Query("priceEnd") priceEnd: string,
    ): Promise<Array<SearchProducts>> {
        return this.procurementService.searchProduct(keyword, pageNumber, itemsPerPage, sort, priceStart, priceEnd);
    }

    @Get(':productId')
    @Roles(UserRole.SuperAdmin, UserRole.Admin)
    detail(
        @Param('productId') productId: string,
    ): Promise<ProductDetail> {
        return this.procurementService.getProductDetail(productId);
    }
}

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

    @Roles(UserRole.SuperAdmin, UserRole.Admin)
    @Get()
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
}

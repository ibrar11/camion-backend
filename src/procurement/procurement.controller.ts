import { 
    Controller, 
    Get, 
    UseGuards ,
    Query,
    Param
} from '@nestjs/common';

import { SearchProductsDto } from './dtos/SearchProductsDto';

import { UserRole } from 'src/users/enums/UserRole';

import { ProcurementService } from './procurement.service';

import { AuthGuard } from 'src/auth/auth.guard';
import { RolesGuard } from 'src/auth/roles.guard';

import { Roles } from 'src/auth/roles.decorator';

@UseGuards(AuthGuard, RolesGuard)
@Controller('v1/procurement')
export class ProcurementController {
    constructor(private readonly procurementService: ProcurementService) {}

    @Get()
    @Roles(UserRole.SuperAdmin, UserRole.Admin)
    search(
        @Query() dto: SearchProductsDto,
    ) {
        return this.procurementService.searchProducts(dto);
    }

    @Get(':productId')
    @Roles(UserRole.SuperAdmin, UserRole.Admin)
    detail(
        @Param('productId') productId: string,
    ) {
        return this.procurementService.getProductDetail(productId);
    }
}

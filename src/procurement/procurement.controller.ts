import { 
    Body, 
    Controller, 
    Post, 
    UseGuards ,
    Headers,
    Query
} from '@nestjs/common';

import { SearchProductsDto } from './dtos/SearchProductsDto';
import { ProductDetailDto } from './dtos/ProductDetailDto';

import { UserRole } from 'src/users/enums/UserRole';

import { ProcurementService } from './procurement.service';

import { AuthGuard } from 'src/auth/auth.guard';
import { RolesGuard } from 'src/auth/roles.guard';

import { Roles } from 'src/auth/roles.decorator';

@UseGuards(AuthGuard, RolesGuard)
@Controller('v1/procurement')
export class ProcurementController {
    constructor(private readonly procurementService: ProcurementService) {}

    @Post('search')
    @Roles(UserRole.SuperAdmin, UserRole.Admin)
    search(
        @Body() dto: SearchProductsDto,
        @Headers('accept-language') acceptLanguage?: string,
        @Query('lang') langQuery?: string,
        @Query('currencyCode') currencyQuery?: string
    ) {
        const language = langQuery || (acceptLanguage?.split('-')[0]) || 'en';
        return this.procurementService.searchProducts(dto, language, currencyQuery);
    }

    @Post('detail')
    @Roles(UserRole.SuperAdmin, UserRole.Admin)
    detail(
        @Body() dto: ProductDetailDto,
        @Headers('accept-language') acceptLanguage?: string,
        @Query('lang') langQuery?: string,
        @Query('currencyCode') currencyQuery?: string
    ) {
        const language = langQuery || (acceptLanguage?.split('-')[0]) || 'en';
        return this.procurementService.getProductDetail(dto, language, currencyQuery);
    }
}

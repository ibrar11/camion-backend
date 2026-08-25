import {
  Body,
  Controller,
  HttpCode,
  HttpStatus,
  Inject,
  Patch,
  UseGuards,
} from "@nestjs/common";

import { ProductVariantService } from "./product-variant.service";

import { AuthGuard } from "../auth/auth.guard";
import { RolesGuard } from "../auth/roles.guard";

import { Roles } from '../auth/roles.decorator';

import { ClientRole } from "../clients/enums/client-role.enum";
import { BulkStockUpdateDto } from "./dtos/BulkStockUpdateDto";

@UseGuards(AuthGuard, RolesGuard)
@Controller('v1/variants')
export class VariantController {
  constructor(@Inject(ProductVariantService) private readonly variantService: ProductVariantService) { }

  @Roles(ClientRole.StockTracker)
  @Patch('bulk-stock-update')
  @HttpCode(HttpStatus.OK)
  async bulkStockUpdate(@Body() dto: BulkStockUpdateDto) {
    return this.variantService.bulkStockUpdate(dto);
  }
}

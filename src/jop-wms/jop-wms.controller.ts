import {
    Body,
    Controller,
    Get,
    HttpCode,
    HttpStatus,
    Param,
    Post,
    Put,
    Query,
    UseGuards,
} from '@nestjs/common';

import { JopWmsOrderType } from './entities/jop-wms-order.entity';
import { DispatchOrdersDto } from './dtos/DispatchOrdersDto';
import { RecoverInboundDto } from './dtos/RecoverInboundDto';

import { AuthGuard } from '../auth/auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { UserRole } from '../users/enums/UserRole';

import { JopWmsService } from './jop-wms.service';

import { SyncProductDto } from './dtos/SyncProductDto';
import { QueryProductDto } from './dtos/QueryProductDto';
import { CreateInboundOrderDto } from './dtos/CreateInboundOrderDto';
import { InboundOrderStatusDto } from './dtos/InboundOrderStatusDto';
import { GetInboundLabelDto } from './dtos/GetInboundLabelDto';
import { CancelOrderDto } from './dtos/CancelOrderDto';
import { CreateOutboundOrderDto } from './dtos/CreateOutboundOrderDto';
import { EstimateShippingDto } from './dtos/EstimateShippingDto';
import { QueryInventoryDto } from './dtos/QueryInventoryDto';
import { GetLogisticsDto } from './dtos/GetLogisticsDto';
import { CreateReturnOrderDto } from './dtos/CreateReturnOrderDto';
import { QueryReturnOrderDto } from './dtos/QueryReturnOrderDto';

@UseGuards(AuthGuard, RolesGuard)
@Controller('v1/wms')
export class JopWmsController {
    constructor(private readonly wmsService: JopWmsService) { }

    // ─── Products ─────────────────────────────────────────────────────────────

    @Roles(UserRole.SuperAdmin, UserRole.Admin)
    @Post('products/sync')
    @HttpCode(HttpStatus.OK)
    syncProduct(@Body() body: SyncProductDto) {
        return this.wmsService.syncProduct(body);
    }

    @Roles(UserRole.SuperAdmin, UserRole.Admin)
    @Get('products')
    @HttpCode(HttpStatus.OK)
    queryProducts(@Query() query: QueryProductDto) {
        return this.wmsService.queryProducts(query);
    }

    // ─── Inbound ──────────────────────────────────────────────────────────────

    @Roles(UserRole.SuperAdmin, UserRole.Admin)
    @Post('inbound')
    @HttpCode(HttpStatus.CREATED)
    createInboundOrder(@Body() body: CreateInboundOrderDto) {
        return this.wmsService.createInboundOrder(body);
    }

    @Roles(UserRole.SuperAdmin, UserRole.Admin)
    @Get('inbound/status')
    @HttpCode(HttpStatus.OK)
    getInboundStatus(@Query() query: InboundOrderStatusDto) {
        return this.wmsService.getInboundOrderStatus(query);
    }

    @Roles(UserRole.SuperAdmin, UserRole.Admin)
    @Post('inbound/:customerVoucherNo/cancel')
    @HttpCode(HttpStatus.OK)
    cancelInboundOrder(
        @Param('customerVoucherNo') customerVoucherNo: string,
        @Body() body: CancelOrderDto,
    ) {
        return this.wmsService.cancelInboundOrder(customerVoucherNo, body);
    }

    @Roles(UserRole.SuperAdmin, UserRole.Admin)
    @Get('inbound/label')
    @HttpCode(HttpStatus.OK)
    getInboundLabel(@Query() query: GetInboundLabelDto) {
        return this.wmsService.getInboundOrderLabel(query);
    }

    @Roles(UserRole.SuperAdmin, UserRole.Admin)
    @Post('inbound/:orderNo/retry-outbound')
    @HttpCode(HttpStatus.OK)
    retryOutboundForInbound(@Param('orderNo') orderNo: string) {
        return this.wmsService.retryOutboundForInbound(orderNo);
    }

    // ─── Outbound ─────────────────────────────────────────────────────────────

    @Roles(UserRole.SuperAdmin, UserRole.Admin)
    @Post('outbound')
    @HttpCode(HttpStatus.CREATED)
    createOutboundOrder(@Body() body: CreateOutboundOrderDto) {
        return this.wmsService.createOutboundOrder(body);
    }

    @Roles(UserRole.SuperAdmin, UserRole.Admin)
    @Get('outbound/:customerVoucherNo/status')
    @HttpCode(HttpStatus.OK)
    getOutboundStatus(@Param('customerVoucherNo') customerVoucherNo: string) {
        return this.wmsService.getOutboundOrderStatus(customerVoucherNo);
    }

    @Roles(UserRole.SuperAdmin, UserRole.Admin)
    @Post('outbound/:customerVoucherNo/cancel')
    @HttpCode(HttpStatus.OK)
    cancelOutboundOrder(
        @Param('customerVoucherNo') customerVoucherNo: string,
        @Body() body: CancelOrderDto,
    ) {
        return this.wmsService.cancelOutboundOrder(customerVoucherNo, body);
    }

    @Roles(UserRole.SuperAdmin, UserRole.Admin)
    @Post('outbound/estimate-shipping')
    @HttpCode(HttpStatus.OK)
    estimateShipping(@Body() body: EstimateShippingDto) {
        return this.wmsService.estimateShipping(body);
    }

    // ─── Inventory ────────────────────────────────────────────────────────────

    @Roles(UserRole.SuperAdmin, UserRole.Admin)
    @Get('inventory')
    @HttpCode(HttpStatus.OK)
    queryInventory(@Query() query: QueryInventoryDto) {
        return this.wmsService.queryInventory(query);
    }

    // ─── Logistics ────────────────────────────────────────────────────────────

    @Roles(UserRole.SuperAdmin, UserRole.Admin)
    @Get('logistics')
    @HttpCode(HttpStatus.OK)
    getLogistics(@Query() query: GetLogisticsDto) {
        return this.wmsService.getLogisticsChannels(query);
    }

    // ─── Waybill ──────────────────────────────────────────────────────────────

    @Roles(UserRole.SuperAdmin, UserRole.Admin)
    @Get('waybill/:customerVoucherNo')
    @HttpCode(HttpStatus.OK)
    queryWaybill(@Param('customerVoucherNo') customerVoucherNo: string) {
        return this.wmsService.queryWaybill(customerVoucherNo);
    }

    // ─── Returns ──────────────────────────────────────────────────────────────

    @Roles(UserRole.SuperAdmin, UserRole.Admin)
    @Post('returns')
    @HttpCode(HttpStatus.CREATED)
    createReturnOrder(@Body() body: CreateReturnOrderDto) {
        return this.wmsService.createReturnOrder(body);
    }

    @Roles(UserRole.SuperAdmin, UserRole.Admin)
    @Get('returns')
    @HttpCode(HttpStatus.OK)
    queryReturnOrder(@Query() query: QueryReturnOrderDto) {
        return this.wmsService.queryReturnOrder(query);
    }

    // ─── Dispatch ─────────────────────────────────────────────────────────────

    @Roles(UserRole.SuperAdmin, UserRole.Admin)
    @Post('orders/dispatch')
    @HttpCode(HttpStatus.ACCEPTED)
    dispatchApprovedOrders(@Body() body: DispatchOrdersDto) {
        return this.wmsService.dispatchApprovedOrders(body);
    }

    @Roles(UserRole.SuperAdmin, UserRole.Admin)
    @Post('orders/:uuid/retry-outbound')
    @HttpCode(HttpStatus.OK)
    retryOutboundForOrder(@Param('uuid') uuid: string) {
        return this.wmsService.retryOutboundForOrder(uuid);
    }

    @Roles(UserRole.SuperAdmin, UserRole.Admin)
    @Post('orders/:uuid/dispatch-missing')
    @HttpCode(HttpStatus.OK)
    dispatchMissingItems(@Param('uuid') uuid: string) {
        return this.wmsService.dispatchMissingItems(uuid);
    }

    // ─── Recovery ─────────────────────────────────────────────────────────────

    @Roles(UserRole.SuperAdmin)
    @Get('inbound/unlinked-orders')
    @HttpCode(HttpStatus.OK)
    getUnlinkedOrders(@Query('before') before?: string) {
        return this.wmsService.getUnlinkedOrders(before);
    }

    @Roles(UserRole.SuperAdmin)
    @Put('inbound/:orderNo/recover')
    @HttpCode(HttpStatus.OK)
    recoverInbound(
        @Param('orderNo') orderNo: string,
        @Body() body: RecoverInboundDto,
    ) {
        return this.wmsService.recoverInbound(orderNo, body);
    }

    // ─── Polling state ────────────────────────────────────────────────────────

    @Roles(UserRole.SuperAdmin, UserRole.Admin)
    @Get('orders')
    @HttpCode(HttpStatus.OK)
    getTrackedOrders(@Query('type') type?: JopWmsOrderType) {
        return this.wmsService.getTrackedOrders(type);
    }

    // ─── Order Links ──────────────────────────────────────────────────────────

    @Roles(UserRole.SuperAdmin, UserRole.Admin)
    @Get('order-links')
    @HttpCode(HttpStatus.OK)
    getOrderLinks() {
        return this.wmsService.getOrderLinks();
    }
}

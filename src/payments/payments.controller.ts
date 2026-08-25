import { 
    Body, 
    Controller, 
    Get, 
    HttpCode, 
    HttpStatus, 
    Param, 
    Post, 
    Req, 
    UseGuards
} from "@nestjs/common";

import { CreatePaymentDto } from "./dtos/CreatePaymentDto";
import { CreateSkipCashSessionDto } from "./dtos/CreateSkipCashSessionDto";

import { PaymentTransaction } from "./entities/payment-transaction.entity";
import { PaymentsService } from "./payments.service";

import { UserRole } from "../users/enums/UserRole";
import { CustomerRole } from "../customers/enums/CustomerRole";

import { AuthGuard } from "../auth/auth.guard";
import { RolesGuard } from "../auth/roles.guard";

import { Roles } from "../auth/roles.decorator";

import { Customer } from "../customers/entities/customer.entity";

import { SkipCashSessionService } from "./skipcash-session.service";
import { SkipcashSdkResultDto } from "./dtos/SkipcashSdkResultDto";


@UseGuards(AuthGuard, RolesGuard)
@Controller("v1/payments")
export class PaymentsController {
    constructor(
        private readonly paymentsService: PaymentsService,
        private readonly skipCashSessionService: SkipCashSessionService,
    ) {}

    @Roles(UserRole.SuperAdmin, UserRole.Admin)
    @Post()
    @HttpCode(HttpStatus.CREATED)
    create(@Body() dto: CreatePaymentDto): Promise<PaymentTransaction> {
        return this.paymentsService.createPayment(dto);
    }

    @Roles(CustomerRole.Customer, CustomerRole.Affiliate, CustomerRole.Influencer)
    @Post("result")
    @HttpCode(HttpStatus.CREATED)
    paymentResult(@Body() dto: SkipcashSdkResultDto): Promise<PaymentTransaction> {
        return this.paymentsService.paymentResult(dto);
    }

    @Roles(CustomerRole.Customer, CustomerRole.Affiliate, CustomerRole.Influencer)
    @Post('skipcash/session')
    @HttpCode(HttpStatus.CREATED)
    async createSkipCashSession(
        @Req() req: Request & { customer: Customer },
        @Body() dto: CreateSkipCashSessionDto,
    ): Promise<any> {
        return this.skipCashSessionService.createSession(req.customer.uuid, dto);
    }

    @Roles(CustomerRole.Customer, CustomerRole.Affiliate, CustomerRole.Influencer)
    @Get('skipcash/session/:sessionId')
    @HttpCode(HttpStatus.OK)
    async getSkipCashSessionStatus(
        @Param('sessionId') sessionId: string,
    ): Promise<any> {
        return this.skipCashSessionService.getSessionStatus(sessionId);
    }

    @Roles(UserRole.SuperAdmin, UserRole.Admin)
    @Get()
    getPayments(): Promise<Array<PaymentTransaction>> {
        return this.paymentsService.findAll();
    }
}
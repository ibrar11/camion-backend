import { 
    Body, 
    Controller, 
    Get, 
    Post, 
    UseGuards
} from "@nestjs/common";

import { CreatePaymentDto } from "./dtos/CreatePaymentDto";

import { PaymentTransaction } from "./entities/payment-transaction.entity";
import { PaymentsService } from "./payments.service";

import { UserRole } from "../users/enums/UserRole";

import { AuthGuard } from "../auth/auth.guard";
import { RolesGuard } from "../auth/roles.guard";

import { Roles } from "../auth/roles.decorator";


@UseGuards(AuthGuard, RolesGuard)
@Controller("v1/payments")
export class PaymentsController {
    constructor(private readonly paymentsService: PaymentsService) {}

    @Roles(UserRole.SuperAdmin, UserRole.Admin)
    @Post()
    create(@Body() dto: CreatePaymentDto): Promise<PaymentTransaction> {
        return this.paymentsService.createPayment(dto);
    }

    @Roles(UserRole.SuperAdmin, UserRole.Admin)
    @Get()
    getPayments(): Promise<Array<PaymentTransaction>> {
        return this.paymentsService.findAll();
    }
}
import { 
    Body, 
    Controller, 
    Post, 
    UseGuards
} from "@nestjs/common";

import { CreatePaymentDto } from "./dtos/CreatePaymentDto";

import { PaymentsService } from "./payments.service";

import { UserRole } from "src/users/enums/UserRole";

import { AuthGuard } from "src/auth/auth.guard";
import { RolesGuard } from "src/auth/roles.guard";

import { Roles } from "src/auth/roles.decorator";

@UseGuards(AuthGuard, RolesGuard)
@Controller("v1/payments")
export class PaymentsController {
    constructor(private readonly paymentsService: PaymentsService) {}

    @Roles(UserRole.SuperAdmin, UserRole.Admin)
    @Post()
    create(@Body() dto: CreatePaymentDto) {
        return this.paymentsService.createPayment(dto);
    }
}
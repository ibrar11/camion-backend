import { 
    Controller, 
    Inject, 
    Post, 
    UseGuards
} from '@nestjs/common';

import { AuthGuard } from 'src/auth/auth.guard';
import { RolesGuard } from 'src/auth/roles.guard';

import { Roles } from 'src/auth/roles.decorator';

import { UserRole } from 'src/users/enums/UserRole';
import { CustomerRole } from 'src/customers/enums/CustomerRole';

import { CheckoutService } from './checkout.service';

@UseGuards(AuthGuard, RolesGuard)
@Controller('v1/checkout')
export class CheckoutController {
    constructor(@Inject(CheckoutService) private readonly checkoutService: CheckoutService) { }

    @Roles(UserRole.SuperAdmin, UserRole.Admin, CustomerRole.Customer)
    @Post()
    checkout() { }
}

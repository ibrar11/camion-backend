import {
    Controller,
    Delete,
    Get,
    HttpCode,
    HttpStatus,
    Param,
    Patch,
    Query,
    Req,
    UseGuards,
} from '@nestjs/common';

import { Request } from 'express';

import { AuthGuard } from '../auth/auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';

import { CustomerRole } from '../customers/enums/CustomerRole';

import { Customer } from '../customers/entities/customer.entity';

import { SavedCard } from './entities/saved-card.entity';
import { SavedCardsService } from './saved-cards.service';

@UseGuards(AuthGuard, RolesGuard)
@Controller('v1/customers/me/saved-cards')
export class SavedCardsController {
    constructor(private readonly savedCardsService: SavedCardsService) { }

    @Roles(CustomerRole.Customer, CustomerRole.Affiliate, CustomerRole.Influencer)
    @Get()
    @HttpCode(HttpStatus.OK)
    async getSavedCards(
        @Req() req: Request & { customer: Customer },
        @Query("pageNumber") pageNumber: number,
        @Query("itemsPerPage") itemsPerPage: number,
    ): Promise<SavedCard[]> {
        return this.savedCardsService.getSavedCards(req.customer.uuid, pageNumber, itemsPerPage);
    }

    @Roles(CustomerRole.Customer, CustomerRole.Affiliate, CustomerRole.Influencer)
    @Delete(':uuid')
    @HttpCode(HttpStatus.OK)
    async deleteSavedCard(
        @Req() req: Request & { customer: Customer },
        @Param('uuid') cardUuid: string,
    ): Promise<{ success: boolean }> {
        await this.savedCardsService.deleteSavedCard(req.customer.uuid, cardUuid);
        return { success: true };
    }

    @Roles(CustomerRole.Customer, CustomerRole.Affiliate, CustomerRole.Influencer)
    @Patch(':uuid/default')
    @HttpCode(HttpStatus.OK)
    async setDefaultCard(
        @Req() req: Request & { customer: Customer },
        @Param('uuid') cardUuid: string,
    ): Promise<SavedCard> {
        return this.savedCardsService.setDefaultCard(req.customer.uuid, cardUuid);
    }
}
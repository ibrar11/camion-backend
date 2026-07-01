import {
	Body,
	Controller,
	Delete,
	Get,
	HttpCode,
	HttpStatus,
	Inject,
	Param,
	Post,
	Put,
	Query,
	UseGuards,
} from '@nestjs/common';

import { CreatePromoDto } from './dtos/CreatePromoDto';
import { UpdatePromoDto } from './dtos/UpdatePromoDto';

import { Promo } from './entities/promo.entity';
import { PromosService } from './promos.service';

import { UserRole } from '../users/enums/UserRole';

import { AuthGuard } from '../auth/auth.guard';
import { RolesGuard } from '../auth/roles.guard';

import { Roles } from '../auth/roles.decorator';

@UseGuards(AuthGuard, RolesGuard)
@Controller('v1/promos')
export class PromosController {
	constructor(@Inject(PromosService) private readonly promoService: PromosService) { }

	@Roles(UserRole.SuperAdmin, UserRole.Admin, UserRole.Manager)
	@Post()
	@HttpCode(HttpStatus.CREATED)
	actionCreatePromo(@Body() body: CreatePromoDto): Promise<Promo> {
		return this.promoService.createPromo(body);
	}

	@Roles(UserRole.SuperAdmin, UserRole.Admin, UserRole.Manager)
	@Get()
	@HttpCode(HttpStatus.OK)
	actionGetPromos(
		@Query("filters") filters: string,
		@Query("sort") sort: string,
		@Query("pageNumber") pageNumber: number,
		@Query("itemsPerPage") itemsPerPage: number,
	): Promise<Array<Promo>> {
		return this.promoService.findAllUncached(filters, sort, pageNumber, itemsPerPage);
	}

	@Roles(UserRole.SuperAdmin, UserRole.Admin, UserRole.Manager)
	@Get(':uuid')
	@HttpCode(HttpStatus.OK)
	actionGetPromo(@Param('uuid') uuid: string): Promise<Promo> {
		return this.promoService.findOne(uuid);
	}

	@Roles(UserRole.SuperAdmin, UserRole.Admin, UserRole.Manager)
	@Put(':uuid')
	@HttpCode(HttpStatus.OK)
	actionUpdatePromos(@Param('uuid') uuid: string, @Body() body: UpdatePromoDto): Promise<Promo> {
		return this.promoService.updateOne(uuid, body);
	}

	@Roles(UserRole.SuperAdmin, UserRole.Admin, UserRole.Manager)
	@Delete(':uuid')
	@HttpCode(HttpStatus.OK)
	actionDeletePromo(@Param('uuid') uuid: string): Promise<void> {
		return this.promoService.delete(uuid);
	}
}

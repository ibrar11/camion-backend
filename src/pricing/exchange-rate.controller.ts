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
} from "@nestjs/common";

import { CreateExchangeRateDto } from "./dtos/CreateExchangeRateDto";
import { UpdateExchangeRateDto } from "./dtos/UpdateExchangeRateDto";

import { UserRole } from "../users/enums/UserRole";

import { ExchangeRate } from "./entities/exchange-rate.entity";
import { ExchangeRateService } from "./exchange-rate.service";

import { AuthGuard } from "../auth/auth.guard";
import { RolesGuard } from "../auth/roles.guard";

import { Roles } from "../auth/roles.decorator";

@UseGuards(AuthGuard, RolesGuard)
@Controller('v1/exchange-rates')
export class ExchangeRateController {
	constructor(@Inject(ExchangeRateService) private readonly exchangeRateService: ExchangeRateService) { }

	@Roles(UserRole.SuperAdmin, UserRole.Admin, UserRole.Manager)
	@Post()
	@HttpCode(HttpStatus.CREATED)
	actionCreateExchangeRate(@Body() body: CreateExchangeRateDto): Promise<ExchangeRate> {
		return this.exchangeRateService.createExchangeRate(body);
	}

	@Roles(UserRole.SuperAdmin, UserRole.Admin, UserRole.Manager)
	@Get()
	@HttpCode(HttpStatus.OK)
	actionGetExchangeRates(
		@Query("filters") filters: string,
		@Query("sort") sort: string,
		@Query("pageNumber") pageNumber: number,
		@Query("itemsPerPage") itemsPerPage: number,
	): Promise<Array<ExchangeRate>> {
		return this.exchangeRateService.findAll(filters, sort, pageNumber, itemsPerPage);
	}

	@Roles(UserRole.SuperAdmin, UserRole.Admin, UserRole.Manager)
	@Get(':uuid')
	@HttpCode(HttpStatus.OK)
	actionGetExchangeRate(@Param('uuid') uuid: string): Promise<ExchangeRate> {
		return this.exchangeRateService.findOne(uuid);
	}

	@Roles(UserRole.SuperAdmin, UserRole.Admin, UserRole.Manager)
	@Put(':uuid')
	@HttpCode(HttpStatus.OK)
	actionUpdateExchangeRate(@Param('uuid') uuid: string, @Body() body: UpdateExchangeRateDto): Promise<ExchangeRate> {
		return this.exchangeRateService.updateOne(uuid, body);
	}

	@Roles(UserRole.SuperAdmin, UserRole.Admin, UserRole.Manager)
	@Delete(':uuid')
	@HttpCode(HttpStatus.OK)
	actionDeleteExchangeRate(@Param('uuid') uuid: string): Promise<void> {
		return this.exchangeRateService.delete(uuid);
	}
}

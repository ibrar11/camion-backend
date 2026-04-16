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
	UseGuards,
} from "@nestjs/common";

import { AuthGuard } from "src/auth/auth.guard";
import { RolesGuard } from "src/auth/roles.guard";
import { Roles } from "src/auth/roles.decorator";
import { UserRole } from "src/users/enums/UserRole";

import { CurrenciesService } from "./currencies.service";
import { CreateCurrencyDto } from "./dtos/CreateCurrencyDto";
import { UpdateCurrencyDto } from "./dtos/UpdateCurrencyDto";
import { Currency } from "./entities/currency.entity";

@UseGuards(AuthGuard, RolesGuard)
@Controller("v1/currencies")
export class CurrenciesController {
	constructor(@Inject(CurrenciesService) private readonly currenciesService: CurrenciesService) {}

	@Roles(UserRole.SuperAdmin, UserRole.Admin)
	@Post()
	@HttpCode(HttpStatus.CREATED)
	actionCreate(@Body() body: CreateCurrencyDto): Promise<Currency> {
		return this.currenciesService.create(body);
	}

	@Get()
	@HttpCode(HttpStatus.OK)
    async actionGetCurrencies(): Promise<Currency[]> {
        return this.currenciesService.findAllCurrencies();
    }

	@Roles(UserRole.SuperAdmin, UserRole.Admin)
	@Put(":uuid")
	@HttpCode(HttpStatus.OK)
	actionUpdate(@Param("uuid") uuid: string, @Body() body: UpdateCurrencyDto): Promise<Currency> {
		return this.currenciesService.update(uuid, body);
	}

	@Roles(UserRole.SuperAdmin, UserRole.Admin)
	@Delete(":uuid")
	@HttpCode(HttpStatus.OK)
	actionDelete(@Param("uuid") uuid: string): Promise<void> {
		return this.currenciesService.delete(uuid);
	}
}

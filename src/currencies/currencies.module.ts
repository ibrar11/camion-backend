import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";

import { Currency } from "./entities/currency.entity";
import { CurrenciesService } from "./currencies.service";
import { CurrenciesController } from "./currencies.controller";
import { CurrenciesResolver } from "./currencies.resolver";

import { UsersModule } from "src/users/users.module";
import { AuthModule } from "src/auth/auth.module";
import { ClientsModule } from "src/clients/clients.module";
import { CustomersModule } from "src/customers/customers.module";

@Module({
	imports: [
		TypeOrmModule.forFeature([Currency]),
		AuthModule,
		UsersModule,
		ClientsModule,
		CustomersModule,
	],
	providers: [CurrenciesService, CurrenciesResolver],
	controllers: [CurrenciesController],
	exports: [CurrenciesService],
})
export class CurrenciesModule { }

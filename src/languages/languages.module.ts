import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";

import { AuthModule } from "src/auth/auth.module";
import { UsersModule } from "src/users/users.module";
import { ClientsModule } from "src/clients/clients.module";
import { CustomersModule } from "src/customers/customers.module";

import { Language } from "./entities/language.entity";
import { LanguagesService } from "./languages.service";
import { LanguagesController } from "./languages.controller";
import { LanguagesResolver } from "./languages.resolver";

@Module({
	imports: [
		TypeOrmModule.forFeature([Language]),
		AuthModule,
		UsersModule,
		ClientsModule,
		CustomersModule,
	],
	providers: [LanguagesService, LanguagesResolver],
	controllers: [LanguagesController],
	exports: [LanguagesService],
})
export class LanguagesModule {}

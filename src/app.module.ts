import * as fs from "node:fs";
import * as path from "node:path";

import { ConfigModule, ConfigService, } from "@nestjs/config";
import { JwtModule } from "@nestjs/jwt";
import { Module } from '@nestjs/common';

import { TypeOrmModule } from "@nestjs/typeorm";
import { CacheModule } from "@nestjs/cache-manager";

import KeyvRedis from "@keyv/redis";

import { AppController } from './app.controller';
import { AppService } from './app.service';

import { AuthModule } from './auth/auth.module';

import { User } from './users/entities/user.entity';
import { UsersModule } from './users/users.module';

import { Customer } from "./customers/entities/customer.entity";
import { CustomersModule } from './customers/customers.module';

import { RegistrationRequest } from "./auth/entities/registration-request.entity";
import { ClientsModule } from "./clients/clients.module";
import { Client } from './clients/entities/client.entity';

@Module({
	imports: [
		ConfigModule.forRoot({
			isGlobal: true,
		}),
		CacheModule.registerAsync({
			isGlobal: true,
			imports: [ConfigModule],
			inject: [ConfigService],
			useFactory: (configService: ConfigService) => {
				return {
					stores: [
						new KeyvRedis(configService.get<string>('REDIS_URI')),
					],
				};
			},
		}),
		TypeOrmModule.forRootAsync({
			imports: [ConfigModule],
			inject: [ConfigService],
			useFactory: (configService: ConfigService) => ({
				type: "postgres",
				host: configService.get<string>("DB_HOST"),
				port: configService.get<number>("DB_PORT"),
				username: configService.get<string>("DB_USERNAME"),
				password: configService.get<string>("DB_PASSWORD"),
				database: configService.get<string>("DB_DATABASE"),
				entities: [
					User,
					Customer,
					RegistrationRequest,
					Client,
				],
				synchronize: true,
			}),
		}),
		JwtModule.registerAsync({
			global: true,
			imports: [ConfigModule],
			inject: [ConfigService],
			useFactory: (configService: ConfigService) => ({
				privateKey: fs.readFileSync(path.join(process.cwd(), "certs/private.pem"), "utf-8"),
				publicKey: fs.readFileSync(path.join(process.cwd(), "certs/public.pem"), "utf-8"),
				signOptions: {
					algorithm: "RS256",
					expiresIn: configService.get<number>('JWT_EXPIRES_IN') ?? 2592000,
					issuer: configService.get<string>('JWT_ISSUER'),
				},
				verifyOptions: {
					algorithms: ["RS256"],
				},
			}),
		}),
		AuthModule,
		UsersModule,
		CustomersModule,
		ClientsModule,
	],
	controllers: [AppController],
	providers: [AppService],
})
export class AppModule { }

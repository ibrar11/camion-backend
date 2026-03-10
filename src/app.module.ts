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

import { Product } from "./products/entities/product.entity";
import { ProductOption } from "./products/entities/product-option.entity";
import { ProductOptionValue } from "./products/entities/product-option-value.entity";
import { ProductVariant } from "./products/entities/product-variant.entity";
import { ProductVariantImage } from "./products/entities/product-variant-image.entity";
import { ProductVariantInventoryItem } from "./products/entities/product-variant-inventory-item.entity";
import { ProductVariantOptionValue } from "./products/entities/product-variant-option-value.entity";
import { ProductsModule } from './products/products.module';

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

					Product,
					ProductOption,
					ProductOptionValue,
					ProductVariant,
					ProductVariantImage,
					ProductVariantInventoryItem,
					ProductVariantOptionValue,
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
		ProductsModule,
	],
	controllers: [AppController],
	providers: [AppService],
})
export class AppModule { }

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
import { CustomerAddress } from "./customers/entities/customer-address.entity";
import { CustomersModule } from './customers/customers.module';

import { LoginRequest } from "./auth/entities/login-request.entity";

import { Client } from './clients/entities/client.entity';
import { ClientsModule } from "./clients/clients.module";
import { Category } from "./inventory/entities/category.entity";

import { Product } from "./inventory/entities/product.entity";
import { ProductCategory } from "./inventory/entities/product-category.entity";
import { ProductOption } from "./inventory/entities/product-option.entity";
import { ProductOptionValue } from "./inventory/entities/product-option-value.entity";
import { ProductVariant } from "./inventory/entities/product-variant.entity";
import { ProductVariantImage } from "./inventory/entities/product-variant-image.entity";
import { ProductVariantInventoryItem } from "./inventory/entities/product-variant-inventory-item.entity";
import { ProductVariantOptionValue } from "./inventory/entities/product-variant-option-value.entity";

import { InventoryItem } from "./inventory/entities/inventory-item.entity";
import { InventoryLevel } from "./inventory/entities/inventory-level.entity";

import { Warehouse } from "./inventory/entities/warehouse.entity";

import { InventoryModule } from './inventory/inventory.module';
import { HealthModule } from './health/health.module';

import { OauthModule } from './oauth/oauth.module';

import { ClientRefreshToken } from './oauth/entities/oauth-refresh-token.entity';

import { CartItem } from "./cart/entities/cart-items.entity";
import { CartModule } from './cart/cart.module';

import { ProcurementModule } from './procurement/procurement.module';

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
				ssl: configService.get<string>("NODE_ENV") === "local"
					? false
					: {
						rejectUnauthorized: false,
						ca: fs.readFileSync(path.join(process.cwd(), "ca/global-bundle.pem"), "utf-8"),
					},
				host: configService.get<string>("DB_HOST"),
				port: configService.get<number>("DB_PORT"),
				username: configService.get<string>("DB_USERNAME"),
				password: configService.get<string>("DB_PASSWORD"),
				database: configService.get<string>("DB_DATABASE"),
				entities: [
					User,

					Customer,
					CustomerAddress,

					Client,

					LoginRequest,

					Category,

					Product,
					ProductCategory,
					ProductOption,
					ProductOptionValue,
					ProductVariant,
					ProductVariantImage,
					ProductVariantInventoryItem,
					ProductVariantOptionValue,

					InventoryItem,
					InventoryLevel,

					Warehouse,

                    ClientRefreshToken,

					CartItem,
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
		InventoryModule,
		HealthModule,
		OauthModule,
		CartModule,
		ProcurementModule,
	],
	controllers: [AppController],
	providers: [AppService],
})
export class AppModule { }

import * as fs from "node:fs";
import * as path from "node:path";

import { Module } from '@nestjs/common';

import {
	ConfigModule,
	ConfigService,
} from "@nestjs/config";

import { JwtModule } from "@nestjs/jwt";
import { TypeOrmModule } from "@nestjs/typeorm";
import { CacheModule } from "@nestjs/cache-manager";
import { GraphQLModule } from "@nestjs/graphql";

import {
	ApolloDriver,
	ApolloDriverConfig,
} from "@nestjs/apollo";

import { ScheduleModule } from '@nestjs/schedule';

import KeyvRedis from "@keyv/redis";

import { Keyv } from "keyv";
import { Cacheable, CacheableMemory } from "cacheable";

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
import { ProductReview } from "./inventory/entities/product-review.entity";
import { ProductVariant } from "./inventory/entities/product-variant.entity";
import { ProductVariantImage } from "./inventory/entities/product-variant-image.entity";
import { ProductVariantInventoryItem } from "./inventory/entities/product-variant-inventory-item.entity";
import { ProductVariantOptionValue } from "./inventory/entities/product-variant-option-value.entity";

import { InventoryItem } from "./inventory/entities/inventory-item.entity";
import { InventoryLevel } from "./inventory/entities/inventory-level.entity";

import { Warehouse } from "./inventory/entities/warehouse.entity";

import { InventoryModule } from './inventory/inventory.module';

import { Post } from 'src/posts/entities/post.entity';
import { PostsModule } from './posts/posts.module';

import { HealthModule } from './health/health.module';

import { OauthModule } from './oauth/oauth.module';

import { ClientRefreshToken } from './oauth/entities/oauth-refresh-token.entity';

import { CartItem } from "./cart/entities/cart-items.entity";
import { CartModule } from './cart/cart.module';

import { ProcurementModule } from './procurement/procurement.module';

import { Story } from "./stories/entities/story.entity";
import { StoryFrame } from "./stories/entities/story-frame.entity";
import { StoriesModule } from './stories/stories.module';

import { Banner } from "./banners/entities/banner.entity";
import { BannersModule } from './banners/banners.module';

import { Currency } from "./currencies/entities/currency.entity";
import { CurrenciesModule } from './currencies/currencies.module';

import { Language } from "./languages/entities/language.entity";
import { LanguagesModule } from './languages/languages.module';

import { Notification } from "./notifications/entities/notification.entity";
import { NotificationsModule } from './notifications/notifications.module';

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
						new Keyv({
							store: new CacheableMemory({ ttl: 6000, lruSize: 5000, }),
						}),
						// new KeyvRedis(configService.get<string>('REDIS_URI')),
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
					ProductReview,
					ProductVariant,
					ProductVariantImage,
					ProductVariantInventoryItem,
					ProductVariantOptionValue,

					InventoryItem,
					InventoryLevel,

					Warehouse,

					Currency,

					Language,
                    
                    Post,

					ClientRefreshToken,

					CartItem,

					Story,
					StoryFrame,

					Banner,

                    Notification,
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
		GraphQLModule.forRoot<ApolloDriverConfig>({
			driver: ApolloDriver,
			graphiql: true,
			autoSchemaFile: path.join(process.cwd(), "src/graphql/schema.gql"),
			sortSchema: true,
			context: ({ req }) => ({ req }),
		}),
		AuthModule,
		UsersModule,
		CustomersModule,
		ClientsModule,
		InventoryModule,
		PostsModule,
		HealthModule,
		OauthModule,
		CartModule,
		ProcurementModule,
		StoriesModule,
		BannersModule,
		CurrenciesModule,
		LanguagesModule,
        NotificationsModule,
		ScheduleModule.forRoot(),
	],
	controllers: [AppController],
	providers: [AppService],
})
export class AppModule { }

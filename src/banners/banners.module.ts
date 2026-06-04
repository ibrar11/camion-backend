import { Module } from '@nestjs/common';

import { TypeOrmModule } from '@nestjs/typeorm';

import { S3Service } from 'src/common/s3.service';
import { FileService } from 'src/common/file.service';

import { Banner } from './entities/banner.entity';
import { BannerCategory } from './entities/banner-category';
import { BannersService } from './banners.service';
import { BannersController } from './banners.controller';
import { BannersResolver } from './banners.resolver';

import { Customer } from '../customers/entities/customer.entity';
import { CustomersService } from '../customers/customers.service';

import { User } from '../users/entities/user.entity';
import { UsersService } from '../users/users.service';

import { Category } from 'src/inventory/entities/category.entity';

import { ClientsModule } from '../clients/clients.module';

@Module({
	imports: [
		TypeOrmModule.forFeature([
			Banner,
			BannerCategory,
			User,
			Customer,
			Category,
		]),
		ClientsModule,
	],
	exports: [
		BannersService
	],
	providers: [
		S3Service,
		UsersService,
		CustomersService,
		BannersService,
		BannersResolver,
		FileService,
	],
	controllers: [BannersController]
})
export class BannersModule { }

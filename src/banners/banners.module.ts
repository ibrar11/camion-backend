import { Module } from '@nestjs/common';

import { TypeOrmModule } from '@nestjs/typeorm';

import { S3Service } from 'src/common/s3.service';

import { Banner } from './entities/banner.entity';
import { BannersService } from './banners.service';
import { BannersController } from './banners.controller';

import { Customer } from 'src/customers/entities/customer.entity';
import { CustomersService } from 'src/customers/customers.service';

import { User } from 'src/users/entities/user.entity';
import { UsersService } from 'src/users/users.service';
import { BannersResolver } from './banners.resolver';

@Module({
	imports: [
		TypeOrmModule.forFeature([
			Banner,
			User,
			Customer,
		]),
	],
	providers: [
		S3Service,
		UsersService,
		CustomersService,
		BannersService,
		BannersResolver,
	],
	controllers: [BannersController]
})
export class BannersModule { }

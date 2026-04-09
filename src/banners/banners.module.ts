import { Module } from '@nestjs/common';

import { TypeOrmModule } from '@nestjs/typeorm';

import { S3Service } from 'src/common/s3.service';

import { Banner } from './entities/banner.entity';
import { BannersService } from './banners.service';
import { BannersController } from './banners.controller';
import { BannersResolver } from './banners.resolver';

import { Customer } from '../customers/entities/customer.entity';
import { CustomersService } from '../customers/customers.service';

import { User } from '../users/entities/user.entity';
import { UsersService } from '../users/users.service';

import { ClientsModule } from '../clients/clients.module';

@Module({
	imports: [
		TypeOrmModule.forFeature([
			Banner,
			User,
			Customer,
		]),
		ClientsModule,
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

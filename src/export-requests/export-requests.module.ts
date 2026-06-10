import { Module } from '@nestjs/common';

import { TypeOrmModule } from '@nestjs/typeorm';

import { S3Service } from '../common/s3.service';
import { FileService } from '../common/file.service';

import { ExportRequest } from './entities/export-request.entity';
import { ExportRequestsService } from './export-requests.service';
import { ExportRequestsController } from './export-requests.controller';

import { ExportTaskService } from './scheduled-tasks/ExportTaskService';

import { User } from '../users/entities/user.entity';
import { UsersService } from '../users/users.service';

import { InventoryModule } from '../inventory/inventory.module';
import { CustomersModule } from '../customers/customers.module';
import { ClientsModule } from '../clients/clients.module';
import { PricingModule } from '../pricing/pricing.module';

@Module({
	imports: [
		TypeOrmModule.forFeature([
			ExportRequest,
			User,
		]),
		ClientsModule,
		InventoryModule,
		CustomersModule,
		PricingModule,
	],
	providers: [
		ExportRequestsService,
		UsersService,
		ExportTaskService,
		S3Service,
		FileService,
	],
	controllers: [ExportRequestsController]
})
export class ExportRequestsModule { }

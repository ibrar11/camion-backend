import { Module } from '@nestjs/common';

import { TypeOrmModule } from '@nestjs/typeorm';

import { Campaign } from './entities/campaign.entity';
import { CampaignCategory } from './entities/campaign-category.entity';
import { CampaignsService } from './campaigns.service';
import { CampaignsResolver } from './campaigns.resolver';
import { CampaignsController } from './campaigns.controller';

import { Category } from '../inventory/entities/category.entity';

import { User } from '../users/entities/user.entity';
import { UsersService } from '../users/users.service';

import { Customer } from '../customers/entities/customer.entity';
import { CustomersService } from '../customers/customers.service';

import { ClientsModule } from '../clients/clients.module';

@Module({
	imports: [
		TypeOrmModule.forFeature([
			Campaign,
			CampaignCategory,
			Category,
			User,
			Customer,
		]),
		ClientsModule,
	],
	exports:[
		CampaignsService,
	],
	providers: [
		CampaignsService,
		CampaignsResolver,
		UsersService,
		CustomersService,
	],
	controllers: [CampaignsController]
})
export class CampaignsModule { }

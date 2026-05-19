import { Module } from '@nestjs/common';

import { BannersModule } from '../banners/banners.module';
import { CustomersModule } from '../customers/customers.module';
import { InventoryModule } from '../inventory/inventory.module';
import { OrderModule } from '../order/order.module';
import { StoriesModule } from '../stories/stories.module';

import { DataService } from './data.service';
import { DataController } from './data.controller';

@Module({
	imports: [
		BannersModule,
		CustomersModule,
		InventoryModule,
		OrderModule,
		StoriesModule,
	],
	controllers: [DataController],
	providers: [DataService],
})
export class DataModule { }

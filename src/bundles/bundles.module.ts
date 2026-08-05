import { Module } from '@nestjs/common';

import { TypeOrmModule } from '@nestjs/typeorm';

import { Bundle } from './entities/bundle.entity';
import { BundlesService } from './bundles.service';
import { BundlesController } from './bundles.controller';
import { BundleItem } from './entities/bundle-item.entity';

@Module({
	imports: [
		TypeOrmModule.forFeature([
			Bundle,
			BundleItem
		]),
	],
	providers: [BundlesService],
	controllers: [BundlesController]
})
export class BundlesModule { }

import { Module } from '@nestjs/common';

import { TypeOrmModule } from '@nestjs/typeorm';

import { User } from '../users/entities/user.entity';
import { UsersService } from '../users/users.service';

import { Customer } from '../customers/entities/customer.entity';
import { CustomersService } from '../customers/customers.service';

import { ProcurementService } from './procurement.service';
import { ProcurementController } from './procurement.controller';

import { ClientsModule } from '../clients/clients.module';

import { Category } from '../inventory/entities/category.entity';

import { ProductCategory } from '../inventory/entities/product-category.entity';

import { Product } from '../inventory/entities/product.entity';
import { ProductsService } from '../inventory/products.service';

import { ProductOption } from '../inventory/entities/product-option.entity';
import { ProductOptionService } from '../inventory/product-option.service';

import { ProductOptionValue } from '../inventory/entities/product-option-value.entity';
import { ProductOptionValueService } from '../inventory/product-option-value.service';

import { ProductVariant } from '../inventory/entities/product-variant.entity';
import { ProductVariantService } from '../inventory/product-variant.service';

import { ProductVariantImage } from '../inventory/entities/product-variant-image.entity';
import { ProductVariantImageService } from '../inventory/product-variant-image.service';

import { ProductView } from '../inventory/entities/product-view.entity';

import { ProductVariantOptionValue } from '../inventory/entities/product-variant-option-value.entity';

import { InventoryItem } from '../inventory/entities/inventory-item.entity';

import { InventoryLevel } from '../inventory/entities/inventory-level.entity';

import { Warehouse } from '../inventory/entities/warehouse.entity';

import { Order } from '../order/entities/order.entity';

import { S3Service } from '../common/s3.service';
import { FileService } from '../common/file.service';
import { ImageThumbnailService } from '../common/image-thumbnail.service';

import { QueueModule } from '../queue/queue.module';
import { InventoryResyncProcessor } from './workers/inventory-resync.processor';

import { TranslationService } from '../translation/translation.service';

import { TranslationJobRegistryService } from '../translation/translation-job-registry.service';

@Module({
	imports: [
		TypeOrmModule.forFeature([
			Category,
			Customer,
			InventoryItem,
			InventoryLevel,
			Order,
			Product,
			ProductCategory,
			ProductOption,
			ProductOptionValue,
			ProductVariant,
			ProductVariantImage,
			ProductVariantOptionValue,
			ProductView,
			User,
			Warehouse,
		]),
		ClientsModule,
		QueueModule,
	],
	providers: [
		UsersService,
		CustomersService,
		ProcurementService,
		Product,
		ProductsService,
		ProductOptionService,
		ProductOptionValueService,
		ProductVariantService,
		ProductVariantImageService,
		S3Service,
		FileService,
		ImageThumbnailService,
		TranslationService,
		InventoryResyncProcessor,
		TranslationJobRegistryService,
	],
	controllers: [ProcurementController],
	exports: [ProcurementService],
})
export class ProcurementModule {}

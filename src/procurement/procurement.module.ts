import { Module } from '@nestjs/common';

import { TypeOrmModule } from '@nestjs/typeorm';

import { User } from 'src/users/entities/user.entity';
import { UsersService } from 'src/users/users.service';

import { Customer } from 'src/customers/entities/customer.entity';
import { CustomersService } from 'src/customers/customers.service';

import { ProcurementService } from './procurement.service';
import { ProcurementController } from './procurement.controller';

import { ClientsModule } from '../clients/clients.module';

import { Category } from 'src/inventory/entities/category.entity';

import { ProductCategory } from 'src/inventory/entities/product-category.entity';

import { Product } from 'src/inventory/entities/product.entity';
import { ProductsService } from 'src/inventory/products.service';

import { ProductOption } from 'src/inventory/entities/product-option.entity';
import { ProductOptionService } from 'src/inventory/product-option.service';

import { ProductOptionValue } from 'src/inventory/entities/product-option-value.entity';
import { ProductOptionValueService } from 'src/inventory/product-option-value.service';

import { ProductVariant } from 'src/inventory/entities/product-variant.entity';
import { ProductVariantService } from 'src/inventory/product-variant.service';

import { ProductVariantImage } from 'src/inventory/entities/product-variant-image.entity';
import { ProductVariantImageService } from 'src/inventory/product-variant-image.service';

import { ProductVariantOptionValue } from 'src/inventory/entities/product-variant-option-value.entity';

import { InventoryItem } from 'src/inventory/entities/inventory-item.entity';

import { InventoryLevel } from 'src/inventory/entities/inventory-level.entity';

import { Warehouse } from 'src/inventory/entities/warehouse.entity';

import { S3Service } from 'src/common/s3.service';

@Module({
	imports: [
		TypeOrmModule.forFeature([
			User,
			Customer, 
			Category,
			Product,
			ProductCategory,
			ProductOption,
			ProductOptionValue,
			ProductVariant,
			ProductVariantImage,
			ProductVariantOptionValue,
			InventoryItem,
			InventoryLevel,
			Warehouse,
		]),
		ClientsModule,
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
	],
	controllers: [ProcurementController]
})
export class ProcurementModule {}

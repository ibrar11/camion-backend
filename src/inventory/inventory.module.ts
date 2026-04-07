import { Module } from '@nestjs/common';

import { TypeOrmModule } from '@nestjs/typeorm';

import { User } from '../users/entities/user.entity';
import { UsersService } from 'src/users/users.service';

import { Customer } from 'src/customers/entities/customer.entity';
import { CustomersService } from 'src/customers/customers.service';

import { Category } from './entities/category.entity';
import { CategoryService } from './category.service';
import { CategoryController } from './category.controller';

import { Product } from './entities/product.entity';
import { ProductsService } from './products.service';
import { ProductsController } from './products.controller';

import { ProductCategory } from './entities/product-category.entity';

import { ProductVariant } from './entities/product-variant.entity';
import { ProductVariantService } from './product-variant.service';
import { ProductVariantController } from './product-variant.controller';

import { ProductOption } from './entities/product-option.entity';
import { ProductOptionService } from './product-option.service';
import { ProductOptionController } from './product-option.controller';

import { ProductOptionValue } from './entities/product-option-value.entity';
import { ProductOptionValueService } from './product-option-value.service';
import { ProductOptionValueController } from './product-option-value.controller';

import { ProductVariantImage } from './entities/product-variant-image.entity';
import { ProductVariantImageService } from './product-variant-image.service';
import { ProductVariantImageController } from './product-variant-image.controller';

import { ProductVariantInventoryItem } from './entities/product-variant-inventory-item.entity';
import { ProductVariantOptionValue } from './entities/product-variant-option-value.entity';

import { InventoryItem } from './entities/inventory-item.entity';
import { InventoryLevel } from './entities/inventory-level.entity';

import { Warehouse } from './entities/warehouse.entity';
import { WarehouseService } from './warehouse.service';
import { WarehouseController } from './warehouse.controller';

import { CartItem } from 'src/cart/entities/cart-items.entity';

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
			ProductVariantInventoryItem,
			ProductVariantOptionValue,
			InventoryItem,
			InventoryLevel,
			Warehouse,
			CartItem
		]),
	],
	providers: [
		UsersService,
		CustomersService,
		CategoryService,
		ProductsService,
		ProductVariantService,
		ProductOptionService,
		ProductOptionValueService,
		ProductVariantImageService,
		WarehouseService,
	],
	controllers: [
		CategoryController,
		ProductsController,
		ProductVariantController,
		ProductOptionController,
		ProductOptionValueController,
		ProductVariantImageController,
		WarehouseController,
	],
})
export class InventoryModule { }

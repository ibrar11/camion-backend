import { Module } from '@nestjs/common';

import { TypeOrmModule } from '@nestjs/typeorm';

import { S3Service } from '../common/s3.service';
import { FileService } from '../common/file.service';
import { ImageThumbnailService } from '../common/image-thumbnail.service';

import { User } from '../users/entities/user.entity';
import { UsersService } from '../users/users.service';

import { Customer } from '../customers/entities/customer.entity';
import { CustomersService } from '../customers/customers.service';

import { Category } from './entities/category.entity';
import { CategoriesService } from './categories.service';
import { CategoriesController } from './categories.controller';
import { CategoriesResolver } from './categories.resolver';

import { Product } from './entities/product.entity';
import { ProductsService } from './products.service';
import { ProductsController } from './products.controller';
import {
	ProductsResolver,
	ProductOptionResolver,
	ProductOptionValueResolver,
	ProductVariantResolver,
	ProductVariantImageResolver,
	ProductReviewImageResolver,
} from './products.resolver';

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

import { ProductReview } from './entities/product-review.entity';
import { ProductReviewService } from './product-review.service';
import { ProductReviewController } from './product-review.controller';

import { ProductReviewImage } from './entities/product-review-image.entity';
import { ProductReviewImageService } from './product-review-image.service';

import { ProductVariantInventoryItem } from './entities/product-variant-inventory-item.entity';
import { ProductVariantOptionValue } from './entities/product-variant-option-value.entity';

import { InventoryItem } from './entities/inventory-item.entity';
import { InventoryLevel } from './entities/inventory-level.entity';

import { Warehouse } from './entities/warehouse.entity';
import { WarehouseService } from './warehouse.service';
import { WarehouseController } from './warehouse.controller';

import { ClientsModule } from '../clients/clients.module';

import { CartItem } from '../cart/entities/cart-items.entity';

import { PricingModule } from '../pricing/pricing.module';

import { Translation } from '../translation/entities/translation.entity';

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
			ProductReview,
			ProductReviewImage,
			ProductVariant,
			ProductVariantImage,
			ProductVariantInventoryItem,
			ProductVariantOptionValue,
			InventoryItem,
			InventoryLevel,
			Warehouse,
			CartItem,
			Translation
		]),
		ClientsModule,
		PricingModule,
	],
	providers: [
		S3Service,
		UsersService,
		CustomersService,
		CategoriesService,
		CategoriesResolver,
		ProductOptionResolver,
		ProductOptionService,
		ProductOptionValueResolver,
		ProductOptionValueService,
		ProductReviewImageResolver,
		ProductReviewImageService,
		ProductReviewService,
		ProductsResolver,
		ProductsService,
		ProductsService,
		ProductVariantImageResolver,
		ProductVariantImageService,
		ProductVariantResolver,
		ProductVariantService,
		ProductVariantService,
		WarehouseService,
		FileService,
		ImageThumbnailService,
	],
	controllers: [
		CategoriesController,
		ProductsController,
		ProductVariantController,
		ProductOptionController,
		ProductOptionValueController,
		ProductReviewController,
		ProductsController,
		ProductVariantController,
		ProductVariantImageController,
		WarehouseController,
	],
})
export class InventoryModule { }

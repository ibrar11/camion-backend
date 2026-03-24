import { Module } from '@nestjs/common';

import { TypeOrmModule } from '@nestjs/typeorm';

import { User } from '../users/entities/user.entity';
import { UsersService } from 'src/users/users.service';

import { Customer } from 'src/customers/entities/customer.entity';
import { CustomersService } from 'src/customers/customers.service';

import { Product } from './entities/product.entity';
import { ProductsService } from './products.service';
import { ProductsController } from './products.controller';

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

@Module({
	imports: [
		TypeOrmModule.forFeature([
			User,
			Customer,
			Product,
			ProductOption,
			ProductOptionValue,
			ProductVariant,
			ProductVariantImage,
			ProductVariantInventoryItem,
			ProductVariantOptionValue,
		]),
	],
	providers: [
		UsersService,
		CustomersService,
		ProductsService,
		ProductVariantService,
		ProductOptionService,
		ProductOptionValueService,
		ProductVariantImageService,
	],
	controllers: [
		ProductsController,
		ProductVariantController,
		ProductOptionController,
		ProductOptionValueController,
		ProductVariantImageController,
	],
})
export class ProductsModule { }

import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { Bundle } from './entities/bundle.entity';
import { BundleItem } from './entities/bundle-item.entity';
import { BundlesService } from './bundles.service';
import { BundlesController } from './bundles.controller';

import { Product } from '../inventory/entities/product.entity';
import { ProductVariant } from '../inventory/entities/product-variant.entity';
import { CartItem } from '../cart/entities/cart-items.entity';
import { OrderItem } from '../order/entities/order-item.entity';
import { ExchangeRate } from '../pricing/entities/exchange-rate.entity';
import { PricingModule } from '../pricing/pricing.module';
import { S3Service } from '../common/s3.service';
import { FileService } from '../common/file.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Bundle,
      BundleItem,
      Product,
      ProductVariant,
      CartItem,
      OrderItem,
      ExchangeRate,
    ]),
    PricingModule,
  ],
  exports: [BundlesService],
  providers: [BundlesService, S3Service, FileService],
  controllers: [BundlesController],
})
export class BundlesModule {}

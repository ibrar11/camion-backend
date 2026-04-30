import { Module } from '@nestjs/common';

import { TypeOrmModule } from '@nestjs/typeorm';

import { ProductTranslationProvider } from './providers/product-translation.provider';

import { Product } from '../inventory/entities/product.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Product
    ]),
  ],
  providers: [
    ProductTranslationProvider,
  ],
})
export class TranslationModule { }

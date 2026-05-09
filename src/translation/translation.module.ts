import { Module } from '@nestjs/common';

import { TypeOrmModule } from '@nestjs/typeorm';

import { ProductTranslationProvider } from './providers/product-translation.provider';

import { Product } from '../inventory/entities/product.entity';
import { ProductOptionValue } from '../inventory/entities/product-option-value.entity';
import { ProductOption } from '../inventory/entities/product-option.entity';
import { ProductVariant } from '../inventory/entities/product-variant.entity';
import { Language } from '../languages/entities/language.entity';

import { Category } from '../inventory/entities/category.entity';

import { TranslationItem } from './entities/translation-item.entity';
import { Translation } from './entities/translation.entity';
import { TranslationService } from './translation.service';
import { TranslationItemService } from './translation-item.service';

@Module({
    imports: [
        TypeOrmModule.forFeature([
            Product,
            ProductVariant,
            ProductOption,
            ProductOptionValue,
            Category,
            Translation,
            TranslationItem,
            Language,
        ]),
    ],
    providers: [
        ProductTranslationProvider,
        TranslationService,
        TranslationItemService,
    ],
})
export class TranslationModule { }

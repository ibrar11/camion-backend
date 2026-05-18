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

import { TranslationScannerService } from './translation-scanner.service';
import { TranslationScannerController } from './translation-scanner.controller';

import { User } from 'src/users/entities/user.entity';
import { UsersService } from 'src/users/users.service';

import { Customer } from 'src/customers/entities/customer.entity';
import { CustomersService } from 'src/customers/customers.service';

import { Client } from 'src/clients/entities/client.entity';
import { ClientsService } from 'src/clients/clients.service';

import { ClientRefreshToken } from 'src/oauth/entities/oauth-refresh-token.entity';
import { OauthService } from 'src/oauth/oauth.service';

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
            User,
            Customer,
            Client,
            ClientRefreshToken
        ]),
    ],
    providers: [
        ProductTranslationProvider,
        TranslationService,
        TranslationItemService,
        TranslationScannerService,
        UsersService,
        CustomersService,
        ClientsService,
        OauthService,
    ],
    controllers: [
        TranslationScannerController,
    ]
})
export class TranslationModule { }

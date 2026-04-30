// src/common/queues/queue.module.ts
import {
    Module,
    Global
} from '@nestjs/common';

import { TypeOrmModule } from '@nestjs/typeorm';

import { BullModule } from '@nestjs/bullmq';

import { ConfigService } from '@nestjs/config';

import { QueueName } from './enums/QueueTypes.enum';

import { QueueService } from './queue.service';
import { QueueController } from './queue.controller';

import { Translation } from '../translation/entities/translation.entity';
import { TranslationItem } from '../translation/entities/translation-item.entity';
import { TranslationQueue } from '../translation/queues/translation.queue';
import { TranslationProcessor } from '../translation/workers/translation.processor';
import { TranslationModule } from '../translation/translation.module';

import { Product } from '../inventory/entities/product.entity';
import { ProductVariant } from '../inventory/entities/product-variant.entity';
import { ProductOption } from '../inventory/entities/product-option.entity';
import { ProductOptionValue } from '../inventory/entities/product-option-value.entity';

import { Language } from '../languages/entities/language.entity';

import { ProductTranslationProvider } from '../translation/providers/product-translation.provider';

import { Category } from '../inventory/entities/category.entity';

@Global()
@Module({
    imports: [
        BullModule.forRootAsync({
            useFactory: async (configService: ConfigService) => ({
                connection: {
                    host: configService.get<string>('REDIS_HOST', 'localhost'),
                    port: configService.get<number>('REDIS_PORT', 6379),
                    tls: {},
                    retryStrategy: (times) => Math.min(times * 50, 2000),
                },
                defaultJobOptions: {
                    attempts: 3,
                    backoff: {
                        type: 'exponential',
                        delay: 1000,
                    },
                    removeOnComplete: 100,
                    removeOnFail: 500,
                },
            }),
            inject: [ConfigService],
        }),
        BullModule.registerQueue(
            { name: QueueName.TRANSLATION },
        ),
        TypeOrmModule.forFeature([
            Product,
            ProductVariant,
            ProductOption,
            ProductOptionValue,
            Language,
            Translation,
            TranslationItem,
            Category,
        ]),
        TranslationModule,
    ],
    providers: [
        QueueService,
        TranslationQueue,
        TranslationProcessor,
        ProductTranslationProvider,
    ],
    controllers: [QueueController],
    exports: [
        QueueService,
        BullModule,  // Export BullModule for other modules to register queues
    ],
})
export class QueueModule { }
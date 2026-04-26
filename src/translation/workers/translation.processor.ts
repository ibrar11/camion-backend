import { Processor, WorkerHost } from '@nestjs/bullmq';

import {
    Logger,
    Injectable,
    Inject,
} from '@nestjs/common';

import { Job } from 'bullmq';

import { InjectRepository } from '@nestjs/typeorm';

import {
    Repository,
    In,
} from 'typeorm';

import { QueueName } from '../../queue/enums/QueueTypes.enum';

import { Product } from '../../inventory/entities/product.entity';
import { ProductVariant } from '../../inventory/entities/product-variant.entity';
import { ProductOption } from '../../inventory/entities/product-option.entity';
import { ProductOptionValue } from '../../inventory/entities/product-option-value.entity';

import { Language } from '../../languages/entities/language.entity';

import { Translation } from '../entities/translation.entity';
import { TranslateField, TranslationItem } from '../entities/translation-item.entity';

import { TranslationJobData } from '../../queue/types';

import { ProductTranslationProvider } from '../providers/product-translation.provider';


@Processor(QueueName.TRANSLATION, {
    concurrency: 1,
    limiter: {
        max: 5,
        duration: 1000,
    },
})
@Injectable()
export class TranslationProcessor extends WorkerHost {
    private readonly logger = new Logger(TranslationProcessor.name);

    constructor(
        @InjectRepository(Language) private readonly languageRepository: Repository<Language>,
        @InjectRepository(Product) private readonly productRepository: Repository<Product>,
        @InjectRepository(Translation) private readonly translationRepository: Repository<Translation>,
        @InjectRepository(TranslationItem) private readonly translationItemRepository: Repository<TranslationItem>,
        @Inject(ProductTranslationProvider) private readonly translationProvider: ProductTranslationProvider,
    ) {
        super();
    }

    async process(job: Job<TranslationJobData>): Promise<any> {
        const { productUuids, sourceLanguageId } = job.data;
        console.log("productUuidsproductUuidsproductUuids", productUuids)

        this.logger.log(
            `Processing translation batch job ${job.id} for ${productUuids.length} products`,
        );

        try {
            await job.updateProgress(5);

            const languages = await this.languageRepository.find();

            const targetLanguages = languages.filter(
                (lang) => lang.id !== sourceLanguageId,
            );

            await job.updateProgress(10);

            const products = await this.productRepository.find({
                where: {
                    uuid: In(productUuids),
                },
                relations: [
                    'variants',
                    'options',
                    'options.values',
                ],
            });

            await job.updateProgress(20);

            let processedCount = 0;

            for (const product of products) {
                await this.translateProductGraph(
                    product,
                    targetLanguages,
                );

                processedCount++;

                const progress =
                    20 + Math.floor((processedCount / products.length) * 80);

                await job.updateProgress(progress);
            }

            this.logger.log(
                `Completed translation batch job ${job.id}`,
            );

            return {
                success: true,
                processedProducts: products.length,
            };
        } catch (error: any) {
            this.logger.error(
                `Translation job failed: ${error.message}`,
                error.stack,
            );

            throw error;
        }
    }

    private async translateProductGraph(
        product: Product,
        targetLanguages: Language[],
    ): Promise<void> {
        const existingTranslation = await this.translationRepository.findOne({
            where: {
                entityUuid: product.uuid,
                entityType: 'product',
            },
        });

        let translationEntity: Translation;

        if (existingTranslation) {
            translationEntity = existingTranslation;
        } else {
            translationEntity = await this.translationRepository.save({
                uuid: crypto.randomUUID(),
                entityType: 'product',
                entityUuid: product.uuid,
                completed: false,
            });
        }

        const translationItemsToInsert: Partial<TranslationItem>[] = [];
        for (const language of targetLanguages) {
            console.log("inside the language of targetLanguages", language)
            const translatedVariants: TranslateField[] = [];

            const translatedOptions: TranslateField[] = [];

            const translatedOptionValues: TranslateField[] = [];

            const translatedCategories: TranslateField[] = [];

            // Product-level translations
            const translatedProductTitle =
                await this.translationProvider.translate(
                    product.titleEn,
                    language.shortCode,
                );

            const translatedProductBrief =
                await this.translationProvider.translate(
                    product.briefEn,
                    language.shortCode,
                );

            const translatedProductDescription =
                await this.translationProvider.translate(
                    product.descriptionEn,
                    language.shortCode,
                );

            const translatedProductDescriptionHtml =
                await this.translationProvider.translate(
                    product.descriptionHtmlEn,
                    language.shortCode,
                );

            // Variants
            for (const variant of product.variants ?? []) {
                const translatedVariant =
                    await this.translationProvider.translate(
                        variant.titleEn,
                        language.shortCode,
                    );

                translatedVariants.push({
                    uuid: variant.uuid,
                    translatedText: translatedVariant,
                });
            }

            // Options + Option Values
            for (const option of product.options ?? []) {
                const translatedOption =
                    await this.translationProvider.translate(
                        option.nameEn,
                        language.shortCode,
                    );

                translatedOptions.push({
                    uuid: option.uuid,
                    translatedText: translatedOption,
                });

                for (const value of option.values ?? []) {
                    const translatedValue =
                        await this.translationProvider.translate(
                            value.valueEn,
                            language.shortCode,
                        );

                    translatedOptionValues.push({
                        uuid: value.uuid,
                        translatedText: translatedValue,
                    });
                }
            }

            // Categories
            for (const category of product.productCategories ?? []) {
                const translatedCategory =
                    await this.translationProvider.translate(
                        category.category.nameEn,
                        language.shortCode,
                    );

                translatedCategories.push({
                    uuid: category.category.uuid,
                    translatedText: translatedCategory,
                });
            }

            translationItemsToInsert.push({
                uuid: crypto.randomUUID(),
                translation: translationEntity,
                language,
                translatedProductTitle,
                translatedProductBrief,
                translatedProductDescription,
                translatedProductDescriptionHtml,
                translatedProductVariants: translatedVariants,
                translatedProductOptions: translatedOptions,
                translatedProductOptionValues: translatedOptionValues,
                translatedCategories,
            });
        }

        if (translationItemsToInsert.length) {
            await this.translationItemRepository.save(
                translationItemsToInsert,
            );
        }

        translationEntity.completed = true;

        await this.translationRepository.save(translationEntity);
    }
}
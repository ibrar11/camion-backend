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
import { TranslationItem } from '../entities/translation-item.entity';

import { TranslationJobData } from '../../queue/types';

import { ProductTranslationProvider } from '../providers/product-translation.provider';

import { Category } from '../../inventory/entities/category.entity';

import { TranslationJobRegistryService } from '../translation-job-registry.service';

import {
    Cache,
    CACHE_MANAGER
} from '@nestjs/cache-manager';


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
        @InjectRepository(ProductVariant) private readonly productVariantRepository: Repository<ProductVariant>,
        @InjectRepository(ProductOption) private readonly productOptionRepository: Repository<ProductOption>,
        @InjectRepository(ProductOptionValue) private readonly productOptionValueRepository: Repository<ProductOptionValue>,
        @InjectRepository(Category) private readonly categoryRepository: Repository<Category>,
        @InjectRepository(Translation) private readonly translationRepository: Repository<Translation>,
        @InjectRepository(TranslationItem) private readonly translationItemRepository: Repository<TranslationItem>,
        @Inject(ProductTranslationProvider) private readonly translationProvider: ProductTranslationProvider,
        @Inject(TranslationJobRegistryService) private readonly jobRegistry: TranslationJobRegistryService,
        @Inject(CACHE_MANAGER) private readonly cacheManager: Cache
    ) {
        super();
    }

    async process(job: Job<TranslationJobData>): Promise<any> {
        const { productUuids, sourceLanguageCode, deduplicationKey } = job.data;

        this.logger.log(
            `Processing translation batch job ${job.id} for ${productUuids.length} products`,
        );

        const processedKey = `processed:${deduplicationKey}`;
        const alreadyProcessed = await this.cacheManager.get(processedKey);

        if (alreadyProcessed) {
            this.logger.log(`Job ${deduplicationKey} already processed, skipping`);
            return { success: true, skipped: true };
        }

        try {
            await job.updateProgress(5);

            const languages = await this.languageRepository.find();

            const targetLanguages = languages.filter(
                (lang) => lang.shortCode !== sourceLanguageCode,
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

            for (const productUuid of productUuids) {
                await this.jobRegistry.clearJob(productUuid, 'full');
            }

            return { success: true, processedProducts: products.length };
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
        try {
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

            const variants = product.variants ?? [];
            const options = product.options ?? [];
            const optionValues = options.flatMap((o) => o.values ?? []);
            const categories = product.productCategories ?? [];

            const translationItemsToInsert: Partial<TranslationItem>[] = [];

            // Batch all texts for this language into one parallel round-trip
            const allTexts = [
                product.titleEn,
                product.briefEn,
                product.descriptionEn,
                ...variants.map((v) => v.titleEn),
                ...options.map((o) => o.nameEn),
                ...optionValues.map((v) => v.valueEn),
                ...categories.map((c) => c.category.nameEn),
            ];

            const CONCURRENT_LANGUAGES = 2;

            for (let i = 0; i < targetLanguages.length; i += CONCURRENT_LANGUAGES) {
                const chunk = targetLanguages.slice(i, i + CONCURRENT_LANGUAGES);

                const results = await Promise.all(
                    chunk.map(async (language) => {

                        const translated = await this.translationProvider.translateBatch(
                            allTexts,
                            language.shortCode,
                        );

                        return { language, translated };
                    }),
                );

                for (const { language, translated } of results) {
                    let idx = 0;

                    const translatedProductTitle = translated[idx++];
                    const translatedProductBrief = translated[idx++];
                    const translatedProductDescription = translated[idx++];

                    const translatedVariants = variants.map((v) => ({
                        uuid: v.uuid,
                        translatedText: translated[idx++],
                    }));

                    const translatedOptions = options.map((o) => ({
                        uuid: o.uuid,
                        translatedText: translated[idx++],
                    }));

                    const translatedOptionValues = optionValues.map((v) => ({
                        uuid: v.uuid,
                        translatedText: translated[idx++],
                    }));

                    const translatedCategories = categories.map((c) => ({
                        uuid: c.category.uuid,
                        translatedText: translated[idx++],
                    }));

                    const existingTranslationItem = await this.translationItemRepository.findOne({
                        where: {
                            translation: { id: translationEntity.id },
                            language: { id: language.id }
                        },
                        relations: {
                            translation: true,
                            language: true
                        }
                    });

                    if (existingTranslationItem) {
                        existingTranslationItem.translation = translationEntity;
                        existingTranslationItem.language = language;
                        existingTranslationItem.translatedProductTitle = translatedProductTitle;
                        existingTranslationItem.translatedProductBrief = translatedProductBrief;
                        existingTranslationItem.translatedProductDescription = translatedProductDescription;
                        existingTranslationItem.translatedProductVariants = translatedVariants;
                        existingTranslationItem.translatedProductOptions = translatedOptions;
                        existingTranslationItem.translatedProductOptionValues = translatedOptionValues;
                        existingTranslationItem.translatedCategories = translatedCategories;

                        await this.translationItemRepository.save(existingTranslationItem);
                    } else {
                        translationItemsToInsert.push({
                            uuid: crypto.randomUUID(),
                            translation: translationEntity,
                            language,
                            translatedProductTitle,
                            translatedProductBrief,
                            translatedProductDescription,
                            translatedProductVariants: translatedVariants,
                            translatedProductOptions: translatedOptions,
                            translatedProductOptionValues: translatedOptionValues,
                            translatedCategories,
                        });
                    }

                    if (language.shortCode === 'ar') {
                        const productToUpdate = await this.productRepository.findOne({
                            where: {
                                id: product.id
                            }
                        });
                        if (productToUpdate) {
                            productToUpdate.titleAr = translatedProductTitle?.trim().slice(0, 128);
                            productToUpdate.briefAr = translatedProductBrief?.trim().slice(0, 256);
                            productToUpdate.descriptionAr = translatedProductDescription;

                            const updatedProduct = await this.productRepository.save(productToUpdate);
                            translationEntity.product = updatedProduct;
                        }

                        await Promise.all(
                            translatedVariants.map(async (v) => {
                                const variant = await this.productVariantRepository.findOne({
                                    where: { uuid: v.uuid },
                                });

                                if (variant) {
                                    variant.titleAr = v.translatedText?.trim().slice(0, 128);
                                    await this.productVariantRepository.save(variant);
                                }
                            }),
                        );

                        await Promise.all(
                            translatedOptions.map(async (o) => {
                                const option = await this.productOptionRepository.findOne({
                                    where: { uuid: o.uuid },
                                });

                                if (option) {
                                    option.nameAr = o.translatedText?.trim().slice(0, 64);
                                    await this.productOptionRepository.save(option);
                                }
                            }),
                        );

                        await Promise.all(
                            translatedOptionValues.map(async (v) => {
                                const optionValue = await this.productOptionValueRepository.findOne({
                                    where: { uuid: v.uuid },
                                });

                                if (optionValue) {
                                    optionValue.valueAr = v.translatedText?.trim().slice(0, 64);
                                    await this.productOptionValueRepository.save(optionValue);
                                }
                            }),
                        );

                        await Promise.all(
                            translatedCategories.map(async (c) => {
                                const category = await this.categoryRepository.findOne({
                                    where: { uuid: c.uuid },
                                });

                                if (category) {
                                    category.nameAr = c.translatedText;
                                    await this.categoryRepository.save(category);
                                }
                            }),
                        );
                    }
                }
            }

            if (translationItemsToInsert.length > 0) {
                await this.translationItemRepository.save(translationItemsToInsert);
            }

            translationEntity.completed = true;

            await this.translationRepository.save(translationEntity);
        } catch (error: any) {
            this.logger.error(
                `Translation job failed: ${error}`,
            );

            throw error;
        }
    }
}
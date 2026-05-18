// src/translation/translation-scanner.service.ts
import {
    Inject,
    Injectable,
    Logger
} from '@nestjs/common';

import { InjectRepository } from '@nestjs/typeorm';
import {
    Repository,
    In,
    Not,
    IsNull
} from 'typeorm';

import {
    Cron,
    CronExpression
} from '@nestjs/schedule';

import { ProductStatus } from 'src/inventory/enums/ProductStatus.enum';

import { Product } from '../inventory/entities/product.entity';

import { Translation } from './entities/translation.entity';
import { TranslationItem } from './entities/translation-item.entity';

import { Language } from '../languages/entities/language.entity';

import { QueueService } from '../queue/queue.service';

import {
    ProductTranslationScan,
    ProductTranslationStats
} from './types';

@Injectable()
export class TranslationScannerService {
    private readonly logger = new Logger(TranslationScannerService.name);

    constructor(
        @InjectRepository(Product) private readonly productRepository: Repository<Product>,
        @InjectRepository(Translation) private readonly translationRepository: Repository<Translation>,
        @InjectRepository(TranslationItem) private readonly translationItemRepository: Repository<TranslationItem>,
        @InjectRepository(Language) private readonly languageRepository: Repository<Language>,
        @Inject(QueueService) private readonly queueService: QueueService,
    ) { }

    /**
     * Runs every 3 hours to scan for products needing translation
     */
    @Cron(CronExpression.EVERY_3_HOURS)
    async scanAndQueueMissingTranslations(): Promise<void> {
        this.logger.log('Starting translation scan for products with missing translations');

        try {
            // Get all active languages (excluding source language 'en')
            const languages = await this.languageRepository.find();
            const targetLanguages = languages.filter(lang => lang.shortCode !== 'en');
            const targetLanguageCodes = targetLanguages.map(lang => lang.shortCode);

            if (targetLanguageCodes.length === 0) {
                this.logger.warn('No target languages configured for translation');
                return;
            }

            // Find products that need translation
            const productsNeedingTranslation = await this.findProductsNeedingTranslation(targetLanguageCodes);

            if (productsNeedingTranslation.length === 0) {
                this.logger.log('No products found needing translation');
                return;
            }

            this.logger.log(`Found ${productsNeedingTranslation.length} product(s) needing translation`);

            // Group products by priority (products with existing translations can be lower priority)
            const { highPriority, normalPriority } = this.categorizeProductsByPriority(productsNeedingTranslation);

            // Queue high priority products first
            if (highPriority.length > 0) {
                this.logger.log(`Queueing ${highPriority.length} high-priority product(s) for translation`);
                await this.queueService.addImportedProductsTranslationJob(
                    highPriority.map(p => p.uuid),
                    'en'
                );
            }

            // Queue normal priority products in batches to avoid overwhelming the queue
            if (normalPriority.length > 0) {
                const batchSize = 50;
                for (let i = 0; i < normalPriority.length; i += batchSize) {
                    const batch = normalPriority.slice(i, i + batchSize);
                    this.logger.log(`Queueing batch ${Math.floor(i / batchSize) + 1} of normal-priority products: ${batch.length} product(s)`);
                    await this.queueService.addImportedProductsTranslationJob(
                        batch.map(p => p.uuid),
                        'en'
                    );
                }
            }

            this.logger.log('Translation scan completed successfully');
        } catch (error: any) {
            this.logger.error(`Error during translation scan: ${error.message}`, error.stack);
        }
    }

    /**
     * Find products that need translation
     * A product needs translation if:
     * 1. It has variants (products without variants can't be fully translated)
     * 2. It's missing translations for any target language
     * 3. Or the existing translation is incomplete/stale
     */
    private async findProductsNeedingTranslation(targetLanguageCodes: string[]): Promise<Product[]> {
        // Get all active products with variants
        const allProducts = await this.productRepository
            .createQueryBuilder("product")
            .leftJoinAndSelect("product.variants", "variants")
            .leftJoinAndSelect("product.translation", "translation")
            .leftJoinAndSelect("translation.translationItems", "translationItems")
            .leftJoinAndSelect("translationItems.language", "language")
            .where("product.status = :status", {
                status: ProductStatus.ACTIVE,
            })
            .andWhere(
                "(product.translation_id IS NULL OR translation.completed = false  OR (product.title_en = product.title_ar AND translation.completed = true))"
            )
            .getMany();

        // Filter products that have at least one variant
        const productsWithVariants = allProducts.filter(p => p.variants && p.variants.length > 0);

        const productUUIDS = productsWithVariants?.map((product) => {
            return product.uuid;
        })

        this.logger.log(`Found ${productUUIDS.length} Products that are without translations: ${JSON.stringify(productUUIDS)}`);

        // Check each product for missing translations
        const needsTranslation: Product[] = [];

        for (const product of productsWithVariants) {
            const isMissingTranslation = await this.isProductMissingTranslation(product, targetLanguageCodes);
            if (isMissingTranslation) {
                needsTranslation.push(product);
            }
        }

        return needsTranslation;
    }

    /**
     * Check if a product is missing translations for any target language
     */
    private async isProductMissingTranslation(product: Product, targetLanguageCodes: string[]): Promise<boolean> {
        // If product has no translation record at all, it needs translation
        if (!product.translation) {
            this.logger.debug(`Product ${product.uuid} has no translation record`);
            return true;
        }

        // If translation record exists but is not marked as completed
        if (!product.translation.completed || product.titleEn === product.titleAr) {
            this.logger.debug(`Product ${product.uuid} has incomplete translation (completed=false)`);
            return true;
        }

        // Check if we have translation items for all target languages
        const existingTranslationItems = product.translation.translationItems || [];
        const existingLanguageCodes = existingTranslationItems.map(item => item.language?.shortCode).filter(Boolean);

        const missingLanguages = targetLanguageCodes.filter(
            langCode => !existingLanguageCodes.includes(langCode)
        );

        if (missingLanguages.length > 0) {
            this.logger.debug(`Product ${product.uuid} missing translations for: ${missingLanguages.join(', ')}`);
            return true;
        }

        return false;
    }

    /**
     * Categorize products by priority
     * High priority: New products (created in last 7 days) or products with recent updates
     * Normal priority: All other products
     */
    private categorizeProductsByPriority(products: Product[]): {
        highPriority: Product[];
        normalPriority: Product[];
    } {
        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

        const highPriority: Product[] = [];
        const normalPriority: Product[] = [];

        for (const product of products) {
            const isNew = product.createdAt && new Date(product.createdAt) > sevenDaysAgo;
            const wasRecentlyUpdated = product.updatedAt && new Date(product.updatedAt) > sevenDaysAgo;

            if (isNew || wasRecentlyUpdated) {
                highPriority.push(product);
            } else {
                normalPriority.push(product);
            }
        }

        return { highPriority, normalPriority };
    }

    /**
     * Manual trigger for translation scan (for admin use)
     */
    async manualScanAndQueue(): Promise<ProductTranslationScan> {
        this.logger.log('Manual translation scan triggered');

        const languages = await this.languageRepository.find();
        const targetLanguages = languages.filter(lang => lang.shortCode !== 'en');
        const targetLanguageCodes = targetLanguages.map(lang => lang.shortCode);

        const productsNeedingTranslation = await this.findProductsNeedingTranslation(targetLanguageCodes);
        const { highPriority, normalPriority } = this.categorizeProductsByPriority(productsNeedingTranslation);

        // Queue all products (in batches for normal priority)
        if (highPriority.length > 0) {
            await this.queueService.addImportedProductsTranslationJob(
                highPriority.map(p => p.uuid),
                'en'
            );
        }

        if (normalPriority.length > 0) {
            const batchSize = 50;
            for (let i = 0; i < normalPriority.length; i += batchSize) {
                const batch = normalPriority.slice(i, i + batchSize);
                await this.queueService.addImportedProductsTranslationJob(
                    batch.map(p => p.uuid),
                    'en'
                );
            }
        }

        return {
            scanned: productsNeedingTranslation.length,
            queued: highPriority.length + normalPriority.length,
            highPriorityCount: highPriority.length,
            normalPriorityCount: normalPriority.length,
        };
    }

    /**
     * Get statistics about translation coverage
     */
    async getTranslationStats(): Promise<ProductTranslationStats> {
        const languages = await this.languageRepository.find();
        const targetLanguages = languages.filter(lang => lang.shortCode !== 'en');
        const targetLanguageCodes = targetLanguages.map(lang => lang.shortCode);
        const targetCount = targetLanguageCodes.length;

        const allProducts = await this.productRepository.find({
            where: { status: ProductStatus.ACTIVE },
            relations: {
                variants: true,
                translation: {
                    translationItems: {
                        language: true,
                    },
                },
            },
        });

        const productsWithVariants = allProducts.filter(p => p.variants && p.variants.length > 0);
        const totalWithVariants = productsWithVariants.length;

        let fullyTranslated = 0;
        let partiallyTranslated = 0;
        let untranslated = 0;

        for (const product of productsWithVariants) {
            if (!product.translation || !product.translation.completed) {
                untranslated++;
                continue;
            }

            const existingItems = product.translation.translationItems || [];
            const existingLangCodes = existingItems.map(item => item.language?.shortCode).filter(Boolean);
            const missingCount = targetLanguageCodes.filter(lang => !existingLangCodes.includes(lang)).length;

            if (missingCount === 0) {
                fullyTranslated++;
            } else if (missingCount < targetCount) {
                partiallyTranslated++;
            } else {
                untranslated++;
            }
        }

        const translationCoveragePercentage = totalWithVariants > 0
            ? (fullyTranslated / totalWithVariants) * 100
            : 0;

        return {
            totalProducts: allProducts.length,
            productsWithVariants: totalWithVariants,
            fullyTranslated,
            partiallyTranslated,
            untranslated,
            translationCoveragePercentage: Math.round(translationCoveragePercentage * 100) / 100,
        };
    }
}
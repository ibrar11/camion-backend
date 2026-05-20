// src/translation/translation-scanner.service.ts
import {
    BadRequestException,
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

import { ConfigService } from '@nestjs/config';

@Injectable()
export class TranslationScannerService {
    private readonly logger = new Logger(TranslationScannerService.name);
    private hasRun = false;

    constructor(
        @InjectRepository(Product) private readonly productRepository: Repository<Product>,
        @InjectRepository(Translation) private readonly translationRepository: Repository<Translation>,
        @InjectRepository(TranslationItem) private readonly translationItemRepository: Repository<TranslationItem>,
        @InjectRepository(Language) private readonly languageRepository: Repository<Language>,
        @Inject(QueueService) private readonly queueService: QueueService,
        private readonly configService: ConfigService
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

            await this.findProductsWithCouldNotTranslateDescritpion();
            await this.findProductsWithChineseDescritpion();

            if (targetLanguageCodes.length === 0) {
                this.logger.warn('No target languages configured for translation');
                return;
            }

            // Find products that need translation
            const productsNeedingTranslation = (await this.findProductsNeedingTranslation(targetLanguageCodes)).slice(0, 100);

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

    private async findProductsWithCouldNotTranslateDescritpion(): Promise<void> {
        const allProducts = await this.productRepository.find({
            where: {
                descriptionEn: `The provided text is "null". There is nothing to translate.`
            },
            relations: {
                variants: true,
            }
        });

        const productsWithVariants = allProducts.filter(p => p.variants && p.variants.length > 0);

        this.logger.log(`Found ${productsWithVariants?.length} products with The provided text is "null". There is nothing to translate.`);

        if (productsWithVariants.length > 0) {
            for (let i = 0; i < productsWithVariants.length; i++) {
                productsWithVariants[i].descriptionEn = '';
                productsWithVariants[i].descriptionAr = '';
            }
            await this.productRepository.save(productsWithVariants);
        }
    }

    private async findProductsWithChineseDescritpion(): Promise<void> {
        this.logger.log(`Attempting to find the products with chinese description`);
        // Get all active products with Chinese description
        const allProducts = await this.productRepository
            .createQueryBuilder('product')
            .leftJoinAndSelect('product.variants', 'variants')
            .where('product.status = :status', {
                status: ProductStatus.ACTIVE,
            })
            .andWhere(`product.description_en ~ '[一-龥]'`)
            .getMany();

        const productsWithVariants = allProducts.filter(p => p.variants && p.variants.length > 0);

        // Take first 50 products
        const productsToUpdate = productsWithVariants?.slice(0, 30);

        this.logger.log(`Found ${productsWithVariants?.length} products with Chinese description. Processing ${productsToUpdate?.length} products.`);

        if (productsToUpdate?.length === 0) {
            return;
        }

        // Get all target languages (excluding source language 'en')
        const allLanguages = await this.languageRepository.find();
        const targetLanguages = allLanguages.filter(lang => lang.shortCode !== 'en');
        const targetLanguageCodes = targetLanguages.map(lang => lang.shortCode);

        for (const product of productsToUpdate) {
            try {
                const chineseDescription = product.descriptionEn;

                // Translate Chinese to English
                this.logger.log(`Translating Chinese description to English for product: ${product.uuid}`);
                const englishTranslation = await this.translateText(chineseDescription, 'ch', 'en');

                if (!englishTranslation) {
                    this.logger.warn(`Failed to translate Chinese description to English for product: ${product.uuid}`);
                    continue;
                }

                // Update product's descriptionEn with English translation
                product.descriptionEn = englishTranslation;

                // Translate English to all target languages
                const translations: Record<string, string> = {};

                for (const targetLang of targetLanguages) {
                    this.logger.log(`Translating description to ${targetLang.shortCode} for product: ${product.uuid}`);
                    const translatedText = await this.translateText(
                        englishTranslation,
                        'en',
                        targetLang.shortCode
                    );
                    if (translatedText) {
                        translations[targetLang.shortCode] = translatedText;
                    }
                }

                // Update product's descriptionAr if Arabic is a target language
                if (translations['ar']) {
                    product.descriptionAr = translations['ar'];
                }

                // Save the product changes
                await this.productRepository.save(product);

                // Step 3: Update translation_items table
                await this.updateTranslationItems(product, englishTranslation, translations);

                this.logger.log(`Successfully processed product ${product.uuid} with ${Object.keys(translations).length} translations`);

            } catch (error: any) {
                this.logger.error(`Failed to process product ${product.uuid}: ${error.message}`);
            }
        }
    }

    /**
     * Translate text using the translation API
     */
    private async translateText(text: string, sourceLanguage: string, targetLanguage: string): Promise<string | null> {
        if (!text || text.trim().length === 0) {
            return null;
        }

        try {
            const response = await fetch(`${this.configService.get<string>("PRODUCT_TRANSLATION_BASE_URL")}/api/translate`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    text: text,
                    sourceLanguage: sourceLanguage,
                    targetLanguage: targetLanguage
                }),
            });

            if (!response.ok) {
                this.logger.error(`Translation API responded with ${response.status} for ${sourceLanguage} -> ${targetLanguage}`);
                return null;
            }

            const data = await response.json();
            return data?.translated || null;

        } catch (error: any) {
            this.logger.error(`Translation API error: ${error.message}`);
            return null;
        }
    }

    /**
     * Update translation_items table with new description translations
     */
    private async updateTranslationItems(
        product: Product,
        englishDescription: string,
        translations: Record<string, string>
    ): Promise<void> {
        // Find or create translation record for the product
        let translation = await this.translationRepository.findOne({
            where: {
                entityUuid: product.uuid,
                entityType: 'product',
            },
            relations: ['translationItems', 'translationItems.language'],
        });

        if (!translation) {
            throw new BadRequestException({
                error: `Translation record not found for product: ${product.uuid}`
            });
        }

        // Get all existing translation items for this translation
        const existingItems = translation.translationItems || [];

        // Group existing items by language ID to find duplicates
        const itemsByLanguage = new Map<number, typeof existingItems>();
        for (const item of existingItems) {
            const languageId = item.language?.id;
            if (languageId) {
                if (!itemsByLanguage.has(languageId)) {
                    itemsByLanguage.set(languageId, []);
                }
                itemsByLanguage.get(languageId)!.push(item);
            }
        }

        // For each language with duplicates, keep only the latest (highest ID) and delete the rest
        for (const [languageId, items] of itemsByLanguage.entries()) {
            if (items.length > 1) {
                // Sort by ID descending (latest first)
                items.sort((a, b) => b.id - a.id);

                // Keep the first (latest) one, delete the rest
                const itemsToDelete = items.slice(1);
                const idsToDelete = itemsToDelete.map(item => item.id);

                this.logger.log(`Found ${itemsToDelete.length} duplicate translation items for language ${languageId} in product ${product.uuid}. Removing duplicates.`);

                await this.translationItemRepository.delete(idsToDelete);

                // Remove deleted items from the existingItems array reference
                for (const itemToDelete of itemsToDelete) {
                    const index = translation.translationItems.findIndex(item => item.id === itemToDelete.id);
                    if (index !== -1) {
                        translation.translationItems.splice(index, 1);
                    }
                }
            }
        }

        // For each target language, update or create the translation item
        for (const [targetLanguageCode, translatedText] of Object.entries(translations)) {
            const language = await this.languageRepository.findOne({
                where: { shortCode: targetLanguageCode },
            });

            if (!language) {
                this.logger.warn(`Language ${targetLanguageCode} not found`);
                continue;
            }

            // Find existing translation item for this language (after deduplication)
            let translationItem = translation.translationItems?.find(
                item => item.language?.id === language.id
            );

            if (translationItem) {
                // Update existing translation item
                translationItem.translatedProductDescription = translatedText;
                translationItem.updatedAt = new Date();
                await this.translationItemRepository.save(translationItem);
            }
        }

        this.logger.log(`Updated translation items for product ${product.uuid}`);
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

        await this.findProductsWithCouldNotTranslateDescritpion();
        await this.findProductsWithChineseDescritpion();

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

    async runOnceCleanup() {
        // Prevent multiple runs in same app instance
        if (this.hasRun) {
            this.logger.log('Cleanup already executed in this instance, skipping');
            return;
        }

        // Check if cleanup has already been done (using a flag in database or env)
        const hasCleanupRun = await this.hasCleanupRunBefore();

        if (hasCleanupRun) {
            this.logger.log('Cleanup has already been run before, skipping');
            return;
        }

        this.logger.log('🚀 Starting one-time translation cleanup...');
        this.hasRun = true;

        try {
            const result = await this.cleanupDuplicateTranslationItems();

            this.logger.log(`Cleanup completed successfully! Removed ${result.totalDuplicatesRemoved} duplicates from ${result.affectedTranslations.length} products`);

        } catch (error: any) {
            this.logger.error(`Cleanup failed: ${error.message}`);
            this.hasRun = false; // Reset flag to allow retry
        }
    }

    /**
     * Check if cleanup has been run before
     * Using environment variable or database flag
     */
    private async hasCleanupRunBefore(): Promise<boolean> {
        // Option 1: Check environment variable
        if (process.env.TRANSLATION_CLEANUP_COMPLETED === 'true') {
            return true;
        }

        // Option 2: Check database for a flag (create a key-value table or use existing)
        // You could create a simple settings table, or check if duplicates exist
        const duplicatesExist = await this.checkIfDuplicatesExist();

        // If no duplicates exist, consider cleanup as already done
        if (!duplicatesExist) {
            this.logger.log('No duplicate translation items found, considering cleanup as already completed');
            return true;
        }

        return false;
    }

    /**
     * Check if any duplicate translation items exist
     */
    private async checkIfDuplicatesExist(): Promise<boolean> {
        const duplicates = await this.translationItemRepository
            .createQueryBuilder('ti')
            .select('ti.translation_id', 'translationId')
            .addSelect('ti.language_id', 'languageId')
            .addSelect('COUNT(*)', 'count')
            .groupBy('ti.translation_id')
            .addGroupBy('ti.language_id')
            .having('COUNT(*) > 1')
            .limit(1)
            .getRawMany();

        return duplicates.length > 0;
    }

    /**
     * Core cleanup logic
     */
    private async cleanupDuplicateTranslationItems(): Promise<{
        totalDuplicatesRemoved: number;
        affectedTranslations: Array<{
            translationId: number;
            productUuid: string;
            productTitle?: string;
            languagesCleaned: Array<{ languageCode: string; duplicatesRemoved: number }>;
        }>;
    }> {
        this.logger.log('Starting duplicate translation items cleanup...');

        const result = {
            totalDuplicatesRemoved: 0,
            affectedTranslations: [] as Array<{
                translationId: number;
                productUuid: string;
                productTitle?: string;
                languagesCleaned: Array<{ languageCode: string; duplicatesRemoved: number }>;
            }>,
        };

        // Get all translation records with their items
        const translations = await this.translationRepository.find({
            where: { entityType: 'product' },
            relations: ['translationItems', 'translationItems.language', 'product'],
        });

        this.logger.log(`Found ${translations.length} translation records to check`);

        for (const translation of translations) {
            const existingItems = translation.translationItems || [];

            if (existingItems.length === 0) continue;

            // Group by language ID
            const itemsByLanguage = new Map<number, typeof existingItems>();
            for (const item of existingItems) {
                const languageId = item.language?.id;
                if (languageId) {
                    if (!itemsByLanguage.has(languageId)) {
                        itemsByLanguage.set(languageId, []);
                    }
                    itemsByLanguage.get(languageId)!.push(item);
                }
            }

            const languagesCleaned: Array<{ languageCode: string; duplicatesRemoved: number }> = [];

            // Process each language that has duplicates
            for (const [languageId, items] of itemsByLanguage.entries()) {
                if (items.length > 1) {
                    // Sort by ID descending (latest first)
                    items.sort((a, b) => b.id - a.id);

                    // Keep the first (latest), delete the rest
                    const itemsToDelete = items.slice(1);
                    const idsToDelete = itemsToDelete.map(item => item.id);

                    await this.translationItemRepository.delete(idsToDelete);

                    result.totalDuplicatesRemoved += idsToDelete.length;
                    languagesCleaned.push({
                        languageCode: items[0].language?.shortCode || String(languageId),
                        duplicatesRemoved: itemsToDelete.length,
                    });

                    this.logger.log(`Cleaned ${itemsToDelete.length} duplicate(s) for product ${translation.product?.uuid || translation.entityUuid}, language ${items[0].language?.shortCode || languageId}`);
                }
            }

            if (languagesCleaned.length > 0) {
                result.affectedTranslations.push({
                    translationId: translation.id,
                    productUuid: translation.product?.uuid || translation.entityUuid,
                    productTitle: translation.product?.titleEn || translation.product?.titleAr,
                    languagesCleaned,
                });
            }
        }

        this.logger.log(`Cleanup complete. Removed ${result.totalDuplicatesRemoved} duplicate translation items from ${result.affectedTranslations.length} products.`);

        return result;
    }

}
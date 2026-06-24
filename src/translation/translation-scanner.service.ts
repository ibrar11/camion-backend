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
import { ProductVariant } from "../inventory/entities/product-variant.entity";
import { ProductOption } from '../inventory/entities/product-option.entity';
import { ProductOptionValue } from '../inventory/entities/product-option-value.entity';

import { Translation } from './entities/translation.entity';
import { TranslationItem } from './entities/translation-item.entity';

import { Language } from '../languages/entities/language.entity';

import { QueueService } from '../queue/queue.service';

import {
    ProductTranslationScan,
    ProductTranslationStats
} from './types';

import { ConfigService } from '@nestjs/config';
import { generateSlug } from 'src/common/slug';

@Injectable()
export class TranslationScannerService {
    private readonly logger = new Logger(TranslationScannerService.name);
    private hasRun = false;

    constructor(
        @InjectRepository(Product) private readonly productRepository: Repository<Product>,
        @InjectRepository(ProductVariant) private readonly productVariantRepository: Repository<ProductVariant>,
        @InjectRepository(ProductOption) private readonly productOptionRepository: Repository<ProductOption>,
        @InjectRepository(ProductOptionValue) private readonly productOptionValueRepository: Repository<ProductOptionValue>,
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
            const chineseProducts = await this.findProductsWithChinese();

            if (targetLanguageCodes.length === 0) {
                this.logger.warn('No target languages configured for translation');
                return;
            }

            // Find products that need translation
            const productsNeedingTranslation = (await this.findProductsNeedingTranslation(targetLanguageCodes)).slice(0, 100);

            if (chineseProducts && chineseProducts.length > 0) {
                this.logger.log('Appending chinese product uuids');
                productsNeedingTranslation.push(...chineseProducts);
            }

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

    /**
     * Find products with Chinese content and translate them
     * Chinese → English only (Arabic translation handled by queue)
     */
    private async findProductsWithChinese(): Promise<Product[]> {
        this.logger.log(`Attempting to find products with Chinese content`);

        // Get all active products with Chinese content in ANY field
        const allProducts = await this.productRepository
            .createQueryBuilder('product')
            .distinct(true)
            .leftJoinAndSelect('product.variants', 'variant')
            .leftJoinAndSelect('product.options', 'option')
            .leftJoinAndSelect('option.values', 'optionValue')
            .where('product.status = :status', { status: ProductStatus.ACTIVE })
            .andWhere(`
            (
                product.title_en ~ '[\\u4e00-\\u9fa5]'
                OR product.description_en ~ '[\\u4e00-\\u9fa5]'
                OR variant.title_en ~ '[\\u4e00-\\u9fa5]'
                OR option.name_en ~ '[\\u4e00-\\u9fa5]'
                OR optionValue.value_en ~ '[\\u4e00-\\u9fa5]'
            )
        `)
            .getMany();

        // Filter products that have at least one variant
        const productsWithVariants = allProducts.filter(p => p.variants && p.variants.length > 0);

        // Process up to 30 products
        const productsToUpdate = productsWithVariants.slice(0, 30);

        this.logger.log(`Found ${productsWithVariants.length} products with Chinese content. Processing ${productsToUpdate.length} products.`);

        if (productsToUpdate.length === 0) {
            return [];
        }

        // Collect all Chinese text for batch translation

        // Structure to track what needs translation
        interface TranslationItem {
            key: string;           // Unique key for mapping back
            originalText: string;
            entityType: 'product_title' | 'product_description' | 'variant_title' | 'option_name' | 'option_value';
            entityUuid: string;
            field: string;          // The field to update
            productUuid: string;
        }

        const translationItems: TranslationItem[] = [];
        const chineseTexts: string[] = [];

        // Helper to add text to batch if it contains Chinese
        const addIfChinese = (
            text: string,
            entityType: TranslationItem['entityType'],
            entityUuid: string,
            field: string,
            productUuid: string
        ): void => {
            if (!text || text.trim().length === 0) return;

            // Check if contains Chinese characters
            if (/[\u4e00-\u9fa5]/.test(text)) {
                const key = `${entityType}-${entityUuid}`;

                // Avoid duplicates
                const existingIndex = translationItems.findIndex(item => item.key === key);
                if (existingIndex === -1) {
                    translationItems.push({
                        key,
                        originalText: text,
                        entityType,
                        entityUuid,
                        field,
                        productUuid,
                    });
                    chineseTexts.push(text);
                    }
                }
        };

        // Collect all Chinese text from products
        for (const product of productsToUpdate) {
            // Product title
            addIfChinese(
                product.titleEn,
                'product_title',
                product.uuid,
                'titleEn',
                product.uuid
            );

            // Product description
            addIfChinese(
                product.descriptionEn,
                'product_description',
                product.uuid,
                'descriptionEn',
                product.uuid
            );

            // Variant titles
            for (const variant of product.variants || []) {
                addIfChinese(
                    variant.titleEn,
                    'variant_title',
                    variant.uuid,
                    'titleEn',
                    product.uuid
                );
            }

            // Option names and values
            for (const option of product.options || []) {
                addIfChinese(
                    option.nameEn,
                    'option_name',
                    option.uuid,
                    'nameEn',
                    product.uuid
                );

                for (const optionValue of option.values || []) {
                    addIfChinese(
                        optionValue.valueEn,
                        'option_value',
                        optionValue.uuid,
                        'valueEn',
                        product.uuid
                    );
            }
        }
    }

        this.logger.log(`Found ${chineseTexts.length} Chinese text segments to translate`);

        if (chineseTexts.length === 0) {
            return productsToUpdate; // No Chinese text found
        }

        // Batch translate Chinese → English

        let translations: string[] = [];

        try {
            const translationResponse = await fetch(
                `${this.configService.get<string>("PRODUCT_TRANSLATION_BASE_URL")}/api/translate/batch`,
                {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                body: JSON.stringify({
                        texts: chineseTexts,
                        sourceLanguage: 'ch',
                        targetLanguage: 'en',
                    }),
                },
            );

            if (translationResponse.ok) {
                translations = await translationResponse.json();
                this.logger.log(`Successfully translated ${translations.length} Chinese segments`);
            } else {
                this.logger.warn(`Translation API returned ${translationResponse.status}, using original text`);
                translations = chineseTexts;
            }
        } catch (error: any) {
            this.logger.error(`Batch translation failed: ${error.message}`);
            translations = chineseTexts;
    }

        // Apply translations

        // Group translations by product for batch saving
        const productUpdates = new Map<string, {
            product: Product;
            titleEn?: string;
            descriptionEn?: string;
            variants: Map<string, { variant: any; titleEn?: string }>;
            options: Map<string, { option: any; nameEn?: string; values: Map<string, { value: any; valueEn?: string }> }>;
        }>();

        // Initialize product update groups
        for (const product of productsToUpdate) {
            if (!productUpdates.has(product.uuid)) {
                productUpdates.set(product.uuid, {
                    product,
                    variants: new Map(),
                    options: new Map(),
                });

                // Initialize variants
                for (const variant of product.variants || []) {
                    productUpdates.get(product.uuid)!.variants.set(variant.uuid, { variant });
                }

                // Initialize options and their values
                for (const option of product.options || []) {
                    const optionData = { option, values: new Map() };
                    for (const value of option.values || []) {
                        optionData.values.set(value.uuid, { value });
                    }
                    productUpdates.get(product.uuid)!.options.set(option.uuid, optionData);
                }
            }
        }

        // Apply translations
        for (let i = 0; i < translationItems.length && i < translations.length; i++) {
            const item = translationItems[i];
            const translatedText = translations[i] || item.originalText;

            const productUpdate = productUpdates.get(item.productUuid);
            if (!productUpdate) continue;

            switch (item.entityType) {
                case 'product_title':
                    productUpdate.titleEn = translatedText.slice(0, 128);
                    productUpdate.product.titleEn = translatedText.slice(0, 128);
                    productUpdate.product.slug = generateSlug(translatedText.slice(0, 128));
                    break;

                case 'product_description':
                    productUpdate.descriptionEn = translatedText;
                    productUpdate.product.descriptionEn = translatedText;
                    break;

                case 'variant_title': {
                    const variantData = productUpdate.variants.get(item.entityUuid);
                    if (variantData) {
                        variantData.titleEn = translatedText.slice(0, 128);
                        variantData.variant.titleEn = translatedText.slice(0, 128);
                    }
                    break;
                }

                case 'option_name': {
                    const optionData = productUpdate.options.get(item.entityUuid);
                    if (optionData) {
                        optionData.nameEn = translatedText.slice(0, 64);
                        optionData.option.nameEn = translatedText.slice(0, 64);
                    }
                    break;
                }

                case 'option_value': {
                    // Find the option containing this value
                    for (const [, optionData] of productUpdate.options) {
                        const valueData = optionData.values.get(item.entityUuid);
                        if (valueData) {
                            valueData.valueEn = translatedText.slice(0, 64);
                            valueData.value.valueEn = translatedText.slice(0, 64);
                            break;
                        }
                    }
                    break;
                }
            }
        }

        // Save all changes in batch

        for (const [, update] of productUpdates) {
            try {
                // Save product
                await this.productRepository.save(update.product);

                // Save variants
                if (update.variants.size > 0) {
                    const variantsToSave = Array.from(update.variants.values())
                        .filter(v => v.titleEn !== undefined)
                        .map(v => v.variant);
                    if (variantsToSave.length > 0) {
                        await this.productVariantRepository.save(variantsToSave);
            }
        }

                // Save options
                const optionsToSave: any[] = [];
                const optionValuesToSave: any[] = [];

                for (const [, optionData] of update.options) {
                    if (optionData.nameEn !== undefined) {
                        optionsToSave.push(optionData.option);
                    }

                    for (const [, valueData] of optionData.values) {
                        if (valueData.valueEn !== undefined) {
                            optionValuesToSave.push(valueData.value);
                        }
                    }
                }

                if (optionsToSave.length > 0) {
                    await this.productOptionRepository.save(optionsToSave);
                }

                if (optionValuesToSave.length > 0) {
                    await this.productOptionValueRepository.save(optionValuesToSave);
                }

                this.logger.log(`Successfully applied translations for product ${update.product.uuid}`);

            } catch (error: any) {
                this.logger.error(`Failed to save translations for product ${update.product.uuid}: ${error.message}`);
            }
        }

        return productsToUpdate;
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
        const chineseProducts = await this.findProductsWithChinese();

        const productsNeedingTranslation = await this.findProductsNeedingTranslation(targetLanguageCodes);;

        if (chineseProducts && chineseProducts.length > 0) {
            this.logger.log('Appending chinese product uuids');
            productsNeedingTranslation.concat(chineseProducts)
        }

        this.logger.log(`Found ${productsNeedingTranslation.length} product(s) needing translation`);

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
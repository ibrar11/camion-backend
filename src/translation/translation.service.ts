import {
    Inject,
    Injectable,
    Logger
} from '@nestjs/common';

import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { FieldTranslationType } from './enums/FieldTranslationType.enum';
import {
    JobPriority,
    QueueName
} from 'src/queue/enums/QueueTypes.enum';

import { QueueService } from '../queue/queue.service';

import { Product } from '../inventory/entities/product.entity';
import { ProductVariant } from '../inventory/entities/product-variant.entity';
import { ProductOption } from '../inventory/entities/product-option.entity';
import { ProductOptionValue } from '../inventory/entities/product-option-value.entity';

import { Category } from '../inventory/entities/category.entity';

import {
    FieldTranslationJobData,
    TranslatedFieldResult
} from './types';

@Injectable()
export class TranslationService {
    private readonly logger = new Logger(TranslationService.name);
    private pendingJobs = new Map<string, NodeJS.Timeout>();

    // Track pending translations to avoid duplicates
    private pendingTranslations = new Map<string, NodeJS.Timeout>();

    constructor(
        @InjectRepository(Product) private readonly productRepository: Repository<Product>,
        @InjectRepository(ProductVariant) private readonly variantRepository: Repository<ProductVariant>,
        @InjectRepository(ProductOption) private readonly optionRepository: Repository<ProductOption>,
        @InjectRepository(ProductOptionValue) private readonly optionValueRepository: Repository<ProductOptionValue>,
        @InjectRepository(Category) private readonly categoryRepository: Repository<Category>,
        @Inject(QueueService) private readonly queueService: QueueService,
    ) { }

    /**
     * Queue a single product for translation after all its related entities
     * (options, option values, variants) are created.
     */
    async queueProductTranslation(productUuid: string, delayMs: number = 5000): Promise<void> {
        this.logger.log(`Scheduling translation for product ${productUuid} with ${delayMs}ms delay`);

        // Clear any existing pending translation for this product
        const existingTimeout = this.pendingTranslations.get(productUuid);
        if (existingTimeout) {
            clearTimeout(existingTimeout);
            this.logger.log(`Cleared previous translation schedule for product ${productUuid}`);
        }

        // Schedule new translation check
        const timeout = setTimeout(async () => {
            this.pendingTranslations.delete(productUuid);
            await this.checkAndQueueTranslation(productUuid);
        }, delayMs);

        this.pendingTranslations.set(productUuid, timeout);
    }

    /**
     * Check if product has all minimum required data before queuing translation
     */
    private async checkAndQueueTranslation(productUuid: string): Promise<void> {
        const product = await this.productRepository.findOne({
            where: { uuid: productUuid },
            relations: {
                variants: true,
                options: {
                    values: true,
                },
            },
        });

        if (!product) {
            this.logger.warn(`Product ${productUuid} not found for translation`);
            return;
        }

        // Check if product has at least one variant (complete enough for translation)
        const hasVariants = product.variants && product.variants.length > 0;

        if (!hasVariants) {
            this.logger.log(`Product ${productUuid} has no variants yet, rescheduling translation check`);
            // Reschedule after another 5 seconds
            setTimeout(() => this.checkAndQueueTranslation(productUuid), 5000);
            return;
        }

        this.logger.log(`Product ${productUuid} is ready for translation. Adding to queue.`);

        // Add to translation queue
        await this.queueService.addImportedProductsTranslationJob([productUuid], "en");
    }

    /**
     * Queue field translation with debouncing
     */
    async queueFieldTranslation(
        fieldType: FieldTranslationType,
        entityUuid: string,
        productUuid: string,
        newValue: string,
        sourceLanguage: string = 'en',
        delayMs: number = 1000,
    ): Promise<void> {
        const jobKey = `${fieldType}:${entityUuid}`;

        // Debounce: clear existing pending job
        const existing = this.pendingJobs.get(jobKey);
        if (existing) {
            clearTimeout(existing);
            this.logger.debug(`Debounced previous translation for ${jobKey}`);
        }

        // Schedule new job
        const timeout = setTimeout(async () => {
            this.pendingJobs.delete(jobKey);
            await this.addFieldTranslationJob(
                fieldType,
                entityUuid,
                productUuid,
                newValue,
                sourceLanguage
            );
        }, delayMs);

        this.pendingJobs.set(jobKey, timeout);
    }

    /**
     * Add field translation job to queue
     */
    private async addFieldTranslationJob(
        fieldType: FieldTranslationType,
        entityUuid: string,
        productUuid: string,
        newValue: string,
        sourceLanguage: string,
    ): Promise<void> {
        const jobData: FieldTranslationJobData = {
            jobId: `${fieldType}-${entityUuid}-${Date.now()}`,
            fieldType,
            entityUuid,
            productUuid,
            newValue,
            sourceLanguage,
            createdAt: new Date(),
            maxRetries: 3,
        };

        this.logger.log(`Queueing field translation: ${fieldType} for entity ${entityUuid}`);

        await this.queueService.addJob(
            QueueName.FIELD_TRANSLATION,
            `field-translate-${jobData.jobId}`,
            jobData,
            JobPriority.HIGH,
            0,
        );
    }

    /**
     * Apply translated value to the appropriate entity
     */
    async applyTranslation(result: TranslatedFieldResult): Promise<void> {
        const { fieldType, entityUuid, translations } = result;

        for (const [language, translatedText] of translations) {
            switch (fieldType) {
                case FieldTranslationType.PRODUCT_TITLE:
                    await this.updateProductField(entityUuid, language, 'title', translatedText);
                    break;
                case FieldTranslationType.PRODUCT_BRIEF:
                    await this.updateProductField(entityUuid, language, 'brief', translatedText);
                    break;
                case FieldTranslationType.PRODUCT_DESCRIPTION:
                    await this.updateProductField(entityUuid, language, 'description', translatedText);
                    break;
                case FieldTranslationType.VARIANT_TITLE:
                    await this.updateVariantField(entityUuid, language, 'title', translatedText);
                    break;
                case FieldTranslationType.OPTION_NAME:
                    await this.updateOptionField(entityUuid, language, 'name', translatedText);
                    break;
                case FieldTranslationType.OPTION_VALUE:
                    await this.updateOptionValueField(entityUuid, language, 'value', translatedText);
                    break;
                case FieldTranslationType.CATEGORY_NAME:
                    await this.updateCategoryField(entityUuid, language, 'name', translatedText);
                    break;
            }
        }
    }

    private async updateProductField(
        productUuid: string,
        language: string,
        field: 'title' | 'brief' | 'description',
        translatedText: string,
    ): Promise<void> {
        const updateData: any = {};
        if (language === 'ar') {
            updateData[`${field}Ar`] = translatedText;
        }

        await this.productRepository.update({ uuid: productUuid }, updateData);
        this.logger.debug(`Updated product ${productUuid} ${field}.${language} = ${translatedText}`);
    }

    private async updateVariantField(
        variantUuid: string,
        language: string,
        field: 'title',
        translatedText: string,
    ): Promise<void> {
        const updateData: any = {};
        if (language === 'ar') {
            updateData[`${field}Ar`] = translatedText;
        }

        await this.variantRepository.update({ uuid: variantUuid }, updateData);
        this.logger.debug(`Updated variant ${variantUuid} ${field}.${language} = ${translatedText}`);
    }

    private async updateOptionField(
        optionUuid: string,
        language: string,
        field: 'name',
        translatedText: string,
    ): Promise<void> {
        const updateData: any = {};
        if (language === 'ar') {
            updateData[`${field}Ar`] = translatedText;
        }

        await this.optionRepository.update({ uuid: optionUuid }, updateData);
        this.logger.debug(`Updated option ${optionUuid} ${field}.${language} = ${translatedText}`);
    }

    private async updateOptionValueField(
        optionValueUuid: string,
        language: string,
        field: 'value',
        translatedText: string,
    ): Promise<void> {
        const updateData: any = {};
        if (language === 'ar') {
            updateData[`${field}Ar`] = translatedText;
        }

        await this.optionValueRepository.update({ uuid: optionValueUuid }, updateData);
        this.logger.debug(`Updated option value ${optionValueUuid} ${field}.${language} = ${translatedText}`);
    }

    private async updateCategoryField(
        categoryUuid: string,
        language: string,
        field: 'name',
        translatedText: string,
    ): Promise<void> {
        const updateData: any = {};
        if (language === 'ar') {
            updateData[`${field}Ar`] = translatedText;
        }

        await this.categoryRepository.update({ uuid: categoryUuid }, updateData);
        this.logger.debug(`Updated category ${categoryUuid} ${field}.${language} = ${translatedText}`);
    }
}

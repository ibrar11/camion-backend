import { 
    Logger, 
    Injectable, 
    Inject 
} from '@nestjs/common';

import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { 
    Processor, 
    WorkerHost 
} from '@nestjs/bullmq';

import { Job } from 'bullmq';

import { QueueName } from '../../queue/enums/QueueTypes.enum';

import { ProductTranslationProvider } from '../providers/product-translation.provider';

import { TranslationService } from '../translation.service';

import { TranslationItemService } from '../translation-item.service';

import { Language } from '../../languages/entities/language.entity';

import { 
    FieldTranslationJobData, 
    TranslatedFieldResult 
} from '../types';

@Processor(QueueName.FIELD_TRANSLATION, {
    concurrency: 2,  // Higher concurrency for small field translations
    limiter: {
        max: 20,      // Allow more field translations per second
        duration: 1000,
    },
})
@Injectable()
export class FieldTranslationProcessor extends WorkerHost {
    private readonly logger = new Logger(FieldTranslationProcessor.name);

    constructor(
        @InjectRepository(Language) private readonly languageRepository: Repository<Language>,
        @Inject(ProductTranslationProvider)private readonly translationProvider: ProductTranslationProvider,
        @Inject(TranslationService)private readonly translationService: TranslationService,
        @Inject(TranslationItemService)private readonly translationItemService: TranslationItemService,
    ) {
        super();
    }

    async process(job: Job<FieldTranslationJobData>): Promise<TranslatedFieldResult> {
        const {
            fieldType,
            entityUuid,
            productUuid,
            newValue,
            sourceLanguage,
        } = job.data;

        this.logger.log(
            `Processing field translation: ${fieldType} for ${entityUuid} (product: ${productUuid})`
        );

        try {
            // Translate to all target languages
            const translations = new Map<string, string>();

            const languages = await this.languageRepository.find();

            const targetLanguages = languages.filter(
                (lang) => lang.shortCode !== sourceLanguage,
            );

            for (const targetLanguage of targetLanguages) {
                const translatedText = await this.translationProvider.translateSingleText(
                    newValue,
                    targetLanguage.shortCode,
                    sourceLanguage,
                );
                translations.set(targetLanguage.shortCode, translatedText);
                this.logger.debug(
                    `Translated "${newValue}" (${sourceLanguage}) → "${translatedText}" (${targetLanguage})`
                );
            }

            // Apply the translation to the entity
            const result: TranslatedFieldResult = {
                fieldType,
                entityUuid,
                translations,
                success: true,
            };

            await this.translationService.applyTranslation(result);

            // Update translation_items table for audit trail
            await this.translationItemService.saveFieldTranslation({
                fieldType,
                entityUuid,
                productUuid,
                sourceLanguage,
                translations: Object.fromEntries(translations),
                originalValue: newValue,
                translatedAt: new Date(),
            });

            this.logger.log(
                `Successfully translated ${fieldType} for ${entityUuid} (product: ${productUuid})`
            );

            return result;

        } catch (error: any) {
            this.logger.error(
                `Failed to translate ${fieldType} for ${entityUuid}: ${error.message}`
            );

            return {
                fieldType,
                entityUuid,
                translations: new Map(),
                success: false,
                error: error.message,
            };
        }
    }
}
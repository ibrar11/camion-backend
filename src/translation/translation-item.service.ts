import {
    Injectable,
    Logger,
    NotFoundException
} from '@nestjs/common';

import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { Translation } from '../translation/entities/translation.entity';
import { TranslateField, TranslationItem } from '../translation/entities/translation-item.entity';

import { Language } from '../languages/entities/language.entity';

import { FieldTranslationType } from './enums/FieldTranslationType.enum';

interface SaveFieldTranslationParams {
    fieldType: FieldTranslationType;
    entityUuid: string;
    productUuid: string;
    sourceLanguage: string;
    translations: Record<string, string>;
    originalValue: string;
    translatedAt: Date;
}

@Injectable()
export class TranslationItemService {
    private readonly logger = new Logger(TranslationItemService.name);

    constructor(
        @InjectRepository(Translation)
        private readonly translationRepository: Repository<Translation>,
        @InjectRepository(TranslationItem)
        private readonly translationItemRepository: Repository<TranslationItem>,
        @InjectRepository(Language)
        private readonly languageRepository: Repository<Language>,
    ) { }

    async saveFieldTranslation(params: SaveFieldTranslationParams): Promise<void> {
        try {


            const {
                fieldType,
                entityUuid,
                productUuid,
                sourceLanguage,
                translations,
                originalValue,
                translatedAt,
            } = params;

            // Find or create translation record for the product
            let translation = await this.translationRepository.findOne({
                where: {
                    entityUuid: productUuid,
                    entityType: 'product',
                },
            });

            if (!translation) {
                throw new NotFoundException({
                    error: `Translation not found for ${productUuid}`
                })
            }

            // For each target language, create/update translation item
            for (const [targetLanguageCode, translatedText] of Object.entries(translations)) {
                const language = await this.languageRepository.findOne({
                    where: { shortCode: targetLanguageCode },
                });

                if (!language) {
                    this.logger.warn(`Language ${targetLanguageCode} not found`);
                    continue;
                }

                // Check if translation item already exists for this language
                let existingItem = await this.translationItemRepository.findOne({
                    where: {
                        translation: { id: translation.id },
                        language: { id: language.id },
                    },
                });

                // Build field-specific update data with MERGE logic
                const fieldData = await this.buildFieldDataWithMerge(
                    fieldType,
                    entityUuid,
                    translatedText,
                    existingItem,
                );

                if (existingItem) {
                    // Update existing item with merged data
                    await this.translationItemRepository.update(
                        { id: existingItem.id },
                        {
                            ...fieldData,
                            updatedAt: new Date(),
                        }
                    );
                }
            }

            this.logger.debug(`Saved field translation for ${fieldType} of ${entityUuid}`);

        } catch (error: any) {
            this.logger.error(`Failed to save field translation: ${error}`);
        }
    }

    /**
     * Build field data with MERGE logic for JSON arrays
     */
    private async buildFieldDataWithMerge(
        fieldType: FieldTranslationType,
        entityUuid: string,
        translatedText: string,
        existingItem: TranslationItem | null,
    ): Promise<any> {
        const fieldData: any = {};

        switch (fieldType) {
            case FieldTranslationType.PRODUCT_TITLE:
                fieldData.translatedProductTitle = translatedText;
                break;

            case FieldTranslationType.PRODUCT_BRIEF:
                fieldData.translatedProductBrief = translatedText;
                break;

            case FieldTranslationType.PRODUCT_DESCRIPTION:
                fieldData.translatedProductDescription = translatedText;
                break;

            case FieldTranslationType.VARIANT_TITLE:
                fieldData.translatedProductVariants = await this.mergeTranslatedField(
                    existingItem?.translatedProductVariants,
                    entityUuid,
                    translatedText,
                );
                break;

            case FieldTranslationType.OPTION_NAME:
                fieldData.translatedProductOptions = await this.mergeTranslatedField(
                    existingItem?.translatedProductOptions,
                    entityUuid,
                    translatedText,
                );
                break;

            case FieldTranslationType.OPTION_VALUE:
                fieldData.translatedProductOptionValues = await this.mergeTranslatedField(
                    existingItem?.translatedProductOptionValues,
                    entityUuid,
                    translatedText,
                );
                break;

            case FieldTranslationType.CATEGORY_NAME:
                fieldData.translatedCategories = await this.mergeTranslatedField(
                    existingItem?.translatedCategories,
                    entityUuid,
                    translatedText,
                );
                break;
        }

        return fieldData;
    }

    /**
     * Merge a new translation into an existing array of translations
     * 
     * @param existingArray - Existing array of translations (JSON string or parsed array)
     * @param entityUuid - UUID of the entity being translated
     * @param translatedText - New translated text
     * @param originalValue - Original source text
     * @returns Updated array as JSONB-ready value
     */
    private async mergeTranslatedField(
        existingArray: any,
        entityUuid: string,
        translatedText: string,
    ): Promise<any> {
        // Parse existing array (handle both string and parsed array cases)
        let translations: TranslateField[] = [];

        if (existingArray) {
            if (typeof existingArray === 'string') {
                try {
                    translations = JSON.parse(existingArray);
                } catch (error: any) {
                    this.logger.warn(`Failed to parse existing translations: ${error}`);
                    translations = [];
                }
            } else if (Array.isArray(existingArray)) {
                translations = existingArray;
            }
        }

        // Find if this entity already has a translation
        const existingIndex = translations.findIndex(t => t.uuid === entityUuid);

        const newTranslation: TranslateField = {
            uuid: entityUuid,
            translatedText,
        };

        if (existingIndex >= 0) {
            translations[existingIndex] = newTranslation;
            this.logger.debug(`Updated existing translation for ${entityUuid}`);
        } else {
            translations.push(newTranslation);
            this.logger.debug(`Added new translation for ${entityUuid}`);
        }

        return translations;
    }

}
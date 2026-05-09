import { FieldTranslationType } from "./enums/FieldTranslationType.enum";

export interface TranslationProvider {
    translate(text: string, targetLanguage: string, sourceLanguage?: string): Promise<string>;
    batchTranslate(texts: string[], targetLanguage: string, sourceLanguage?: string): Promise<string[]>;
    getSupportedLanguages(): Promise<Array<{ code: string; name: string }>>;
}

export interface FieldTranslationJobData {
    jobId: string;
    fieldType: FieldTranslationType;
    entityUuid: string;
    productUuid: string;
    newValue: string;
    sourceLanguage: string;
    oldValue?: string;
    createdAt: Date;
    maxRetries?: number;
}

export interface TranslatedFieldResult {
    fieldType: FieldTranslationType;
    entityUuid: string;
    translations: Map<string, string>;
    success: boolean;
    error?: string;
}
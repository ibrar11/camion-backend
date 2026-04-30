export interface BaseJobData {
    jobId: string;
    createdAt: Date;
    retryCount?: number;
    maxRetries?: number;
}

export interface TranslationJobData {
    jobId: string;

    productUuids: string[];

    sourceLanguageId: number;

    createdAt: Date;

    maxRetries?: number;
}
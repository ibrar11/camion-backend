import { 
    Injectable, 
    Inject 
} from '@nestjs/common';

import { 
    Cache, 
    CACHE_MANAGER 
} from '@nestjs/cache-manager';

@Injectable()
export class TranslationJobRegistryService {
    private readonly JOB_PREFIX = 'translation-job:';
    private readonly JOB_TTL = 3600000; // 1 hour in milliseconds

    constructor(@Inject(CACHE_MANAGER) private readonly cacheManager: Cache) { }

    /**
     * Try to register a translation job for a product
     * Returns true if job can be queued, false if already queued or processing
     */
    async tryRegisterJob(productUuid: string, jobType: 'full' | 'field', fieldType?: string): Promise<boolean> {
        const key = fieldType
            ? `${this.JOB_PREFIX}${productUuid}:${jobType}:${fieldType}`
            : `${this.JOB_PREFIX}${productUuid}:${jobType}`;

        const existing = await this.cacheManager.get(key);
        if (existing) {
            return false; // Job already registered
        }

        // Register this job
        await this.cacheManager.set(key, Date.now(), this.JOB_TTL);
        return true;
    }

    /**
     * Clear job registration after completion
     */
    async clearJob(productUuid: string, jobType: 'full' | 'field', fieldType?: string): Promise<void> {
        const key = fieldType
            ? `${this.JOB_PREFIX}${productUuid}:${jobType}:${fieldType}`
            : `${this.JOB_PREFIX}${productUuid}:${jobType}`;

        await this.cacheManager.del(key);
    }

    /**
     * Check if a product is currently being translated
     */
    async isProductBeingTranslated(productUuid: string): Promise<boolean> {
        const keys = [
            `${this.JOB_PREFIX}${productUuid}:full`,
            `${this.JOB_PREFIX}${productUuid}:field:product_title`,
            `${this.JOB_PREFIX}${productUuid}:field:product_brief`,
            `${this.JOB_PREFIX}${productUuid}:field:product_description`,
        ];

        for (const key of keys) {
            const exists = await this.cacheManager.get(key);
            if (exists) return true;
        }
        return false;
    }
}
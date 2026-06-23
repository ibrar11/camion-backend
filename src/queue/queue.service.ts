import * as crypto from 'node:crypto';

import {
    Inject,
    Injectable,
    Logger,
} from '@nestjs/common';

import { InjectQueue } from '@nestjs/bullmq';

import {
    Queue,
    Job,
    JobType,
} from 'bullmq';

import {
    QueueName,
    JobPriority,
} from './enums/QueueTypes.enum';

import {
    BaseJobData,
    InventoryResyncJobData,
    ProductCategoryResyncJobData,
    SkuMetaImportJobData,
    TranslationJobData,
} from './types';

import { TranslationJobRegistryService } from '../translation/translation-job-registry.service';

@Injectable()
export class QueueService {
    private readonly logger = new Logger(QueueService.name);

    constructor(
        @InjectQueue(QueueName.TRANSLATION) private readonly translationQueue: Queue,
        @InjectQueue(QueueName.FIELD_TRANSLATION) private readonly fieldTranslationQueue: Queue,
        @InjectQueue(QueueName.INVENTORY_RESYNC) private readonly inventoryResyncQueue: Queue,
        @InjectQueue(QueueName.PRODUCT_CATEGORY_RESYNC) private readonly productCategoryResyncQueue: Queue,
        @InjectQueue(QueueName.SKU_META_IMPORT) private readonly skuMetaImportQueue: Queue,
        @Inject(TranslationJobRegistryService) private readonly jobRegistry: TranslationJobRegistryService,
    ) { }

    /**
     * Generic queue add
     */
    async addJob<T extends BaseJobData>(
        queueName: QueueName,
        name: string,
        data: T,
        priority?: JobPriority,
        delay?: number,
    ): Promise<Job<T>> {
        this.logger.debug(`Adding job ${name} to queue ${queueName}`);

        const queue = this.getQueue(queueName);

        return queue.add(name, data, {
            priority,
            delay,
            jobId: data.jobId,
            removeOnComplete: 100,
            removeOnFail: 50,
            attempts: data.maxRetries ?? 3,
            backoff: {
                type: 'exponential',
                delay: 5000,
            },
        });
    }

    /**
 * Generic queue add with deduplication
 */
    async addJobWithDeduplication<T extends BaseJobData>(
        queueName: QueueName,
        name: string,
        data: TranslationJobData,
        deduplicationKey: string,
        priority?: JobPriority,
        delay?: number,
    ): Promise<Job<T> | null> {
        // Check if job already exists in queue
        const queue = this.getQueue(queueName);

        // Check for existing job with same deduplication key
        const existingJobs = await queue.getJobs(['waiting', 'active', 'delayed']);
        const existingJob = existingJobs.find(job =>
            job.data?.deduplicationKey === deduplicationKey ||
            job.id?.startsWith(deduplicationKey)
        );

        if (existingJob) {
            this.logger.debug(`Job ${deduplicationKey} already exists in queue, skipping`);
            return null;
        }

        // Also check registry
        const canRegister = await this.jobRegistry.tryRegisterJob(
            data.productUuids?.[0] || deduplicationKey,
            'full'
        );

        if (!canRegister) {
            this.logger.debug(`Product ${data.productUuids?.[0]} already has a translation job, skipping`);
            return null;
        }

        // Use deterministic jobId for deduplication
        const deterministicJobId = `${deduplicationKey}-${Date.now()}`;

        return queue.add(name, {
            ...data,
            deduplicationKey,
        }, {
            priority,
            delay,
            jobId: deterministicJobId,
            removeOnComplete: 100,
            removeOnFail: 50,
            attempts: 3,
        });
    }

    /**
     * Translation Batch Job
     *
     * One import = one translation job
     */
    async addTranslationJob(
        data: Omit<TranslationJobData, 'jobId' | 'createdAt'>,
    ): Promise<Job<TranslationJobData>> {
        const jobData: TranslationJobData = {
            ...data,
            jobId: crypto.randomUUID(),
            createdAt: new Date(),
            maxRetries: data.maxRetries ?? 3,
        };

        this.logger.log(
            `Adding translation job for ${jobData.productUuids.length} products (jobId=${jobData.jobId})`,
        );

        return this.addJob(
            QueueName.TRANSLATION,
            `translate-products-${jobData.jobId}`,
            jobData,
            JobPriority.HIGH,
            0,
        );
    }

    /**
     * Called after procurement import finishes
     */
    async addImportedProductsTranslationJob(
        productUuids: string[],
        sourceLanguageCode: string,
    ): Promise<Job<TranslationJobData> | null> {
        if (!productUuids.length) {
            return null;
        }

        this.logger.log(
            `Queueing translation job for ${productUuids.length} products`,
        );

        // Create a deterministic key based on product UUIDs
        const deduplicationKey = `translate-${productUuids.sort().join('-')}`;

        const jobData: TranslationJobData = {
            productUuids,
            sourceLanguageCode,
            jobId: crypto.randomUUID(),
            createdAt: new Date(),
            maxRetries: 3,
            deduplicationKey,
        };

        // Check each product individually
        for (const productUuid of productUuids) {
            const isBeingTranslated = await this.jobRegistry.isProductBeingTranslated(productUuid);
            if (isBeingTranslated) {
                this.logger.log(`Product ${productUuid} is already being translated, skipping batch job`);
                return null;
            }
        }

        return this.addJobWithDeduplication(
            QueueName.TRANSLATION,
            `translate-products-${deduplicationKey}`,
            jobData,
            deduplicationKey,
            JobPriority.HIGH,
            0,
        );

    }

    async addInventoryResyncJob(productUuids: string[]): Promise<{ jobId: string; status: "queued" }> {
        const jobData: InventoryResyncJobData = {
            jobId: crypto.randomUUID(),
            productUuids,
            createdAt: new Date(),
            maxRetries: 3,
        };

        await this.addJob(
            QueueName.INVENTORY_RESYNC,
            `inventory-resync-${jobData.jobId}`,
            jobData,
            JobPriority.HIGH,
            0,
        );

        return { jobId: jobData.jobId, status: "queued" };
    }

    async addProductCategoryResyncJob(productUuids: string[]): Promise<{ jobId: string; status: "queued" }> {
        const jobData: ProductCategoryResyncJobData = {
            jobId: crypto.randomUUID(),
            productUuids,
            createdAt: new Date(),
            maxRetries: 3,
        };

        await this.addJob(
            QueueName.PRODUCT_CATEGORY_RESYNC,
            `product-category-resync-${jobData.jobId}`,
            jobData,
            JobPriority.HIGH,
            0,
        );

        return { jobId: jobData.jobId, status: "queued" };
    }

    async addSkuMetaImportJob(productUuids: string[]): Promise<{ jobId: string; status: "queued" }> {
        const jobData: SkuMetaImportJobData = {
            jobId: crypto.randomUUID(),
            productUuids,
            createdAt: new Date(),
            maxRetries: 3,
        };

        await this.addJob(
            QueueName.SKU_META_IMPORT,
            `sku-meta-import-${jobData.jobId}`,
            jobData,
            JobPriority.HIGH,
            0,
        );

        return { jobId: jobData.jobId, status: "queued" };
    }

    async getJob(queueName: QueueName, jobId: string): Promise<Job | null> {
        const queue = this.getQueue(queueName);
        return (await queue.getJob(jobId)) ?? null;
    }

    async getJobs(queueName: QueueName, statuses: JobType[]): Promise<Job[]> {
        const queue = this.getQueue(queueName);
        return (await queue.getJobs(statuses));
    }

    /**
     * Queue stats
     */
    async getQueueStats(queueName: QueueName): Promise<{
        waiting: number;
        active: number;
        completed: number;
        failed: number;
        delayed: number;
    }> {
        const queue = this.getQueue(queueName);

        const [waiting, active, completed, failed, delayed] =
            await Promise.all([
                queue.getWaitingCount(),
                queue.getActiveCount(),
                queue.getCompletedCount(),
                queue.getFailedCount(),
                queue.getDelayedCount(),
            ]);

        return {
            waiting,
            active,
            completed,
            failed,
            delayed,
        };
    }

    private getQueue(queueName: QueueName): Queue {
        switch (queueName) {
            case QueueName.TRANSLATION:
                return this.translationQueue;
            case QueueName.FIELD_TRANSLATION:
                return this.fieldTranslationQueue;
            case QueueName.INVENTORY_RESYNC:
                return this.inventoryResyncQueue;
            case QueueName.PRODUCT_CATEGORY_RESYNC:
                return this.productCategoryResyncQueue;
            case QueueName.SKU_META_IMPORT:
                return this.skuMetaImportQueue;

            default:
                throw new Error(`Queue ${queueName} not found`);
        }
    }

    async clearAllJobs(queueName: QueueName): Promise<void> {
        const queue = this.getQueue(queueName);

        // remove jobs by state
        await Promise.all([
            queue.drain(true),        // removes waiting + delayed
            queue.clean(0, 1000, 'completed'),
            queue.clean(0, 1000, 'failed'),
        ]);

        this.logger.warn(`Cleared all jobs from queue ${queueName}`);
    }
}

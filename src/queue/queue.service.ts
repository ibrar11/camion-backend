import * as crypto from 'node:crypto';

import {
    Injectable,
    Logger,
} from '@nestjs/common';

import { InjectQueue } from '@nestjs/bullmq';

import {
    Queue,
    Job,
} from 'bullmq';

import {
    QueueName,
    JobPriority,
} from './enums/QueueTypes.enum';

import {
    BaseJobData,
    TranslationJobData,
} from './types';

@Injectable()
export class QueueService {
    private readonly logger = new Logger(QueueService.name);

    constructor(
        @InjectQueue(QueueName.TRANSLATION)
        private readonly translationQueue: Queue,
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
            `Adding translation job function ${jobData}`,
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
        sourceLanguageId: number,
    ): Promise<void> {
        if (!productUuids.length) {
            return;
        }

        this.logger.log(
            `Queueing translation job for ${productUuids.length} products`,
        );

        await this.addTranslationJob({
            productUuids,
            sourceLanguageId,
        });
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

            default:
                throw new Error(`Queue ${queueName} not found`);
        }
    }
}
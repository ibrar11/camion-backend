import {
    Injectable,
    Logger,
    OnModuleInit,
    OnModuleDestroy,
} from '@nestjs/common';

import { InjectQueue } from '@nestjs/bullmq';

import {
    Queue,
    QueueEvents,
} from 'bullmq';

import { QueueName } from '../../queue/enums/QueueTypes.enum';

@Injectable()
export class TranslationQueue
    implements OnModuleInit, OnModuleDestroy {
    private readonly logger = new Logger(TranslationQueue.name);

    private queueEvents: QueueEvents;

    constructor(
        @InjectQueue(QueueName.TRANSLATION)
        private readonly queue: Queue,
    ) { }

    async onModuleInit(): Promise<void> {
        this.logger.log('Initializing Translation Queue Events');

        this.queueEvents = new QueueEvents(QueueName.TRANSLATION, {
            connection: this.queue.opts.connection,
        });

        await this.queueEvents.waitUntilReady();

        this.setupEventListeners();
    }

    async onModuleDestroy(): Promise<void> {
        if (this.queueEvents) {
            await this.queueEvents.close();
        }
    }

    private setupEventListeners(): void {
        this.queueEvents.on('completed', ({ jobId }) => {
            this.logger.log(
                `Translation job ${jobId} completed successfully`,
            );
        });

        this.queueEvents.on('failed', ({ jobId, failedReason }) => {
            this.logger.error(
                `Translation job ${jobId} failed: ${failedReason}`,
            );
        });

        this.queueEvents.on('stalled', ({ jobId }) => {
            this.logger.warn(
                `Translation job ${jobId} stalled and will retry automatically`,
            );
        });

        this.queueEvents.on('progress', ({ jobId, data }) => {
            this.logger.debug(
                `Translation job ${jobId} progress: ${JSON.stringify(data)}`,
            );
        });

        this.queueEvents.on('waiting', ({ jobId }) => {
            this.logger.debug(
                `Translation job ${jobId} added to waiting queue`,
            );
        });

        this.queueEvents.on('active', ({ jobId }) => {
            this.logger.debug(
                `Translation job ${jobId} is now processing`,
            );
        });
    }
}
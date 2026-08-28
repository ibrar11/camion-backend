import {
    Inject,
    Injectable,
    Logger,
} from '@nestjs/common';

import {
    Cron,
    CronExpression,
} from '@nestjs/schedule';

import {
    LessThanOrEqual,
    Repository,
} from 'typeorm';

import {
    InjectRepository,
} from '@nestjs/typeorm';

import { PushNotification } from './entities/push-notification';
import { PushNotificationService } from './push-notification.service';
import { NotificationReceiver } from './enums/notification-receiver.enum';
import { NotificationScheduler } from './enums/notification-scheduler.enum';
import { NotificationStatus } from './enums/notification-status.enum';


@Injectable()
export class PushNotificationScheduler {
    private readonly logger = new Logger(PushNotificationScheduler.name);

    /**
     * PostgreSQL advisory lock ID.
     *
     * This number only needs to be unique for this job.
     */
    private readonly LOCK_ID = 987654321;

    constructor(
        @InjectRepository(PushNotification) private readonly pushNotificationRepository: Repository<PushNotification>,
        @Inject(PushNotificationService) private readonly pushNotificationService: PushNotificationService,
    ) { }

    /**
     * Run every 5 minutes.
     *
     * IMPORTANT:
     * This cron runs on every ECS task, but only ONE task
     * will acquire the PostgreSQL advisory lock.
     */
    @Cron(CronExpression.EVERY_5_MINUTES)
    async processScheduledNotifications(): Promise<void> {

        const acquired = await this.acquireLock();

        if (!acquired) {
            this.logger.debug(
                'Another ECS instance is already processing scheduled notifications.',
            );

            return;
        }

        try {
            this.logger.log(
                'Acquired scheduled notification worker lock.',
            );

            await this.recoverStuckNotifications();
            await this.processDueNotifications();

        } catch (error: any) {
            this.logger.error(
                `Scheduled notification worker failed: ${error?.message || error}`, error?.stack,
            );

        } finally {
            await this.releaseLock();
            this.logger.debug(
                'Released scheduled notification worker lock.',
            );
        }
    }

    /**
     * Acquire distributed PostgreSQL lock.
     *
     * pg_try_advisory_lock:
     *
     * true  -> this ECS task is the worker
     * false -> another ECS task is already the worker
     */
    private async acquireLock(): Promise<boolean> {

        const result = await this.pushNotificationRepository.query(
            `SELECT pg_try_advisory_lock($1) AS locked`,
            [this.LOCK_ID],
        );

        return result?.[0]?.locked === true;
    }


    /**
     * Release distributed PostgreSQL lock.
     */
    private async releaseLock(): Promise<void> {

        try {
            await this.pushNotificationRepository.query(
                `SELECT pg_advisory_unlock($1)`,
                [this.LOCK_ID],
            );

        } catch (error: any) {
            this.logger.error(
                `Failed to release scheduler lock: ${error?.message || error
                }`,
            );
        }
    }


    /**
     * Find and process notifications that are due.
     */
    private async processDueNotifications(): Promise<void> {
        const now = new Date();

        const notifications = await this.pushNotificationRepository.find({
            where: {
                status: NotificationStatus.PENDING,
                scheduledFor: LessThanOrEqual(now),
            },
            relations: {
                images: true,
            },
            order: {
                scheduledFor: 'ASC',
            },
        });

        if (!notifications.length) {

            this.logger.debug(
                'No scheduled notifications are due.',
            );
            return;
        }

        this.logger.log(
            `Found ${notifications.length} scheduled notification(s).`,
        );

        for (const notification of notifications) {
            try {
                /**
                 * Claim notification.
                 *
                 * Even though we already have the advisory lock,
                 * this additional atomic condition is useful protection.
                 */
                const claimResult = await this.pushNotificationRepository
                    .createQueryBuilder()
                    .update(PushNotification)
                    .set({
                        status: NotificationStatus.PROCESSING,
                        processingStartedAt: new Date(),
                    })
                    .where(
                        'id = :id',
                        {
                            id: notification.id,
                        },
                    )
                    .andWhere(
                        'status = :status',
                        {
                            status: NotificationStatus.PENDING,
                        },
                    )
                    .execute();

                /**
                 * Somebody else already claimed it.
                 */
                if (claimResult.affected !== 1) {
                    this.logger.warn(
                        `Notification ${notification.uuid} was already claimed. Skipping.`,
                    );

                    continue;
                }
                this.logger.log(
                    `Processing notification ${notification.uuid}`,
                );
                /**
                 * SEND PUSH
                 */
                await this.pushNotificationService.push({ notificationUUID: [notification.uuid], receiverType: NotificationReceiver.ALLCUSTOMER });

                /**
                 * Handle recurring notification.
                 */
                if (notification.repeatInterval && notification.scheduledFor) {

                    const nextScheduledTime = this.calculateNextScheduledTime(
                        notification.scheduledFor,
                        notification.repeatInterval,
                    );

                    notification.scheduledFor = nextScheduledTime;

                    notification.status = NotificationStatus.PENDING;
                } else {
                    notification.scheduledFor = null;
                    notification.status = NotificationStatus.SENT;
                }

                notification.processingStartedAt = null;


                await this.pushNotificationRepository.save(
                    notification,
                );


                this.logger.log(
                    `Notification ${notification.uuid} processed successfully.`,
                );
            } catch (error: any) {
                this.logger.error(
                    `Failed to process notification ${notification.uuid}: ${error?.message || error
                    }`,
                    error?.stack,
                );


                /**
                 * Put it back into PENDING so the next
                 * 5-minute worker cycle can retry it.
                 */
                await this.pushNotificationRepository.update(
                    {
                        id: notification.id,
                    },
                    {
                        status: NotificationStatus.PENDING,
                        processingStartedAt: null,
                    },
                );
            }
        }
    }


    /**
     * Calculate next execution time.
     */
    private calculateNextScheduledTime(scheduledFor: Date, repeatInterval: NotificationScheduler): Date {
        const intervalMs: Record<NotificationScheduler, number> = {

            [NotificationScheduler.EVERY_30_MIN]:
                30 * 60 * 1000,

            [NotificationScheduler.EVERY_3]:
                3 * 60 * 60 * 1000,

            [NotificationScheduler.EVERY_6]:
                6 * 60 * 60 * 1000,

            [NotificationScheduler.EVERY_12]:
                12 * 60 * 60 * 1000,

            [NotificationScheduler.EVERY_24]:
                24 * 60 * 60 * 1000,
        };


        const interval =
            intervalMs[repeatInterval];


        if (!interval) {
            throw new Error(
                `Unsupported repeat interval: ${repeatInterval}`,
            );
        }


        return new Date(
            scheduledFor.getTime() + interval,
        );
    }

    private async recoverStuckNotifications(): Promise<void> {

        const timeout = new Date(
            Date.now() - 10 * 60 * 1000,
        );

        const result =
            await this.pushNotificationRepository
                .createQueryBuilder()
                .update(PushNotification)
                .set({
                    status: NotificationStatus.PENDING,
                    processingStartedAt: null,
                })
                .where(
                    'status = :status',
                    {
                        status: NotificationStatus.PROCESSING,
                    },
                )
                .andWhere(
                    'processingStartedAt < :timeout',
                    {
                        timeout,
                    },
                )
                .execute();


        if (result.affected) {

            this.logger.warn(
                `Recovered ${result.affected} stuck notification(s).`,
            );
        }
    }
}
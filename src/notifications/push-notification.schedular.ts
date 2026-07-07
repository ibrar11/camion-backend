import { NotificationReceiver } from './enums/notification-receiver.enum';
import { Inject, Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { LessThan, LessThanOrEqual, Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';

import { PushNotification } from './entities/push-notification';
import { PushNotificationService } from './push-notification.service';
import { NotificationScheduler } from './enums/notification-scheduler.enum';
import { NotificationStatus } from './enums/notification-status.enum';


@Injectable()
export class PushNotificationScheduler {
    private readonly logger = new Logger(PushNotificationScheduler.name);

    constructor(
        @InjectRepository(PushNotification) private readonly pushNotificationRepository: Repository<PushNotification>,
        @Inject(PushNotificationService) private readonly pushNotificationService: PushNotificationService,
    ) { }

    /**
     * Look for the scheduled notification and marked them processing.
     */
    @Cron(CronExpression.EVERY_HOUR)
    async broadCastNotification() {
        this.logger.log("Checking scheduled notifications...");
        await this.broadcastScheduledNotifications();
    }

    async broadcastScheduledNotifications() {
        const now = new Date();

        const notifications = await this.pushNotificationRepository.find({
            where: {
                scheduledFor: LessThanOrEqual(now),
                status: NotificationStatus.PENDING,
            },
            relations: {
                images: true,
            },
        });

        if (!notifications.length) {
            this.logger.log("No scheduled notifications due.");
            return;
        }

        const notificationUUIDs = notifications.map(notification => notification.uuid);
        const payload = {
            notificationUUID: notificationUUIDs,
            receiverType: NotificationReceiver.ALLCUSTOMER
        }

        await this.pushNotificationService.push(payload)

        for (const notification of notifications) {

            notification.status = NotificationStatus.PROCESSING;

            notification.processingStartedAt = new Date();

            await this.pushNotificationRepository.save(notification);
        }
    }

    /**
     * Look for the processing scheduled notification and broadcast.
     */
    @Cron(CronExpression.EVERY_MINUTE)
    async processNotifications() {
        this.logger.log("Processing the broadcast scheduled notifications......");

        const notifications = await this.pushNotificationRepository.find({
            where: {
                status: NotificationStatus.PROCESSING
            },
            relations: {
                images: true
            }
        });

        for (const notification of notifications) {
            try {
                await this.pushNotificationService.push({
                    notificationUUID: [notification.uuid],
                    receiverType: NotificationReceiver.ALLCUSTOMER
                });
            } catch (error: any) {
                this.logger.error(`Error broadcasting scheduled notification: ${notification.uuid}`, error?.stack);
                notification.status = NotificationStatus.PENDING;
                await this.pushNotificationRepository.save(notification);
            }
            if (notification.repeatInterval && notification.scheduledFor) {
                const nextRun = new Date(notification.scheduledFor);
                if (notification.repeatInterval === NotificationScheduler.EVERY_3) {
                    nextRun.setHours(
                        nextRun.getHours() + 3, 0, 0, 0,
                    );
                }
                if (notification.repeatInterval === NotificationScheduler.EVERY_6) {
                    nextRun.setHours(
                        nextRun.getHours() + 6, 0, 0, 0,
                    );
                }
                if (notification.repeatInterval === NotificationScheduler.EVERY_12) {
                    nextRun.setHours(
                        nextRun.getHours() + 12, 0, 0, 0,
                    );
                }
                if (notification.repeatInterval === NotificationScheduler.EVERY_24) {
                    nextRun.setHours(
                        nextRun.getHours() + 24, 0, 0, 0,
                    );
                }

                notification.scheduledFor = nextRun;
            } else {
                notification.scheduledFor = null;
            }
            await this.pushNotificationRepository.save(notification);
        }
    }

    /**
     * Look for the stuck processing scheduled notification and mark them pending.
     */
    @Cron(CronExpression.EVERY_10_MINUTES)
    async recoverStuckNotifications() {
        this.logger.log("Recovering the stuck notifications......");

        const timeout = new Date();
        timeout.setMinutes(timeout.getMinutes() - 10);

        const notifications =
            await this.pushNotificationRepository.find({
                where: {
                    status: NotificationStatus.PROCESSING,
                    processingStartedAt: LessThan(timeout)
                }
            });

        for (const notification of notifications) {
            notification.status = NotificationStatus.PENDING;
            notification.processingStartedAt = null;
            await this.pushNotificationRepository.save(notification);

        }
    }

}
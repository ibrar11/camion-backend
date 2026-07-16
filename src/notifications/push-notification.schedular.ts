import { NotificationReceiver } from './enums/notification-receiver.enum';
import { Inject, Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { LessThan, Repository } from 'typeorm';
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
    @Cron(CronExpression.EVERY_MINUTE)
    async broadCastNotification() {
        await this.broadcastScheduledNotifications();
    }

    async broadcastScheduledNotifications() {
        const now = new Date();

        const notifications = await this.pushNotificationRepository
            .createQueryBuilder()
            .update(PushNotification)
            .set({
                status: NotificationStatus.PROCESSING,
                processingStartedAt: now,
            })
            .where("status = :status", {
                status: NotificationStatus.PENDING,
            })
            .andWhere("scheduledFor IS NOT NULL")
            .andWhere("scheduledFor <= :now", {
                now,
            })
            .execute();

        if (notifications.affected) {
            this.logger.log(
                `${notifications.affected} notification(s) marked as PROCESSING`,
            );
        }
    }

    /**
     * Look for the processing scheduled notification and broadcast.
     */
    @Cron(CronExpression.EVERY_MINUTE)
    async processNotifications() {

        const notifications = await this.pushNotificationRepository.find({
            where: {
                status: NotificationStatus.PROCESSING,
            },
            relations: {
                images: true,
            },
        });

        if (notifications.length > 0) {
            this.logger.log(`Found ${notifications.length} notifications with processing status`);
        } else {
            return;
        }

        for (const notification of notifications) {
            try {
                await this.pushNotificationService.push({
                    notificationUUID: [notification.uuid],
                    receiverType: NotificationReceiver.ALLCUSTOMER,
                });

                if (notification.repeatInterval && notification.scheduledFor) {

                    const intervalMs: Record<NotificationScheduler, number> = {
                        [NotificationScheduler.EVERY_30_MIN]: 30 * 60 * 1000,
                        [NotificationScheduler.EVERY_3]: 3 * 60 * 60 * 1000,
                        [NotificationScheduler.EVERY_6]: 6 * 60 * 60 * 1000,
                        [NotificationScheduler.EVERY_12]: 12 * 60 * 60 * 1000,
                        [NotificationScheduler.EVERY_24]: 24 * 60 * 60 * 1000,
                    };

                    notification.scheduledFor = new Date(
                        notification.scheduledFor!.getTime() +
                        intervalMs[notification.repeatInterval]
                    );

                    notification.status = NotificationStatus.PENDING;
                } else {
                    notification.scheduledFor = null;
                    notification.status = NotificationStatus.SENT;
                }

                notification.processingStartedAt = null;

                await this.pushNotificationRepository.save(notification);

                this.logger.log(
                    `Notification ${notification.uuid} processed successfully.`,
                );
            } catch (error: any) {
                this.logger.error(
                    `Failed to process notification ${notification.uuid}`,
                    error?.stack,
                );

                notification.status = NotificationStatus.PENDING;
                notification.processingStartedAt = null;

                await this.pushNotificationRepository.save(notification);
            }
        }
    }

    /**
     * Look for the stuck processing scheduled notification and mark them pending.
     */
    @Cron(CronExpression.EVERY_10_MINUTES)
    async recoverStuckNotifications() {

        const timeout = new Date();
        timeout.setMinutes(timeout.getMinutes() - 10);

        const notifications =
            await this.pushNotificationRepository.find({
                where: {
                    status: NotificationStatus.PROCESSING,
                    processingStartedAt: LessThan(timeout)
                }
            });

        if (notifications.length > 0) {
            this.logger.log(`Recovering ${notifications.length} stuck notifications......`);
        } else {
            return;
        }

        for (const notification of notifications) {
            notification.status = NotificationStatus.PENDING;
            notification.processingStartedAt = null;
            await this.pushNotificationRepository.save(notification);

        }
    }

}
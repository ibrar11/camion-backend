import { NotificationReceiver } from './enums/notification-receiver.enum';
import { Inject, Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { Between, Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';

import { PushNotification } from './entities/push-notification';
import { PushNotificationService } from './push-notification.service';
import { NotificationScheduler } from './enums/notification-scheduler.enum';


@Injectable()
export class PushNotificationScheduler {
    private readonly logger = new Logger(PushNotificationScheduler.name);

    constructor(
        @InjectRepository(PushNotification) private readonly pushNotificationRepository: Repository<PushNotification>,
        @Inject(PushNotificationService) private readonly pushNotificationService: PushNotificationService,
    ) { }

    /**
     * Look for the scheduled notification and broadcast.
     */
    @Cron(CronExpression.EVERY_HOUR)
    async broadCastNotification() {
        this.logger.log("Checking scheduled notifications...");
        await this.broadcastScheduledNotifications();
    }

    async broadcastScheduledNotifications() {
        const now = new Date();

        const start = new Date(now);
        start.setMinutes(0, 0, 0);

        const end = new Date(start);
        end.setHours(end.getHours() + 1);

        const notifications = await this.pushNotificationRepository.find({
            where: {
                scheduledFor: Between(start, end),
            },
            relations: {
                images: true,
            },
        });

        const notificationUUIDs = notifications.map(notification => notification.uuid);
        const payload = {
            notificationUUID: notificationUUIDs,
            receiverType: NotificationReceiver.ALLCUSTOMER
        }

        await this.pushNotificationService.push(payload)

        for (const notification of notifications) {

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


}

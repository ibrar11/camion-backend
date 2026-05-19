/* eslint-disable @typescript-eslint/no-unsafe-member-access */
import * as admin from 'firebase-admin';

import {
    BadRequestException,
    Inject,
    Injectable,
    Logger
} from '@nestjs/common';

import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { Notification } from '../notifications/entities/notification.entity';
import { NotificationsService } from '../notifications/notifications.service';

import { FIREBASE_ADMIN } from '../firebase/provider/firebase.provider';

@Injectable()
export class PushNotificationService {
    private readonly logger = new Logger(PushNotificationService.name);

    constructor(
        @InjectRepository(Notification) private readonly notificationRepository: Repository<Notification>,
        @Inject(NotificationsService) private readonly notificationService: NotificationsService,
        @Inject(FIREBASE_ADMIN) private readonly firebase: typeof admin | null,
    ) {
        if (!this.firebase) {
            this.logger.warn('Firebase not initialized. Push notifications are disabled.');
        }
    }


    async sendToToken(notificationUUID: string) {
        if (!this.firebase) {
            this.logger.warn('Firebase not available. Skipping push notification.');

            return { id: 'firebase-disabled' };
        }

        try {

            const notification = await this.notificationRepository.findOne({
                where: {
                    uuid: notificationUUID,
                },
                relations: {
                    customer: true,
                }
            });


            if (!notification) {
                throw new BadRequestException(
                    "Notification not found"
                );
            }

            this.logger.log(`Pushing notification: ${JSON.stringify(notification)}`);

            const customer = notification.customer;

            this.logger.log(`Pushing notification for customer: ${customer} with token: ${JSON.stringify(customer.firebaseDeviceToken)}`);

            if (!customer) {
                throw new BadRequestException(
                    "Customer not found"
                );
            }

            const pushNotification: string[] = [];
            const deviceTokens = customer?.firebaseDeviceToken || [];

            if (deviceTokens?.length > 0) {
                for (let i = 0; i < deviceTokens.length; i++) {
                    try {
                        const message: admin.messaging.Message = {
                            token: customer.firebaseDeviceToken[i],
                            notification: {
                                title: notification.title,
                                body: notification.message
                            },
                            data: notification.payload || {},
                        };

                        const res = await this.firebase.messaging().send(message);
                        pushNotification.push(res);

                        this.logger.log(`Sent push to ${customer.firebaseDeviceToken.slice(0, 10)}... ✅ (${res})`);
                    } catch (error: any) {
                        this.logger.error(`Error sending push to ${customer.firebaseDeviceToken.slice(0, 10)}`);
                        throw error;
                    }
                }
            }
            return { ids: pushNotification };
        } catch (err: any) {
            this.logger.error(`FCM error: ${err?.message || err}`);
            throw err;
        }
    }

}

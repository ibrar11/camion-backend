/* eslint-disable @typescript-eslint/no-unsafe-member-access */
import * as admin from 'firebase-admin';

import {
    BadRequestException,
    Inject,
    Injectable,
    Logger,
    NotFoundException
} from '@nestjs/common';

import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';

import { NotificationPriority } from './enums/notification-priority.enum';

import { CreateCustomizePushNotificationDto } from './dtos/create-customize-push-notification.dto';
import { UpdateCustomizePushNotificationDto } from './dtos/update-customize-push-noification.dto';
import { SendPushNotificationDto } from './dtos/send-push-notification.dto';

import { Notification } from '../notifications/entities/notification.entity';
import { PushNotification } from './entities/push-notification';

import { FIREBASE_ADMIN } from '../firebase/provider/firebase.provider';

import { Customer } from '../customers/entities/customer.entity';

@Injectable()
export class PushNotificationService {
    private readonly logger = new Logger(PushNotificationService.name);

    constructor(
        @InjectRepository(Notification) private readonly notificationRepository: Repository<Notification>,
        @InjectRepository(PushNotification) private readonly pushNotificationRepository: Repository<PushNotification>,
        @InjectRepository(Customer) private readonly customerRepository: Repository<Customer>,
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

            this.logger.log(`Pushing notification for customer: ${customer}`);

            if (!customer) {
                throw new BadRequestException(
                    "Customer not found"
                );
            }

            const pushNotification: string[] = [];
            const deviceTokens = [...(customer.firebaseDeviceToken || [])];

            for (const token of deviceTokens) {
                this.logger.log(`Pushing notification for customer: ${customer} with token: ${token.slice(0, 10)}`);
                try {
                    const message: admin.messaging.Message = {
                        token,
                        notification: {
                            title: notification.title,
                            body: notification.message,
                        },
                        data: notification.payload || {},
                    };

                    const res = await this.firebase.messaging().send(message);
                    pushNotification.push(res);

                    this.logger.log(`Sent push to ${token.slice(0, 10)}... ✅ (${res})`);
                } catch (error: any) {
                    this.logger.error({
                        message: error?.message,
                        code: error?.code,
                        errorInfo: error?.errorInfo,
                    });
                    this.logger.error(`Error sending push to ${token.slice(0, 10)}`);

                    const code = error?.errorInfo?.code || error?.code;

                    if (
                        code === 'messaging/registration-token-not-registered' ||
                        code === 'messaging/invalid-registration-token'
                    ) {
                        customer.firebaseDeviceToken =
                            customer.firebaseDeviceToken.filter(t => t !== token);

                        await this.customerRepository.save(customer);
                    }
                }
            }
            return { ids: pushNotification };
        } catch (err: any) {
            this.logger.error(`FCM error: ${err?.message || err}`);
        }
    }

    async push(body: SendPushNotificationDto): Promise<void> {
        if (!this.firebase) {
            throw new BadRequestException({
                error: 'Firebase not available. Skipping push notification.'
            })
        }

        try {

            const notifications = await this.pushNotificationRepository.find({
                where: {
                    uuid: In(body?.notificationUUID),
                },
                relations: {
                    images: true,
                }
            });


            if (!notifications.length) {
                throw new BadRequestException(
                    "Notification not found"
                );
            }

            const customers = await this.customerRepository.find();

            if (!customers.length) {
                throw new BadRequestException(
                    "Customers not found"
                );
            }

            for (const notification of notifications) {
                this.logger.log(`Pushing notification: ${JSON.stringify(notification)}`);

                // for (const customer of customers) {

                //     this.logger.log(`Pushing notification for customer: ${customer}`);

                //     if (!customer) {
                //         throw new BadRequestException(
                //             "Customer not found"
                //         );
                //     }

                //     const pushNotification: string[] = [];
                //     const deviceTokens = [...(customer.firebaseDeviceToken || [])];

                //     for (const token of deviceTokens) {
                //         this.logger.log(`Pushing notification for customer: ${customer} with token: ${token.slice(0, 10)}`);
                //         try {
                //             const message: admin.messaging.Message = {
                //                 token,
                //                 notification: {
                //                     title: notification.title,
                //                     body: notification.message,
                //                 },
                //             };

                //             const res = await this.firebase.messaging().send(message);
                //             pushNotification.push(res);

                //             this.logger.log(`Sent push to ${token.slice(0, 10)}... ✅ (${res})`);
                //         } catch (error: any) {
                //             this.logger.error({
                //                 message: error?.message,
                //                 code: error?.code,
                //                 errorInfo: error?.errorInfo,
                //             });
                //             this.logger.error(`Error sending push to ${token.slice(0, 10)}`);

                //             const code = error?.errorInfo?.code || error?.code;

                //             if (
                //                 code === 'messaging/registration-token-not-registered' ||
                //                 code === 'messaging/invalid-registration-token'
                //             ) {
                //                 customer.firebaseDeviceToken =
                //                     customer.firebaseDeviceToken.filter(t => t !== token);

                //                 await this.customerRepository.save(customer);
                //             }
                //         }
                //     }
                // }
            }

        } catch (err: any) {
            this.logger.error(`FCM error: ${err?.message || err}`);
        }
    }

    /**
     * Creates a customize push notification
     *
     * @param body
     * @returns
     */
    async create(body: CreateCustomizePushNotificationDto): Promise<PushNotification> {

        const customizeNotification = new PushNotification();
        customizeNotification.uuid = crypto.randomUUID();
        customizeNotification.title = body.title.trim();
        customizeNotification.brief = body.brief.trim();
        customizeNotification.message = body.message.trim();
        customizeNotification.priority = body.priority ?? NotificationPriority.MEDIUM;

        const saved = await this.pushNotificationRepository.save(customizeNotification);

        return saved;
    }

    /**
     * Get customize push notifications
     *
     * @returns
     */
    async getAll(): Promise<Array<PushNotification>> {
        const customizeNotifications = await this.pushNotificationRepository.find({
            order: { createdAt: "DESC" },
        });

        return customizeNotifications;
    }

    /**
     * Finds a customize push notification
     *
     * @param uuid
     * @returns
     */
    async findOne(uuid: string): Promise<PushNotification> {
        this.logger.log(`Retrieving customize push notification: ${uuid}`);

        // Find the customize push notification
        const customizeNotification = await this.pushNotificationRepository.findOne({
            where: {
                uuid: uuid,
            },
            relations: {
                images: true,
            },
        });

        if (customizeNotification === null) {
            throw new NotFoundException({
                error: "Failed to find the customize push notification. Please check and try again.",
            });
        }
        return customizeNotification;
    }

    /**
     * Updates a customize push notification
     *
     * @param uuid
     * @param body
     * @returns
     */
    async updatePushNotification(uuid: string, body: UpdateCustomizePushNotificationDto): Promise<PushNotification> {
        this.logger.log(`Updating customize push notification: ${uuid}`);

        // Find the customize push notification
        const customizeNotification = await this.pushNotificationRepository.findOneBy({ uuid: uuid, });
        if (customizeNotification === null) {
            throw new NotFoundException({
                error: "Failed to find the customize push notification. Please check and try again.",
            });
        }

        // Update the customize push notification
        customizeNotification.title = body.title.trim();
        customizeNotification.brief = body.brief.trim();
        customizeNotification.message = body.message.trim();
        customizeNotification.priority = body.priority ?? NotificationPriority.MEDIUM;
        return this.pushNotificationRepository.save(customizeNotification);
    }

    /**
     * Deletes a customize push notification
     *
     * @param uuid
     */
    async delete(uuid: string): Promise<void> {
        await this.pushNotificationRepository.delete({
            uuid: uuid,
        });
    }

}

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

import { ConfigService } from '@nestjs/config';
import { NotificationReceiver } from './enums/notification-receiver.enum';
import { NotificationScheduler } from './enums/notification-scheduler.enum';

@Injectable()
export class PushNotificationService {
    private readonly logger = new Logger(PushNotificationService.name);

    constructor(
        @InjectRepository(Notification) private readonly notificationRepository: Repository<Notification>,
        @InjectRepository(PushNotification) private readonly pushNotificationRepository: Repository<PushNotification>,
        @InjectRepository(Customer) private readonly customerRepository: Repository<Customer>,
        @Inject(FIREBASE_ADMIN) private readonly firebase: typeof admin | null,
        private readonly configService: ConfigService,
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

            let customers: Customer[] | [] = [];

            if (body.receiverType === NotificationReceiver.ALLCUSTOMER) {
                customers = await this.customerRepository.find();
            } else {
                customers = await this.customerRepository.find({
                    where: {
                        role: body.receiverType
                    }
                });
            }

            if (!customers.length) {
                throw new BadRequestException(
                    "Customers not found"
                );
            }

            // Build a map of token → customer for efficient invalid-token cleanup
            const tokenToCustomer = new Map<string, Customer>();
            for (const customer of customers) {
                for (const token of customer.firebaseDeviceToken ?? []) {
                    tokenToCustomer.set(token, customer);
                }
            }

            const allTokens = [...tokenToCustomer.keys()];

            if (!allTokens.length) {
                this.logger.warn('No device tokens found across all customers. Skipping.');
                return;
            }

            for (const notification of notifications) {
                this.logger.log(`Pushing announcement notification: ${notification.uuid}`);

                let imageUrl =
                    notification.imageUrl ||
                    notification.images?.[0]?.imageUrl ||
                    undefined;
                if (imageUrl) {
                    const segments = imageUrl.split("/");
                    if (imageUrl.startsWith("https://")) {
                        imageUrl = `${this.configService.get<string>('ASSETS_HOST')}/${segments[3]}/${segments[4]}`;
                    } else if (imageUrl.startsWith("s3://")) {
                        imageUrl = `${this.configService.get<string>('ASSETS_HOST')}/${segments[2]}/${segments[3]}`;
                    }
                }

                const BATCH_SIZE = 500;
                for (let i = 0; i < allTokens.length; i += BATCH_SIZE) {
                    const batch = allTokens.slice(i, i + BATCH_SIZE);

                    const multicastMessage: admin.messaging.MulticastMessage = {
                        tokens: batch,
                        notification: {
                            title: notification.title,
                            body: notification.message,
                            ...(imageUrl && { imageUrl }),
                        },
                        android: {
                            notification: {
                                imageUrl,
                            },
                        },
                        apns: {
                            payload: {
                                aps: {
                                    "mutable-content": 1,
                                },
                            },
                            fcmOptions: {
                                imageUrl,
                            },
                        },
                    };

                    const response = await this.firebase.messaging().sendEachForMulticast(multicastMessage);

                    this.logger.log(
                        `Batch ${Math.floor(i / BATCH_SIZE) + 1}: ` +
                        `${response.successCount} sent, ${response.failureCount} failed`
                    );

                    // Clean up invalid tokens
                    const staleCustomers = new Map<number, Customer>();
                    response.responses.forEach((res, idx) => {
                        if (!res.success) {
                            const error = res.error as any;
                            const code = error?.errorInfo?.code || error?.code;
                            const message = error?.message || 'Unknown FCM error';

                            this.logger.error(`FCM token failed. code=${code}, message=${message}`);
                            if (
                                code === 'messaging/registration-token-not-registered' ||
                                code === 'messaging/invalid-registration-token' ||
                                message.toLowerCase().includes('apns device token is disabled')
                            ) {
                                const token = batch[idx];
                                const customer = tokenToCustomer.get(token);
                                if (customer) {
                                    customer.firebaseDeviceToken =
                                        customer.firebaseDeviceToken.filter(t => t !== token);
                                    staleCustomers.set(customer.id, customer);
                                }
                            } else {
                                this.logger.error(`Token send failed: ${res.error?.message}`);
                            }
                        }
                    });

                    if (staleCustomers.size) {
                        await this.customerRepository.save([...staleCustomers.values()]);
                        this.logger.log(`Cleaned up stale tokens for ${staleCustomers.size} customer(s)`);
                    }
                }
            }

        } catch (err: any) {
            this.logger.error(`FCM error: ${err?.message || err}`, err?.stack);
            throw err;
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
        this.applySchedule(customizeNotification, body);
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
        this.applySchedule(customizeNotification, body);
        customizeNotification.priority = body.priority ?? NotificationPriority.MEDIUM;
        return this.pushNotificationRepository.save(customizeNotification);
    }

    async stopPushNotificationSchedule(uuid: string): Promise<void> {
        this.logger.log(`Updating customize push notification: ${uuid}`);

        // Find the customize push notification
        const customizeNotification = await this.pushNotificationRepository.findOneBy({ uuid: uuid, });
        if (customizeNotification === null) {
            throw new NotFoundException({
                error: "Failed to find the customize push notification. Please check and try again.",
            });
        }

        // Update the customize push notification
        customizeNotification.scheduledFor = null;
        customizeNotification.repeatInterval = null;

        await this.pushNotificationRepository.save(customizeNotification);
        return;
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

    /**
     * Applies scheduling fields to a push notification. `scheduledAt` (an
     * absolute datetime) and `scheduledFor` (a recurring interval) are
     * mutually exclusive: providing `scheduledAt` schedules a one-time send
     * with no repeatInterval, so the scheduler marks it SENT after firing
     * instead of rescheduling it.
     */
    private applySchedule(
        notification: PushNotification,
        body: CreateCustomizePushNotificationDto | UpdateCustomizePushNotificationDto,
    ): void {
        if (body.scheduledAt && body.scheduledFor) {
            throw new BadRequestException({
                scheduledAt: "Please provide either a one-time scheduled time or a recurring interval, not both.",
            });
        }

        if (body.scheduledAt) {
            if (new Date().getTime() >= new Date(body.scheduledAt).getTime()) {
                throw new BadRequestException({
                    scheduledAt: "Please make sure the scheduled time is in the future.",
                });
            }

            notification.scheduledFor = new Date(body.scheduledAt);
            notification.repeatInterval = null;
        } else if (body.scheduledFor) {
            notification.scheduledFor = this.calculateNextRun(body.scheduledFor);
            notification.repeatInterval = body.scheduledFor;
        }
    }

    private calculateNextRun(
        interval: NotificationScheduler,
        from: Date = new Date(),
    ): Date {
        const intervalMs: Record<NotificationScheduler, number> = {
            [NotificationScheduler.EVERY_30_MIN]: 30 * 60 * 1000,
            [NotificationScheduler.EVERY_3]: 3 * 60 * 60 * 1000,
            [NotificationScheduler.EVERY_6]: 6 * 60 * 60 * 1000,
            [NotificationScheduler.EVERY_12]: 12 * 60 * 60 * 1000,
            [NotificationScheduler.EVERY_24]: 24 * 60 * 60 * 1000,
        };

        return new Date(from.getTime() + intervalMs[interval]);
    }

}

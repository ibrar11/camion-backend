import { Injectable, NotFoundException } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import crypto from "crypto";

import { Notification } from "./entities/notification.entity";
import { NotificationPriority } from "./enums/notification-priority.enum";
import { CreateNotificationDto } from "./dtos/create-notification.dto";
import { CustomersService } from "src/customers/customers.service";

@Injectable()
export class NotificationsService {
	constructor(
		@InjectRepository(Notification)
		private readonly notificationRepository: Repository<Notification>,
		private readonly customersService: CustomersService,
	) {}

	/**
	 * Creates a notification for a customer
	 *
	 * @param body
	 * @returns
	 */
	async create(body: CreateNotificationDto): Promise<Notification> {
		const customer = await this.customersService.findOne(body.customerUUID);

		if (!customer) {
			throw new NotFoundException({
				error: "Customer not found",
			});
		}

		const notification = new Notification();
		notification.uuid = crypto.randomUUID();
		notification.customer = customer;
		notification.type = body.type;
		notification.title = body.title.trim();
		notification.brief = body.brief.trim();
		notification.message = body.message.trim();
		notification.payload = body.payload || {};
		notification.priority = body.priority ?? NotificationPriority.MEDIUM;

		return this.notificationRepository.save(notification);
	}

	/**
	 * Get notifications for a customer
	 *
	 * @param customerUUID
	 * @returns
	 */
	async getByCustomer(customerUUID: string): Promise<Notification[]> {
		return this.notificationRepository.find({
			where: {
				customer: { uuid: customerUUID },
			},
			order: { createdAt: "DESC" },
		});
	}

	/**
	 * Mark notification as read
	 *
	 * @param uuid
	 * @returns
	 */
	async markAsRead(uuid: string): Promise<Notification> {
		const notification = await this.notificationRepository.findOne({
			where: { uuid: uuid },
		});

		if (!notification) {
			throw new NotFoundException({
				error: "Notification not found",
			});
		}

		notification.isRead = true;

		return this.notificationRepository.save(notification);
	}

}

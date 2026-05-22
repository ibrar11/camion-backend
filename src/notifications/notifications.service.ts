import { Injectable, NotFoundException } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import crypto from "crypto";

import { Notification } from "./entities/notification.entity";
import { NotificationPriority } from "./enums/notification-priority.enum";
import { CreateNotificationDto } from "./dtos/create-notification.dto";
import { CustomersService } from "src/customers/customers.service";
import { Customer } from "src/customers/entities/customer.entity";

@Injectable()
export class NotificationsService {
	constructor(
		@InjectRepository(Notification)
		private readonly notificationRepository: Repository<Notification>,
		@InjectRepository(Customer)
		private readonly customerRepository: Repository<Customer>,
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

		const saved = await this.notificationRepository.save(notification);

		await this.customerRepository.increment(
			{ uuid: body.customerUUID },
			'unreadNotificationCount',
			1,
		);

		return saved;
	}

	/**
	 * Get notifications for a customer
	 *
	 * @param customerUUID
	 * @returns
	 */
	async getByCustomer(customerUUID: string): Promise<Notification[]> {
		const notifications = await this.notificationRepository.find({
			where: {
				customer: { uuid: customerUUID },
			},
			order: { createdAt: "DESC" },
		});

		await this.customerRepository.update(
			{ uuid: customerUUID },
			{ unreadNotificationCount: 0 },
		);

		return notifications;
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

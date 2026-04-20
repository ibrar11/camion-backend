import {
	Body,
	Controller,
	Get,
	Param,
	Post,
	Patch,
	Req,
	UseGuards,
} from "@nestjs/common";

import { Request } from "express";
import { NotificationsService } from "./notifications.service";
import { CreateNotificationDto } from "./dtos/create-notification.dto";
import { AuthGuard } from "../auth/auth.guard";
import { RolesGuard } from "../auth/roles.guard";
import { Roles } from "../auth/roles.decorator";
import { UserRole } from "../users/enums/UserRole";
import { CustomerRole } from "src/customers/enums/CustomerRole";

@Controller("v1/notifications")
export class NotificationsController {
	constructor(private readonly notificationsService: NotificationsService) { }

	/**
	 * Create notification (admin/system use)
	 */
	@Post()
	@Roles(UserRole.SuperAdmin, UserRole.Admin)
	@UseGuards(AuthGuard, RolesGuard)
	async create(@Body() body: CreateNotificationDto) {
		return this.notificationsService.create(body);
	}

	/**
	 * Get notifications for the logged-in customer
	 */
	@Get()
	@Roles(CustomerRole.Customer, CustomerRole.Influencer, CustomerRole.Affiliate)
	@UseGuards(AuthGuard)
	async getMyNotifications(@Req() req: Request & { customer: { uuid: string } }) {
		return this.notificationsService.getByCustomer(req.customer.uuid);
	}

	/**
	 * Mark as read (customer)
	 */
	@Patch(":uuid/read")
	@Roles(CustomerRole.Customer, CustomerRole.Influencer, CustomerRole.Affiliate)
	@UseGuards(AuthGuard)
	async markAsRead(@Param("uuid") uuid: string) {
		return this.notificationsService.markAsRead(uuid);
	}
}

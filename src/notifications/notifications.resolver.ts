import { Resolver, Query, Context } from "@nestjs/graphql";
import { ForbiddenException, UseGuards } from "@nestjs/common";
import { NotificationsService } from "./notifications.service";
import { Notification } from "./entities/notification.entity";
import { GqlAuthGuard } from "../auth/gql.guard";

@Resolver(() => Notification)
export class NotificationsResolver {
	constructor(private readonly notificationsService: NotificationsService) {}

	/**
	 * Get notifications for the logged-in customer
	 */
	@Query(() => [Notification])
	@UseGuards(GqlAuthGuard)
	getNotifications(@Context() context): Promise<Notification[]> {
		if (!context.req?.customer?.uuid) {
			throw new ForbiddenException({
				error: "You're not allowed to retrieve notifications. Please check and try again.",
			});
		}
		return this.notificationsService.getByCustomer(context.req.customer.uuid);
	}
}

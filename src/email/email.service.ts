import { Injectable, Logger } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import * as sgMail from "@sendgrid/mail";

// ─── Per-template data shapes ────────────────────────────────────────────────
// Each interface maps 1-to-1 with the {{variable}} placeholders defined in the
// corresponding SendGrid dynamic template.

interface OtpTemplateData {
	otp: string;
}

interface OrderConfirmedTemplateData {
	customerName: string;
	orderId: string;
	orderTotal: string;
}

interface OrderShippedTemplateData {
	customerName: string;
	orderId: string;
	trackingNumber?: string;
}

interface OrderProcessingTemplateData {
	customerName: string;
	orderId: string;
}

interface OrderDeliveredTemplateData {
	customerName: string;
	orderId: string;
}

interface OrderCancelledTemplateData {
	customerName: string;
	orderId: string;
	reason?: string;
}

// ─────────────────────────────────────────────────────────────────────────────

@Injectable()
export class EmailService {
	private readonly logger = new Logger(EmailService.name);
	private readonly emailEnabled: boolean;
	private readonly from: string;

	// SendGrid dynamic template IDs — set these in your .env
	private readonly templateIds: Record<string, string>;

	constructor(private readonly configService: ConfigService) {
		this.emailEnabled =
			this.configService.get<string>("EMAIL_ENABLED") === "true";

		this.from = this.configService.get<string>("EMAIL_FROM") as string;

		this.templateIds = {
			otp: this.configService.get<string>("SENDGRID_TEMPLATE_OTP") as string,
			orderConfirmed: this.configService.get<string>(
				"SENDGRID_TEMPLATE_ORDER_CONFIRMED",
			) as string,
			orderShipped: this.configService.get<string>(
				"SENDGRID_TEMPLATE_ORDER_SHIPPED",
			) as string,
			orderProcessing: this.configService.get<string>(
				"SENDGRID_TEMPLATE_ORDER_PROCESSING",
			) as string,
			orderDelivered: this.configService.get<string>(
				"SENDGRID_TEMPLATE_ORDER_DELIVERED",
			) as string,
			orderCancelled: this.configService.get<string>(
				"SENDGRID_TEMPLATE_ORDER_CANCELLED",
			) as string,
		};

		if (this.emailEnabled) {
			sgMail.setApiKey(
				this.configService.get<string>("SENDGRID_API_KEY") as string,
			);
		}
	}

	async sendOtpEmail(to: string, data: OtpTemplateData): Promise<void> {
		await this.send(to, this.templateIds.otp, data);
	}

	async sendOrderConfirmedEmail(
		to: string,
		data: OrderConfirmedTemplateData,
	): Promise<void> {
		await this.send(to, this.templateIds.orderConfirmed, data);
	}

	async sendOrderShippedEmail(
		to: string,
		data: OrderShippedTemplateData,
	): Promise<void> {
		await this.send(to, this.templateIds.orderShipped, data);
	}

	async sendOrderProcessingEmail(
		to: string,
		data: OrderProcessingTemplateData,
	): Promise<void> {
		await this.send(to, this.templateIds.orderProcessing, data);
	}

	async sendOrderDeliveredEmail(
		to: string,
		data: OrderDeliveredTemplateData,
	): Promise<void> {
		await this.send(to, this.templateIds.orderDelivered, data);
	}

	async sendOrderCancelledEmail(
		to: string,
		data: OrderCancelledTemplateData,
	): Promise<void> {
		await this.send(to, this.templateIds.orderCancelled, data);
	}

	// ─── Private core ──────────────────────────────────────────────────────────

	private async send(
		to: string,
		templateId: string,
		dynamicData: Record<string, any>,
	): Promise<void> {
		if (!this.emailEnabled) {
			this.logger.debug(
				`[EMAIL DISABLED] To: ${to}, Template: ${templateId}`,
			);
			return;
		}

		if (!templateId) {
			this.logger.warn(
				`Skipping email to ${to} — template ID is not configured`,
			);
			return;
		}

		try {
			await sgMail.send({
				to,
				from: this.from,
				templateId,
				dynamicTemplateData: dynamicData,
			});
			this.logger.log(`Email sent to ${to} using template ${templateId}`);
		} catch (err) {
			this.logger.error(`Failed to send email to ${to}: ${(err as Error).message}`);
			throw err;
		}
	}
}

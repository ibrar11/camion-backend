import { Injectable, Logger, UnprocessableEntityException } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import sgMail from "@sendgrid/mail";

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

// Sent when the payment gateway confirms a successful charge — order is at
// PAYMENT_SUCCESSFUL, not yet admin-CONFIRMED, so this is deliberately a
// separate template/method from sendOrderConfirmedEmail (see order.service.ts).
interface PaymentSuccessItem {
	name: string;
	quantity: number;
	unitPrice: string;
	lineTotal: string;
}

interface PaymentSuccessDeliveryDetails {
	fullName: string;
	streetAddress: string;
	apartment?: string;
	city: string;
	state: string;
	country: string;
	zipCode: string;
	phoneNumber: string;
}

interface PaymentSuccessTemplateData {
	customerName: string;
	orderId: string;
	orderTotal: string;
	paymentConfirmation: string;
	items: PaymentSuccessItem[];
	deliveryDetails: PaymentSuccessDeliveryDetails;
	nextSteps: string;
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

// Sent when the payment gateway confirms a declined/rejected charge. Retry
// happens via POST /v1/orders/:uuid/retry-payment, not a link in this email.
interface PaymentFailedTemplateData {
	customerName: string;
	orderId: string;
	failureReason: string;
}

interface AdminNewOrderData {
	orderId: string;
	customerName: string;
	customerEmail: string;
	orderTotal: string;
}

// ─────────────────────────────────────────────────────────────────────────────

const ADMIN_NOTIFICATION_EMAILS = [
	'abh772233@gmail.com',
	'info@camiontrading.com',
	'support@camiontrading.com',
];

@Injectable()
export class EmailService {
	private readonly logger = new Logger(EmailService.name);
	private readonly emailEnabled: boolean;
	private readonly isLocal: boolean;
	private readonly isProduction: boolean;
	private readonly from: string;

	// SendGrid dynamic template IDs — set these in your .env
	private readonly templateIds: Record<string, string>;

	constructor(private readonly configService: ConfigService) {
		this.emailEnabled =
			this.configService.get<string>("EMAIL_ENABLED") === "true";

		this.isLocal = this.configService.get<string>("NODE_ENV") === "local";
		this.isProduction = this.configService.get<string>("NODE_ENV") === "prod";
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
			adminNewOrder: this.configService.get<string>(
				"SENDGRID_TEMPLATE_ADMIN_NEW_ORDER",
			) as string,
			// TODO: move to SENDGRID_TEMPLATE_PAYMENT_FAILED env var once it's provisioned in deployment config
			paymentFailed: "d-3a2f9e56d7614d82b778d14049ba9ea0",
			// TODO: move to SENDGRID_TEMPLATE_PAYMENT_SUCCESS env var once it's provisioned in deployment config
			paymentSuccess: "d-5e8807f9a145460c940574c82e73d009",
		};

		if (this.emailEnabled) {
			sgMail.setApiKey(
				this.configService.get<string>("SENDGRID_API_KEY") as string,
			);
			this.logger.log(`SendGrid initialised — from: ${this.from}, OTP template: ${this.templateIds.otp || '(not set)'}`);
		} else {
			this.logger.warn(`Email is disabled (EMAIL_ENABLED != "true")`);
		}
	}

	async sendOtpEmail(to: string, data: OtpTemplateData): Promise<void> {
		if (this.isLocal) {
			this.logger.debug(`[LOCAL] Skipping OTP email to ${to}`);
			return;
		}
		this.logger.log(`Sending OTP email to ${to}`);
		await this.send(to, this.templateIds.otp, data);
	}

	async sendOrderConfirmedEmail(
		to: string,
		data: OrderConfirmedTemplateData,
	): Promise<void> {
		await this.send(to, this.templateIds.orderConfirmed, data);
	}

	async sendPaymentSuccessEmail(
		to: string,
		data: PaymentSuccessTemplateData,
	): Promise<void> {
		await this.send(to, this.templateIds.paymentSuccess, data);
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

	async sendPaymentFailedEmail(
		to: string,
		data: PaymentFailedTemplateData,
	): Promise<void> {
		await this.send(to, this.templateIds.paymentFailed, data);
	}

	async sendAdminNewOrderEmail(data: AdminNewOrderData): Promise<void> {
		if (!this.isProduction) {
			this.logger.debug(`[NON-PROD] Skipping admin new-order email`);
			return;
		}
		await Promise.all(
			ADMIN_NOTIFICATION_EMAILS.map(to =>
				this.send(to, this.templateIds.adminNewOrder, data),
			),
		);
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
			throw new UnprocessableEntityException({ error: 'Failed to send email. Please try again.' });
		}
	}
}

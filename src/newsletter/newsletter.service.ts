import { Injectable, HttpException } from "@nestjs/common";
import crypto from "crypto";

@Injectable()
export class NewsletterService {
	private readonly apiKey = process.env.MAILCHIMP_API_KEY;
	private readonly audienceId = process.env.MAILCHIMP_AUDIENCE_ID;

	private get dataCenter(): string {
		if (!this.apiKey) {
			throw new Error("MAILCHIMP_API_KEY is not defined");
		}
		return this.apiKey.split("-")[1];
	}

    /**
     * Subscribes a user to the Mailchimp newsletter audience.
     *
     * @param email - The email address to subscribe
     * @returns Promise<void>
     *
     * @throws HttpException
     * - 400/4xx if Mailchimp rejects the email (e.g., invalid or fake email)
     * - 500 if an unexpected error occurs
     */
	async subscribe(email: string): Promise<void> {
		const normalizedEmail = email.trim().toLowerCase();

		const subscriberHash = crypto
			.createHash("md5")
			.update(normalizedEmail)
			.digest("hex");

		const url = `https://${this.dataCenter}.api.mailchimp.com/3.0/lists/${this.audienceId}/members/${subscriberHash}`;

		try {
			const response = await fetch(url, {
				method: "PUT",
				headers: {
					"Content-Type": "application/json",
					Authorization: `Basic ${Buffer.from(`anystring:${this.apiKey}`).toString("base64")}`,
				},
				body: JSON.stringify({
					email_address: normalizedEmail,
					status_if_new: "subscribed",
				}),
			});

			if (!response.ok) {
				const errorBody = await response.json().catch(() => null);

				throw new HttpException(
					{
						error: errorBody?.detail || "Failed to subscribe to newsletter",
					},
					response.status,
				);
			}
		} catch (error: unknown) {
			if (error instanceof HttpException) {
				throw error;
			}

			throw new HttpException(
				{
					error: "Failed to subscribe to newsletter",
				},
				500,
			);
		}
	}
}

import { Injectable, Logger, UnprocessableEntityException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Twilio from 'twilio';

@Injectable()
export class TwilioService {
    private readonly logger = new Logger(TwilioService.name);
    private readonly client: ReturnType<typeof Twilio> | null = null;
    private readonly messagingServiceSid: string;
    private readonly smsEnabled: boolean;
    private readonly isLocal: boolean;

    constructor(private readonly configService: ConfigService) {
        this.smsEnabled = this.configService.get<string>('TWILIO_SMS_ENABLED') === 'true';
        this.isLocal = this.configService.get<string>('NODE_ENV') === 'local';
        this.messagingServiceSid = this.configService.get<string>('TWILIO_MESSAGING_SERVICE_SID') ?? '';

        if (this.smsEnabled) {
            const accountSid = "AC15e0a0fb7e75075cc887a157f91286d3"
            const authToken = 'fff9f13762c1288a0f1f1b6b74d0df11'; // TODO: move back to env
            this.client = Twilio(accountSid, authToken);
            this.logger.log(`Twilio initialised — accountSid: ${accountSid}, messagingServiceSid: ${this.messagingServiceSid || '(not set)'}`);
        } else {
            this.logger.warn(`Twilio SMS is disabled (TWILIO_SMS_ENABLED != "true")`);
        }
    }

    /**
     * Send an OTP via Twilio Messaging Service.
     * Does nothing when TWILIO_SMS_ENABLED is not "true" or in local env.
     */
    async sendOtp(to: string, otp: string): Promise<void> {
        if (this.isLocal) {
            this.logger.debug(`[LOCAL] Skipping SMS to ${to}`);
            return;
        }

        if (!this.smsEnabled) {
            this.logger.debug(`SMS disabled — skipping OTP to ${to}`);
            return;
        }

        this.logger.log(`Sending OTP via Twilio to ${to}`);
        try {
            // Twilio option (kept commented for later switch back):
            // await this.client!.messages.create({
            //     to,
            //     messagingServiceSid: this.messagingServiceSid,
            //     body: `Your CAMION verification code is: ${otp}`,
            // });
            // this.logger.log(`OTP sent successfully to ${to}`);

            const response = await fetch('https://api.myalice.ai/stable/open/whatsapp/send-template-message', {
                method: 'POST',
                headers: {
                    'X-Myalice-Api-Key': 'a7fc891a333c11f1a75e6a83850c7ff0',
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    template_id: '1324887296463284',
                    channel_id: '26510',
                    customer_phone: to,
                    attributes: {
                        verification_code: otp,
                    },
                }),
            });
            const data = await response.json();
            if (!response.ok || data?.status !== 'finished' || data?.extra?.success !== true) {
                this.logger.error(`MyAlice send failed for ${to}: ${JSON.stringify(data)}`);
                throw new UnprocessableEntityException({ error: 'Failed to send OTP. Please try again.' });
            }
            this.logger.log(`OTP sent successfully via MyAlice to ${to}`);
        } catch (err) {
            this.logger.error(`Failed to send OTP to ${to}: ${(err as Error).message}`, (err as Error).stack);
            throw new UnprocessableEntityException({ error: 'Failed to send OTP. Please try again.' });
        }
    }
}

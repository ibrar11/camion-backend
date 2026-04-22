import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Twilio from 'twilio';

@Injectable()
export class TwilioService {
    private readonly logger = new Logger(TwilioService.name);
    private readonly client: ReturnType<typeof Twilio> | null = null;
    private readonly verifyServiceSid: string;
    private readonly smsEnabled: boolean;
    private readonly devMagicCode: string | null;

    constructor(private readonly configService: ConfigService) {
        this.smsEnabled = this.configService.get<string>('TWILIO_SMS_ENABLED') === 'true';
        const isDev = this.configService.get<string>('NODE_ENV') === 'local';
        this.devMagicCode = isDev
            ? (this.configService.get<string>('DEV_OTP_CODE') ?? '123456')
            : null;
        this.verifyServiceSid = this.configService.get<string>('TWILIO_VERIFY_SERVICE_SID') ?? '';

        if (this.smsEnabled) {
            const accountSid = this.configService.get<string>('TWILIO_ACCOUNT_SID');
            const authToken = this.configService.get<string>('TWILIO_AUTH_TOKEN');
            this.client = Twilio(accountSid, authToken);
        }
    }

    /**
     * Send a verification code via Twilio Verify (Branded Sender ID).
     * Does nothing when TWILIO_SMS_ENABLED is not "true".
     */
    async sendVerification(to: string): Promise<void> {
        if (this.devMagicCode) {
            this.logger.debug(`[DEV] Magic OTP for ${to}: ${this.devMagicCode}`);
            return;
        }

        if (!this.smsEnabled) {
            this.logger.debug(`SMS disabled — skipping verification to ${to}`);
            return;
        }

        try {
            await this.client!.verify.v2
                .services(this.verifyServiceSid)
                .verifications.create({ to, channel: 'sms' });
            this.logger.log(`Verification sent to ${to}`);
        } catch (err) {
            this.logger.error(`Failed to send verification to ${to}: ${(err as Error).message}`);
            throw err;
        }
    }

    /**
     * Check a verification code via Twilio Verify.
     * In dev mode (SMS disabled), falls back to MAGIC_OTP comparison.
     */
    async checkVerification(to: string, code: string): Promise<boolean> {
        if (this.devMagicCode) {
            return code === this.devMagicCode;
        }

        if (!this.smsEnabled) {
            return true;
        }

        try {
            const check = await this.client!.verify.v2
                .services(this.verifyServiceSid)
                .verificationChecks.create({ to, code });
            return check.status === 'approved';
        } catch (err) {
            this.logger.error(`Failed to check verification for ${to}: ${(err as Error).message}`);
            return false;
        }
    }
}

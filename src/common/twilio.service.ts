import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Twilio from 'twilio';

@Injectable()
export class TwilioService {
    private readonly logger = new Logger(TwilioService.name);
    private readonly client: ReturnType<typeof Twilio> | null = null;
    private readonly verifyServiceSid: string;
    private readonly smsEnabled: boolean;
    private readonly isLocal: boolean;
    private readonly devMagicCode: string | null;

    constructor(private readonly configService: ConfigService) {
        this.smsEnabled = this.configService.get<string>('TWILIO_SMS_ENABLED') === 'true';
        this.isLocal = this.configService.get<string>('NODE_ENV') === 'local';
        const magicOtpEnabled = this.configService.get<string>('ENABLE_MAGIC_OTP') === 'Yes';
        this.devMagicCode = magicOtpEnabled
            ? (this.configService.get<string>('MAGIC_OTP') ?? '123456')
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
        if (this.isLocal) {
            this.logger.debug(`[LOCAL] Skipping SMS to ${to}, magic OTP: ${this.devMagicCode}`);
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

    async checkVerification(to: string, code: string): Promise<boolean> {
        if (this.devMagicCode && code === this.devMagicCode) {
            return true;
        }

        if (!this.smsEnabled) {
            return false;
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

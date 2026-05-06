import crypto from 'node:crypto';

import { Injectable, InternalServerErrorException, Logger } from '@nestjs/common';

@Injectable()
export class JopWmsClient {
    private readonly logger = new Logger(JopWmsClient.name);

    private get baseUrl() { return process.env.JOP_WMS_BASE_URL ?? ''; }
    private get apiKey() { return process.env.JOP_WMS_API_KEY ?? ''; }
    private get apiSecret() { return process.env.JOP_WMS_API_SECRET ?? ''; }
    private get providerApiKey() { return process.env.JOP_WMS_PROVIDER_API_KEY ?? ''; }
    private get userToken() { return process.env.JOP_WMS_USER_TOKEN ?? ''; }

    // Format: yyyy-MM-dd HH:mm:ss (required by WMS signature spec)
    private formatTimestamp(date: Date): string {
        const pad = (n: number) => String(n).padStart(2, '0');
        return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())} ` +
            `${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`;
    }

    // Signature: MD5(requestBody + apiKey + apiSecret + timestamp)
    private buildSignature(bodyJson: string, timestamp: string): string {
        return crypto
            .createHash('md5')
            .update(bodyJson + this.apiKey + this.apiSecret + timestamp)
            .digest('hex');
    }

    async post<T>(endpoint: string, payload: Record<string, unknown>): Promise<T> {
        const timestamp = this.formatTimestamp(new Date());
        const bodyJson = JSON.stringify(payload);
        const signature = this.buildSignature(bodyJson, timestamp);

        this.logger.log(`JOP WMS → ${endpoint}`);

        const response = await fetch(`${this.baseUrl}/${endpoint}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json;charset=UTF-8',
                apiKey: this.apiKey,
                providerApiKey: this.providerApiKey,
                userToken: this.userToken,
                signature,
                timestamp,
                version: '1.0',
            },
            body: bodyJson,
        });

        const json: any = await response.json();

        // WMS returns code=0 for success regardless of HTTP status
        if (json?.code !== 0) {
            const msg = json?.msg ?? json?.message ?? 'Unknown WMS error';
            this.logger.error(`JOP WMS ${endpoint} error code ${json?.code}: ${msg}`);
            throw new InternalServerErrorException(msg);
        }

        return json as T;
    }
}

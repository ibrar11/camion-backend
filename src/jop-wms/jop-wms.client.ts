import crypto from 'node:crypto';

import { Injectable, Logger } from '@nestjs/common';

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

        this.logger.log(`JOP WMS: starting request to ${endpoint}`);

        let response: Response;
        try {
            response = await fetch(`${this.baseUrl}/${endpoint}`, {
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
        } catch (err: any) {
            throw new Error(`JOP WMS network error (${endpoint}): ${err?.message}`);
        }

        let json: any;
        try {
            json = await response.json();
        } catch {
            throw new Error(`JOP WMS returned non-JSON response (${endpoint}): HTTP ${response.status}`);
        }

        // WMS returns code=0 for success. Non-zero with message="success" means the order
        // was created but internal processing (e.g. waybill assignment) failed on their side —
        // treat as success so we track and poll the order.
        if (json?.code !== 0) {
            if (json?.message === 'success') {
                this.logger.warn(`JOP WMS ${endpoint} — non-zero code ${json?.code} but message is "success", treating as created`);
                return json as T;
            }
            const msg = json?.msg || json?.message || 'Unknown WMS error';
            this.logger.error(`JOP WMS ${endpoint} failed — code ${json?.code}: ${msg} | full: ${JSON.stringify(json)}`);
            throw new Error(msg);
        }

        this.logger.log(`JOP WMS ${endpoint} succeeded`);
        return json as T;
    }
}

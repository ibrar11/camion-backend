import crypto from "node:crypto";

import { SkipcashWebhookDto } from "src/payments/dtos/SkipcashWebhookDto";

import { SignaturePayload, SkipCashWebhookPayload } from "src/payments/types";

/**
 * Create signature for skipcash authorization
 *
 * @param payload
 * @returns
 */
export function generateSignature(payload: SignaturePayload): string {
    const orderedFields = [
        'Uid', 'KeyId', 'Amount', 'FirstName', 'LastName',
        'Phone', 'Email', 'Street', 'City', 'State',
        'Country', 'PostalCode', 'TransactionId', 'Custom1'
    ];

    const baseString = orderedFields
        .filter(key => payload[key])
        .map(key => `${key}=${String(payload[key]).trim()}`)
        .join(",");

    return crypto
        .createHmac("sha256", process.env.SKIPCASH_KEY_SECRET || "")
        .update(baseString)
        .digest("base64");
}

/**
 * Create signature for skipcash webhook
 *
 * @param payload
 * @param receivedSignature
 * @returns
 */
export function verifySkipcashSignature(payload: SkipcashWebhookDto | SkipCashWebhookPayload, receivedSignature: string): boolean {
    const webhookKey = process.env.SKIPCASH_WEBHOOK_KEY || "";

    const orderedFields = [
        "PaymentId",
        "Amount",
        "StatusId",
        "TransactionId",
        "Custom1",
        "VisaId",
    ];

    const baseString = orderedFields
        .filter((key) => payload[key] !== undefined && payload[key] !== null && String(payload[key]).trim() !== "")
        .map((key) => `${key}=${String(payload[key]).trim()}`)
        .join(",");

    const computedSignature = crypto
        .createHmac("sha256", webhookKey)
        .update(baseString)
        .digest("base64");

    return computedSignature === receivedSignature;
}
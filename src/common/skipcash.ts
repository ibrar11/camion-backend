import crypto from "node:crypto";

/**
 * Create signature for skipcash authorization
 *
 * @param payload
 * @returns
 */
export function generateSignature(payload: any): string {
        const orderedFields = [
            'Uid','KeyId','Amount','FirstName','LastName',
            'Phone','Email','Street','City','State',
            'Country','PostalCode','TransactionId','Custom1'
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
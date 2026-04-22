import crypto from "node:crypto";

import { SkipcashWebhookDto } from "src/payments/dtos/SkipcashWebhookDto";

import { SignaturePayload } from "src/payments/types";

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
        .createHmac("sha256", "XkPdajOBmeHVCVSQ4M6lz0KHUebIWkNPWImtvrNtFW6Gyoxr/mdacoElTTvhFjDcIhWQBvwIqu+PldE4AOqUVbHsihZDMgGSUA6eXjcpxMcTwv6oUPJRHEDOb2ZnshDssnvEIeOMUnljDygdCRcvUSAE9uOwO+XSQVHeaQSDJRm3bsrjZJoobAoqktQHL+SKJLkIIuyXJXx6nn2LhDCZ8RbRPHOVr95EvzyFb0tGVHKMjQ/u4PJz983Ovj/Bl/zHCR/iE8okqSkprVUS1U01PXqNwADXZaFj3kYA0gaTpvc+dzRnShOGEbq9e5fJtqvYdzRbaEn/rnTzLn42nGH6/oh3cyV5hr8leTPTeAQCPjcI3RdT10fJfXd+gupvBZKG7KdDDWIR+noPtuBdOXMhyvKgv/Zp2autUvThRlnIhNAz+2ETW+85IHYMj98jN/j6O1iTU/TAmNg0HB2+vnFaPBPjGMbPpbeQCiAazWNVTjr/WUaHTx4sNAM/44w0iz9Duyy3Gw7Vl+txzTvzfWVRsg==")
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
export function verifySkipcashSignature(payload: SkipcashWebhookDto, receivedSignature: string): boolean {
    const webhookKey = "dd3d26c8-11b4-40b4-b27e-95c5ea829a8e";

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
    
        console.log("receivedSignaturereceivedSignaturereceivedSignature",receivedSignature)
        console.log("computedSignaturecomputedSignaturecomputedSignature",computedSignature)

    return computedSignature === receivedSignature;
}
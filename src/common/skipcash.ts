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
        .createHmac("sha256", "2tRYx+kBWXjXMpIRczDb2sUdh37hRz0jbcFXBdKU8dQbXp17FgDIfDBra7cubiI7xUpi2PczXewEbVhOHVRALillZb4Gl3Mm+JQuzdQZncmx7pbO9tPtm4Y8vxbK3sFcxfM43KblKDfLsYbdBpFD8JtbBY1PXEA3OlLk2waDIFvSnHmDNxyQsUAkWWNwrRIdSt1wy3jc6bjPj++N0O9gxS6uaKsmZTQlBJi48OUkY83a/Lxk6ar38sFzOBU5xPeFj2ct2Yf8yWK+MFm64Zc0Q2MC17chldc3ez0vdmD0AR8khg+NzZEkb2XuRFkmUPwYX9MYB7mTw4/PlZPzAZ5yOX4ArBckEYn4UO/68k6xyzMlnE8PA5gDro/lgEknfV25S9gl1TojCSOFSJu1Q5Gg06P15Rthr+L2svuixswTC+n8Rw6eh8CMzn/fZETVlPyB5ysYGP5zqeDfSrr5Ee0aafk1gvOp2GrWdQlkqkvxESKPL51QiyhbR2+np7frnTukypeKHO48LwT92MoNc4PRcw==")
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
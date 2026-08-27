import crypto, { UUID } from "node:crypto";

import { CreatePaymentDto } from "./dtos/CreatePaymentDto";

import { CurrencyCode } from "../inventory/enums/CurrencyCode.enum";

export interface PaymentStrategy {
    InitiatePayment(data: CreatePaymentDto): Promise<InitiatePaymentResponse>;
}

export interface InitiatePaymentResponse {
    provider: string;
    transactionId: string;
    paymentUrl: string;
    raw: SkipCashResponse;
}

export interface SkipCashResponse {
    resultObj: {
        id: string;
        statusId: number;
        created: string;
        payUrl: string;
        amount: string;
        firstPaymentAmount: number;
        currency: string;
        transactionId: string;
        finishedDate: string | null;

        custom1: string;
        custom2: string | null;
        custom3: string | null;
        custom4: string | null;
        custom5: string | null;
        custom6: string | null;
        custom7: string | null;
        custom8: string | null;
        custom9: string | null;
        custom10: string | null;

        visaId: string | null;
        refundId: string | null;
        refundStatusId: number | null;
        tokenId: string | null;

        status: string;

        cardType: string | null;
        cardNumber: string | null;

        recurringSubscriptionId: string;

        info: string | null;
        brandName: string | null;
        accountFundingSource: string | null;
        cardProduct: string | null;
        issuerName: string | null;
        issuerCountry: string | null;
        reasonCode: string | null;
        scheme: string | null;
    };

    returnCode: number;
    errorCode: number;
    errorMessage: string | null;
    error: string | null;

    validationErrors: any | null;

    hasError: boolean;
    hasValidationError: boolean;
}

export interface ApiResponse<T> {
    success: boolean;
    message: string;
    data: T;
}
export interface SignaturePayload {
    Uid: UUID;
    KeyId: string | undefined;
    Amount: string;
    FirstName: string;
    LastName: string;
    Phone: string;
    Email: string;
    Street: string;
    City: string;
    State: string;
    Country: string;
    PostalCode: string;
    TransactionId: string;
    tokenId: string | undefined;
    ReturnUrl: string | undefined;
    Custom1: string;
}

export interface skipcashWebhookResponse {
    received: boolean;
    status?: string;
    transactionId?: string;
}

export interface SkipCashSessionResponse {
    sessionId: string;
    checkoutUrl: string;
    expiresAt: string;
    paymentId?: string;
}

export interface SkipCashWebhookPayload {
    status: 'paid' | 'failed' | 'refunded';
    orderId: string;
    paymentId: string;
    amount: string;
    currency: CurrencyCode;
    tokenId?: string;
    visaId?: string;
    cardBrand?: string;
    cardLast4?: string;
    cardExpiryMonth?: string;
    cardExpiryYear?: string;
    cardholderName: string;
}

export interface SkipCashCard { 
    cardNumber: string, 
    cardType: number, 
    cardExpiry: string, 
}
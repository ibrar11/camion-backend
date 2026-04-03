import { CreatePaymentDto } from "./dtos/CreatePaymentDto";

export interface PaymentStrategy {
    InitiatePayment(data: CreatePaymentDto): Promise<InitiatePaymentResponse>;
}

export interface InitiatePaymentResponse {
    provider: string;
    transactionId: string;
    paymentUrl: string;
    orderId: string;
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

export type CreatePaymentResponse = ApiResponse<InitiatePaymentResponse>;
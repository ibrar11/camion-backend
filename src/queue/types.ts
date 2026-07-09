export interface BaseJobData {
    jobId: string;
    createdAt: Date;
    retryCount?: number;
    maxRetries?: number;
}

export interface TranslationJobData {
    jobId: string;

    productUuids: string[];

    sourceLanguageCode: string;

    createdAt: Date;

    maxRetries?: number;
    deduplicationKey: string;
}

export interface DispatchShopJobData extends BaseJobData {
    dispatchJobId: string;
    shopId: string;
    shopName: string;
    orderUuids: string[];
    gulltransOrderSn?: string;
    gulltransOrderSns?: string[];
    gulltransResponse?: Record<string, any>;
    inboundVoucherNo: string;
    shipperMethod: number;
    shipperCompany?: string;
    warehouseAddress: Record<string, any>;
    gulltransItems: Array<{
        shop_id: string;
        shop_name: string;
        platform: string;
        platform_url: string;
        name: string;
        goods_amount: string;
        skus: Array<{
            platform_sku: string;
            price: string;
            quantity: string;
            sku_info: Record<string, any>;
        }>;
    }>;
    variantSyncData: Array<{
        synchronizeType: number;
        sku: string;
        barcode: string;
        name: string;
        enName: string;
        weightUnit: string;
        weight: number;
        lengthUnit: string;
        length: number;
        width: number;
        height: number;
        packingType: number;
        declaredPrice: number;
    }>;
    wmsBoxList: Array<{
        boxNo: string;
        serialNumber: number;
        length: number;
        width: number;
        height: number;
        weight: number;
        productList: Array<{ sku: string; qty: number }>;
    }>;
}

export interface DispatchOrderJobData extends BaseJobData {
    dispatchJobId: string;
    shopId: string;
    shopName: string;
    orderUuids: string[];              // shop batch — 1688 rejects mixed-seller orders
    inboundVoucherNo: string;
    shipperMethod: number;
    shipperCompany?: string;
    hiobuyOrderId?: string;            // checkpoint — one Hiobuy order per shop batch
    hiobuyResponse?: Record<string, any>;
    warehouseAddress: Record<string, any>;
    hiobuyLines: Array<{
        offer_id: string;
        spec_id: string;
        quantity: number;
    }>;
    variantSyncData: DispatchShopJobData['variantSyncData'];
}

export interface InventoryResyncJobData extends BaseJobData {
    productUuids: string[];
}

export interface ProductCategoryResyncJobData extends BaseJobData {
    productUuids: string[];
}

export interface SkuMetaImportJobData extends BaseJobData {
    productUuids: string[];
}


export interface PaymentTimeoutJobData {
    orderUuid: string;
}
export interface OrderSkuMetaJobData {
    orderUuid: string;
}

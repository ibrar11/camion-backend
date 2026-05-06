export interface BaseJobData {
    jobId: string;
    createdAt: Date;
    retryCount?: number;
    maxRetries?: number;
}

export interface TranslationJobData {
    jobId: string;

    productUuids: string[];

    sourceLanguageId: number;

    createdAt: Date;

    maxRetries?: number;
}

export interface DispatchShopJobData extends BaseJobData {
    dispatchJobId: string;
    shopId: string;
    shopName: string;
    orderUuids: string[];
    gulltransOrderId?: string;
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
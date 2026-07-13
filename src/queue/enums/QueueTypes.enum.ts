export enum QueueName {
    TRANSLATION = 'translation',
    WMS_DISPATCH = 'wms-dispatch',
    WMS_DISPATCH_HIOBUY = 'wms-dispatch-hiobuy',
    FIELD_TRANSLATION = "field_translation",
    INVENTORY_RESYNC = "inventory_resync",
    PRODUCT_CATEGORY_RESYNC = "product_category_resync",
    SKU_META_IMPORT = "sku_meta_import",
    ORDER_SKUMETA_VALIDATION = 'order-skumeta-validation',
}

export enum JobPriority {
    CRITICAL = 1,
    HIGH = 2,
    NORMAL = 3,
    LOW = 4,
    BACKGROUND = 5,
}

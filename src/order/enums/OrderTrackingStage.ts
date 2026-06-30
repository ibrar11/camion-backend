export enum OrderTrackingStage {
    ORDER_PLACED      = 'order_placed',
    PAYMENT_CONFIRMED = 'payment_confirmed',
    ORDER_CONFIRMED   = 'order_confirmed',
    PROCESSING        = 'processing',
    PACKING           = 'packing',
    DISPATCHING       = 'dispatching',
    ORDER_DELIVERED   = 'order_delivered',
    ORDER_REVIEW      = 'order_review',
    ORDER_CANCELLED   = 'order_cancelled',
}

export enum OrderStatus {
    PENDING = 'pending',
    CONFIRMED = 'confirmed',
    CANCELLED = 'cancelled',
    DELIVERED = 'delivered',
    PAYMENT_PENDING = 'payment_pending',
    PAYMENT_SUCCESSFUL = 'payment_successful',
    /** @deprecated Legacy value from before payment_failed/payment_cancelled/payment_expired were split out. Kept only so old orders/data keep resolving — new code must never write this. */
    PAYMENT_REJECTED = 'payment_rejected',
    PAYMENT_FAILED = 'payment_failed',
    PAYMENT_CANCELLED = 'payment_cancelled',
    PAYMENT_EXPIRED = 'payment_expired',
    RETURN_REQUESTED = 'return_requested',
    RETURNED = 'returned',
}

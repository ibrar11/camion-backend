export enum NotificationType {
	// Inventory
	LOW_STOCK_ALERT = "low_stock_alert",
	OUT_OF_STOCK = "out_of_stock",
	BACK_IN_STOCK = "back_in_stock",
	PRICE_DROP = "price_drop",
	LIMITED_STOCK_WARNING = "limited_stock_warning",

	// Orders
	ORDER_PLACED = "order_placed",
	ORDER_CONFIRMED = "order_confirmed",
	ORDER_PROCESSING = "order_processing",
	ORDER_SHIPPED = "order_shipped",
	ORDER_OUT_FOR_DELIVERY = "order_out_for_delivery",
	ORDER_DELIVERED = "order_delivered",
	ORDER_DELAYED = "order_delayed",
	ORDER_CANCELLED = "order_cancelled",
	ORDER_RETURNED = "order_returned",
	ORDER_REFUNDED = "order_refunded",

	// Payments
	PAYMENT_SUCCESSFUL = "payment_successful",
	PAYMENT_FAILED = "payment_failed",
	PAYMENT_PENDING = "payment_pending",
	PAYMENT_REFUND_INITIATED = "payment_refund_initiated",
	PAYMENT_REFUND_COMPLETED = "payment_refund_completed",
	PAYMENT_METHOD_ADDED = "payment_method_added",
	PAYMENT_METHOD_REMOVED = "payment_method_removed",
	PAYMENT_DUE_REMINDER = "payment_due_reminder",
}

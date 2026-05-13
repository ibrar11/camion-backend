Notifications API
=================

This document covers the REST APIs for the notifications feature.

Notifications are created by the system or an admin and delivered to customers. Customers can retrieve their notifications and mark them as read.

Many notifications are sent **automatically** by the system when key events occur — no admin action required. See the [System-Generated Notifications](#system-generated-notifications) section below.

> [!IMPORTANT]
> All REST endpoints require a valid `Bearer` token in the `Authorization` header.
> `POST /v1/notifications` requires a `super-admin` or `admin` user token.
> `GET /v1/notifications` requires a valid customer token and returns only that customer's notifications.
> `PATCH /v1/notifications/:uuid/read` accepts any valid authenticated token.

---

Notification Types
------------------

Value | Description
------|------------
`ORDER_PLACED` | Order has been successfully placed
`ORDER_CONFIRMED` | Order confirmed by the vendor
`ORDER_PROCESSING` | Order is being prepared
`ORDER_SHIPPED` | Order has been shipped
`ORDER_OUT_FOR_DELIVERY` | Order is out for delivery
`ORDER_DELIVERED` | Order has been delivered
`ORDER_DELAYED` | Order delivery has been delayed
`ORDER_CANCELLED` | Order was cancelled
`ORDER_RETURNED` | Order return initiated
`ORDER_REFUNDED` | Refund has been processed
`PAYMENT_SUCCESSFUL` | Payment was completed successfully
`PAYMENT_FAILED` | Payment attempt failed
`PAYMENT_PENDING` | Payment is awaiting confirmation
`PAYMENT_REFUND_INITIATED` | Refund has been initiated
`PAYMENT_REFUND_COMPLETED` | Refund has been credited back
`PAYMENT_METHOD_ADDED` | A new payment method was added
`PAYMENT_METHOD_REMOVED` | A payment method was removed
`PAYMENT_DUE_REMINDER` | Upcoming or overdue payment reminder
`LOW_STOCK_ALERT` | Product stock is running low
`OUT_OF_STOCK` | Product is now out of stock
`BACK_IN_STOCK` | Previously out-of-stock product is available again
`PRICE_DROP` | Product price has dropped
`LIMITED_STOCK_WARNING` | Only a few units remaining

---

Notification Priority
---------------------

Value | Description
------|------------
`LOW` | Informational, no urgency
`MEDIUM` | Standard notification (default)
`HIGH` | Requires immediate attention

---

System-Generated Notifications
------------------------------

The following notifications are sent automatically by the system. The customer does not need to take any action to receive them.

### Order Events

| Trigger | Type | Notes |
|---|---|---|
| Customer places an order | `ORDER_PLACED` | Fired immediately after the order is created |
| Admin sets order status → `confirmed` | `ORDER_CONFIRMED` | Via `PATCH /v1/orders/:uuid/status` |
| Admin sets order status → `delivered` | `ORDER_DELIVERED` | Via `PATCH /v1/orders/:uuid/status` |
| Admin cancels order | `ORDER_CANCELLED` | Via `DELETE /v1/orders/:uuid` or status update |
| Admin sets order status → `payment_successful` | `PAYMENT_SUCCESSFUL` | Manual override only; see payment events for automatic |
| Admin sets order status → `payment_rejected` | `PAYMENT_FAILED` | Manual override only |

### Payment Events

| Trigger | Type | Notes |
|---|---|---|
| SkipCash webhook — payment paid | `PAYMENT_SUCCESSFUL` | Sent when SkipCash confirms payment |
| SkipCash webhook — payment failed or cancelled | `PAYMENT_FAILED` | Sent on failed or cancelled SkipCash transactions |

### Return & Refund Events

| Trigger | Type | Notes |
|---|---|---|
| Customer submits return request | `ORDER_RETURNED` | |
| Admin approves return | `ORDER_REFUNDED` + `PAYMENT_REFUND_INITIATED` | Two notifications sent together |
| Admin rejects return | `ORDER_RETURNED` | |

### Warehouse (JOP WMS) Events

| Trigger | Type | Notes |
|---|---|---|
| Inbound order reaches `shelved` status | `ORDER_PROCESSING` | Sent to all customers linked to that inbound |
| Outbound order receives a waybill number | `ORDER_SHIPPED` | Includes tracking number in the message |

---

REST API
========

Create Notification
-------------------

Creates a notification for a customer. Intended for system or admin use.

```http
POST /v1/notifications HTTP/1.1
```

Parameter Name | Required | Type | Description
---------------|----------|------|------------
customerUUID | Yes | String (UUID) | UUID of the target customer
type | Yes | Enum | One of the supported notification types
title | Yes | String (max 100) | Short title shown in the notification header
brief | Yes | String (max 160) | One-line summary shown in the notification list
message | Yes | String | Full notification body text
payload | No | Object | Arbitrary JSON metadata (e.g. order ID, product slug)
priority | No | Enum | `LOW`, `MEDIUM`, or `HIGH`. Defaults to `MEDIUM`

### Request Body

```json
{
    "customerUUID": "6c90d8ef-7f9f-4dcb-8db3-9769fa771ae7",
    "type": "ORDER_SHIPPED",
    "title": "Your order has been shipped",
    "brief": "Order #1042 is on its way",
    "message": "Great news! Your order #1042 has been shipped and is on its way to you. Expected delivery in 2–3 business days.",
    "payload": {
        "orderId": "1042",
        "trackingNumber": "TRK9876543210"
    },
    "priority": "HIGH"
}
```

### Response Body

```json
{
    "uuid": "a3f1e2c4-9b87-4d12-bc34-1f2e3d4a5b6c",
    "type": "ORDER_SHIPPED",
    "title": "Your order has been shipped",
    "brief": "Order #1042 is on its way",
    "message": "Great news! Your order #1042 has been shipped and is on its way to you. Expected delivery in 2–3 business days.",
    "payload": {
        "orderId": "1042",
        "trackingNumber": "TRK9876543210"
    },
    "priority": "HIGH",
    "isRead": false,
    "createdAt": "2026-04-15T10:30:00.000Z",
    "updatedAt": "2026-04-15T10:30:00.000Z",
    "customer": {
        "uuid": "6c90d8ef-7f9f-4dcb-8db3-9769fa771ae7",
        "fullName": "Your Name",
        "emailAddress": "your-name@your-domain.com",
        "phoneNumber": "+974 12345678",
        "role": "customer"
    }
}
```

---

Get My Notifications
---------------------

Returns all notifications for the logged-in customer, ordered by most recent first.

```http
GET /v1/notifications HTTP/1.1
```

### Response Body

```json
[
    {
        "uuid": "a3f1e2c4-9b87-4d12-bc34-1f2e3d4a5b6c",
        "type": "ORDER_SHIPPED",
        "title": "Your order has been shipped",
        "brief": "Order #1042 is on its way",
        "message": "Great news! Your order #1042 has been shipped and is on its way to you. Expected delivery in 2–3 business days.",
        "payload": {
            "orderId": "1042",
            "trackingNumber": "TRK9876543210"
        },
        "priority": "HIGH",
        "isRead": false,
        "createdAt": "2026-04-15T10:30:00.000Z",
        "updatedAt": "2026-04-15T10:30:00.000Z"
    },
    {
        "uuid": "b7d2f3e5-1c98-4e23-cd45-2g3f4e5b6c7d",
        "type": "PRICE_DROP",
        "title": "Price drop on an item you liked",
        "brief": "iPhone 25 is now cheaper",
        "message": "The iPhone 25 you viewed recently has dropped in price. Grab it before it sells out!",
        "payload": {
            "productSlug": "iphone-25",
            "oldPrice": 79900,
            "newPrice": 69900,
            "currency": "qar"
        },
        "priority": "MEDIUM",
        "isRead": true,
        "createdAt": "2026-04-14T08:00:00.000Z",
        "updatedAt": "2026-04-14T09:15:00.000Z"
    }
]
```

> ⚠️ Returns an empty array if the customer has no notifications.

---

Mark Notification as Read
--------------------------

Marks a single notification as read. Safe to call on an already-read notification.

```http
PATCH /v1/notifications/<notificationUUID>/read HTTP/1.1
```

### Response Body

```json
{
    "uuid": "a3f1e2c4-9b87-4d12-bc34-1f2e3d4a5b6c",
    "type": "ORDER_SHIPPED",
    "title": "Your order has been shipped",
    "brief": "Order #1042 is on its way",
    "message": "Great news! Your order #1042 has been shipped and is on its way to you. Expected delivery in 2–3 business days.",
    "payload": {
        "orderId": "1042",
        "trackingNumber": "TRK9876543210"
    },
    "priority": "HIGH",
    "isRead": true,
    "createdAt": "2026-04-15T10:30:00.000Z",
    "updatedAt": "2026-04-15T11:00:00.000Z"
}
```

> ⚠️ Returns a `404 Not Found` error if the notification UUID does not exist.

---

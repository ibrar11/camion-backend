Order REST API
==================

This document includes the documentation of order module.

Order API
============

> [!IMPORTANT]
> You must include your access token as a `Bearer` token in the Authorization header. Your account must be active while making these requests.

Create a Order
----------------


```http
POST /v1/orders HTTP/1.1
```

Parameter Name | Required | Type | Description
---------------|----------|------|------------
cartItems | Yes | Array<String> |list of cart items to be ordered
paymentMethod | Yes | String | The payment method selected by the customer (e.g., COD, CARD, default(skipcash will be used) etc.)
currency | Yes | String | target currency code
couponCode | No | String | coupon code to apply

### Request Body
```json
{
    "cartItemUuids": [
        "f7b2a1d0-5c91-4d3e-a2f1-123456789abc"
    ],
    "paymentMethod": "default",
    "currency": "qar",
    "couponCode": "rvse23"
}
```

### Response Body
```json
{
    "uuid": "9f71e265-0343-4cb5-9f00-17b515bfb980",
    "status": "payment_pending",
    "subTotal": {
        "amount": 688,
        "currencyCode": "qar"
    },
    "shippingCost": {
        "amount": 321,
        "currencyCode": "qar"
    },
    "discount": {
        "amount": 0,
        "currencyCode": "qar"
    },
    "total": {
        "amount": 1009,
        "currencyCode": "qar"
    },
    "eta": "6-10 working days",
    "orderItems": [
        {
            "uuid": "8183c409-82dd-48fe-95ad-ef45853b6635",
            "product": {
                "uuid": "a383097d-1555-4c85-a388-84eb864225c4",
                "slug": "cross-border-variable-speed-bicycle-foldableable-aluminum-alloy",
                "titleEn": "Cross-Border Variable Speed Bicycle Foldableable Aluminum Alloy Lightweight Commuter Foldableing Bicycle 20inch Bicycle",
                "titleAr": "Cross-Border Variable Speed Bicycle Foldableable Aluminum Alloy Lightweight Commuter Foldableing Bicycle 20inch Bicycle",
                "briefEn": "",
                "briefAr": "",
                "description": "",
                "descriptionEn": "",
                "status": "ACTIVE"
            },
            "variant": {
                "uuid": "ed0286b4-3eb8-4a84-971a-fb49fd6bcfd1",
                "titleEn": "Technology gray [aluminum alloy spoke wheel] 20inch [price for each of 5 to 19 vehicles]",
                "titleAr": "Technology gray [aluminum alloy spoke wheel] 20inch [price for each of 5 to 19 vehicles]",
                "sku": "5627530595058",
                "barcode": "5627530595058",
                "price": {
                    "amount": 688,
                    "currencyCode": "qar"
                },
                "weight": {
                    "amount": 16,
                    "unit": "kg"
                },
                "dimensions": {
                    "width": 36,
                    "height": 57,
                    "length": 88,
                    "unit": "cm"
                }
            },
            "price": {
                "amount": 688,
                "currencyCode": "qar"
            },
            "quantity": 1,
            "total": {
                "amount": 688,
                "currencyCode": "qar"
            }
        }
    ]
}
```

Retrieve Orders
-----------------

```http
GET /v1/orders HTTP/1.1
```

### Query Parameters
Name | Description | Default
-----|-------------|--------
status | Filter by order status | _(all)_
filters | A JSON string containing your search term, or any advanced search parameters. | `{}`
pageNumber | Page number | `1`
itemsPerPage | Results per page | `100`

### Response Body
```json
[
    {
        "uuid": "9f71e265-0343-4cb5-9f00-17b515bfb980",
        "status": "confirmed",
        "subTotal": {
            "amount": 688,
            "currencyCode": "qar"
        },
        "shippingCost": {
            "amount": 321,
            "currencyCode": "qar"
        },
        "discount": {
            "amount": 0,
            "currencyCode": "qar"
        },
        "total": {
            "amount": 1009,
            "currencyCode": "qar"
        },
        "eta": "6-10 working days",
        "tracking": {
            "stage": "inbound",
            "status": "Goods Being Sourced",
            "waybillNo": null,
            "trackingUrl": null
        },
        "orderPlacementDate": "2026-05-15T14:05:23.594Z",
        "orderItems": [
            {
                "uuid": "8183c409-82dd-48fe-95ad-ef45853b6635",
                "product": {
                    "uuid": "a383097d-1555-4c85-a388-84eb864225c4",
                    "slug": "cross-border-variable-speed-bicycle-foldableable-aluminum-alloy",
                    "titleEn": "Cross-Border Variable Speed Bicycle Foldableable Aluminum Alloy Lightweight Commuter Foldableing Bicycle 20inch Bicycle",
                    "titleAr": "Cross-Border Variable Speed Bicycle Foldableable Aluminum Alloy Lightweight Commuter Foldableing Bicycle 20inch Bicycle",
                    "briefEn": "",
                    "briefAr": "",
                    "description": "",
                    "descriptionEn": "",
                    "status": "ACTIVE"
                },
                "variant": {
                    "uuid": "ed0286b4-3eb8-4a84-971a-fb49fd6bcfd1",
                    "titleEn": "Technology gray [aluminum alloy spoke wheel] 20inch [price for each of 5 to 19 vehicles]",
                    "titleAr": "Technology gray [aluminum alloy spoke wheel] 20inch [price for each of 5 to 19 vehicles]",
                    "sku": "5627530595058",
                    "barcode": "5627530595058",
                    "price": {
                        "amount": 688,
                        "currencyCode": "qar"
                    },
                    "weight": {
                        "amount": 16,
                        "unit": "kg"
                    },
                    "dimensions": {
                        "width": 36,
                        "height": 57,
                        "length": 88,
                        "unit": "cm"
                    }
                },
                "price": {
                    "amount": 688,
                    "currencyCode": "qar"
                },
                "quantity": 1,
                "total": {
                    "amount": 688,
                    "currencyCode": "qar"
                }
            }
        ]
    }
]
```

Order Preview
--------------

```http
GET /v1/orders/order-preview HTTP/1.1
```

### Query Parameters
Name | Description | Default
-----|-------------|--------
couponCode | coupon code to apply customer promo. | ``

### Response Body
```json
{
    "cart": [
        {
            "id": 1,
            "uuid": "139d909a-22d5-4878-9bf4-0260da74ed3f",
            "product": {
                "uuid": "a383097d-1555-4c85-a388-84eb864225c4",
                "slug": "cross-border-variable-speed-bicycle-foldableable-aluminum-alloy",
                "titleEn": "Cross-Border Variable Speed Bicycle Foldableable Aluminum Alloy Lightweight Commuter Foldableing Bicycle 20inch Bicycle",
                "titleAr": "Cross-Border Variable Speed Bicycle Foldableable Aluminum Alloy Lightweight Commuter Foldableing Bicycle 20inch Bicycle",
                "briefEn": "From $799 or $33.29/mo. per month for 24 months",
                "briefAr": "ابتداءً من 799 دولارًا أو 33.29 دولارًا شهريًا لمدة 24 شهرًا",
                "descriptionEn": "Your new bike awaits. Make it yours.",
                "descriptionAr": "جهاز آيفون الجديد بانتظارك. اجعله ملكك.",
                "descriptionHtmlEn": "<b>Your new bike awaits. Make it yours</b>",
                "descriptionHtmlAr": "<b>Your new bike awaits. Make it yours</b>",
                "status": "active"
            },
            "variant": {
                "uuid": "ed0286b4-3eb8-4a84-971a-fb49fd6bcfd1",
                "inventoryItem": {
                    "uuid": "f631f43a-a6eb-4968-b2a1-a92bded8ae22",
                    "sku": "5627530595058",
                    "levels": [
                        {
                            "uuid": "f043a63f-e206-458b-a6bc-34193a0d69e5",
                            "quantity": 1999
                        }
                    ]
                },
                "titleEn": "Technology gray [aluminum alloy spoke wheel] 20inch [price for each of 5 to 19 vehicles]",
                "titleAr": "Technology gray [aluminum alloy spoke wheel] 20inch [price for each of 5 to 19 vehicles]",
                "sku": "5627530595058",
                "barcode": "5627530595058",
                "price": {
                    "amount": 688,
                    "currencyCode": "usd"
                },
                "weight": {
                    "amount": 16,
                    "unit": "kg"
                },
                "dimensions": {
                    "width": 36,
                    "height": 57,
                    "length": 88,
                    "unit": "cm"
                }
            },
            "quantity": 1,
            "subTotal": "688.00",
            "updatedAt": "2026-04-15T07:16:09.379Z",
            "createdAt": "2026-04-15T07:16:09.379Z"
        }
    ],
    "shippingAddress": {
        "uuid": "91600fd1-52e9-4d1f-906f-cc560f11545f",
        "fullName": "Fahad Al-Saud",
        "phoneNumber": "+966 51 234 5678",
        "streetAddress": "King Fahd Road",
        "apartment": "Apartment 12B, Al Noor Building",
        "zipCode": "12271",
        "city": "Riyadh",
        "state": "Riyadh Province",
        "country": "Saudi Arabia",
        "isDefault": true
    },
    "cart_total": 688,
    "discount": 250,
    "shipping": {
        "shippingFee": {
            "amount": 209.4,
            "currency": "USD",
            "breakdown": {
                "weightCharge": 204,
                "fixedFee": 5.3999999999999995,
                "ratePerKg": 12.75
            }
        },
        "handlingFee": {
            "amount": 3.73,
            "currency": "USD"
        },
        "transitTime": {
            "minDays": 6,
            "maxDays": 10,
            "estimatedRange": "6-10 working days"
        },
        "taxesAndFees": {
            "vat": {
                "rate": 15,
                "amount": 103.2,
                "formula": "(688 + 0) × 15%"
            },
            "customsClearanceFee": {
                "amount": 5.0025,
                "formula": "33.35 CNY per item"
            }
        },
        "totalShippingCost": 321.3325,
        "currency": "USD",
        "country": "Saudi Arabia",
        "countryCode": "SA"
    },
    "shippingTotal": 321.3325,
    "grand_total": 1009.3325,
    "eta": "6-10 working days",
}
```

Retrieve Order
----------------

```http
GET /v1/orders/<order-uuid> HTTP/1.1
```

### Response Body
```json
{
    "uuid": "9f71e265-0343-4cb5-9f00-17b515bfb980",
    "status": "confirmed",
    "subTotal": {
        "amount": 688,
        "currencyCode": "qar"
    },
    "shippingCost": {
        "amount": 321,
        "currencyCode": "qar"
    },
    "discount": {
        "amount": 0,
        "currencyCode": "qar"
    },
    "total": {
        "amount": 1009,
        "currencyCode": "qar"
    },
    "eta": "6-10 working days",
    "tracking": {
        "stage": "outbound",
        "status": "Shipped",
        "waybillNo": "DHL1234567890",
        "trackingUrl": "https://track.4px.com/#/result/0/DHL1234567890"
    },
    "orderPlacementDate": "2026-05-15T14:05:23.594Z",
    "orderItems": [
        {
            "uuid": "8183c409-82dd-48fe-95ad-ef45853b6635",
            "product": {
                "uuid": "a383097d-1555-4c85-a388-84eb864225c4",
                "slug": "cross-border-variable-speed-bicycle-foldableable-aluminum-alloy",
                "titleEn": "Cross-Border Variable Speed Bicycle Foldableable Aluminum Alloy Lightweight Commuter Foldableing Bicycle 20inch Bicycle",
                "titleAr": "Cross-Border Variable Speed Bicycle Foldableable Aluminum Alloy Lightweight Commuter Foldableing Bicycle 20inch Bicycle",
                "briefEn": "",
                "briefAr": "",
                "description": "",
                "descriptionEn": "",
                "status": "ACTIVE"
            },
            "variant": {
                "uuid": "ed0286b4-3eb8-4a84-971a-fb49fd6bcfd1",
                "titleEn": "Technology gray [aluminum alloy spoke wheel] 20inch [price for each of 5 to 19 vehicles]",
                "titleAr": "Technology gray [aluminum alloy spoke wheel] 20inch [price for each of 5 to 19 vehicles]",
                "sku": "5627530595058",
                "barcode": "5627530595058",
                "price": {
                    "amount": 688,
                    "currencyCode": "qar"
                },
                "weight": {
                    "amount": 16,
                    "unit": "kg"
                },
                "dimensions": {
                    "width": 36,
                    "height": 57,
                    "length": 88,
                    "unit": "cm"
                }
            },
            "price": {
                "amount": 688,
                "currencyCode": "qar"
            },
            "quantity": 1,
            "total": {
                "amount": 688,
                "currencyCode": "usd"
            }
        }
    ],
    "gulltransOrderSns": ["DG100", "DG200", "DG300"],
    "wmsOrders": [
        {
            "id": 1,
            "orderNo": "abc123def456abc123def456abc123de",
            "type": "inbound",
            "status": "14",
            "wmsAssignedId": "501",
            "waybillNo": null,
            "errorCount": 0
        },
        {
            "id": 4,
            "orderNo": "9f71e265-0343-4cb5-9f00-17b515bfb980-out",
            "type": "outbound",
            "status": "14",
            "wmsAssignedId": "701",
            "waybillNo": "DHL1234567890",
            "errorCount": 0
        }
    ]
}
```

| Field | Type | Description |
|---|---|---|
| `tracking.stage` | `"order" \| "inbound" \| "outbound"` | Furthest stage reached: `order` = not yet dispatched, `inbound` = goods being procured/shipped to warehouse, `outbound` = shipped to customer |
| `tracking.status` | `String` | Human-readable status label for the current stage |
| `tracking.waybillNo` | `String \| null` | 4PX carrier tracking number — populated once the outbound order is shipped |
| `tracking.trackingUrl` | `String \| null` | Direct 4PX tracking link (`https://track.4px.com/#/result/0/<waybillNo>`). `null` until the order is shipped |
| `tracking.canRetryOutbound` | `Boolean` | `true` when the frontend should show a retry button (inbound stored but outbound never created, or outbound processing failed) |
| `gulltransOrderSns` | `String[] \| null` | One Gulltrans order ID per 1688 shop involved in this order. `null` if not yet dispatched. |
| `wmsOrders` | `Object[]` | All JOP WMS orders (inbound and outbound) linked to this order via the link table. Empty array if not yet dispatched. |
| `wmsOrders[].id` | Number | Internal WMS order record ID |
| `wmsOrders[].orderNo` | String | JOP WMS `customerVoucherNo` |
| `wmsOrders[].type` | `"inbound" \| "outbound" \| "return"` | WMS order type |
| `wmsOrders[].status` | String | Raw JOP WMS status code |
| `wmsOrders[].wmsAssignedId` | `String \| null` | WMS-assigned order ID returned on creation |
| `wmsOrders[].waybillNo` | `String \| null` | Carrier tracking number (outbound only, once shipped) |
| `wmsOrders[].errorCount` | Number | Consecutive poll failures; orders with 5+ are skipped |
| `wmsOrders[].lastError` | `String \| null` | Last poll error message; cleared on next successful poll |

Update Order
--------------

```http
PATCH /v1/orders/<order-uuid>/status HTTP/1.1
```

Admin only (`SuperAdmin` or `Admin` role).

Parameter Name | Required | Type | Description
---------------|----------|------|------------
status | Yes | String | New status for the order
cancellationReason | No | String | Human-readable reason stored on the order when `status` is `cancelled`

### Request Body
```json
{
    "status": "cancelled",
    "cancellationReason": "Out of stock"
}
```

### Response Body
```json
{
    "uuid": "9f71e265-0343-4cb5-9f00-17b515bfb980",
    "status": "payment_successful",
    "subTotal": {
        "amount": 688,
        "currencyCode": "usd"
    },
    "shippingCost": {
        "amount": 321,
        "currencyCode": "usd"
    },
    "discount": {
        "amount": 0,
        "currencyCode": "usd"
    },
    "total": {
        "amount": 1009,
        "currencyCode": "usd"
    },
    "eta": "6-10 working days",
    "orderItems": [
        {
            "uuid": "8183c409-82dd-48fe-95ad-ef45853b6635",
            "product": {
                "uuid": "a383097d-1555-4c85-a388-84eb864225c4",
                "slug": "cross-border-variable-speed-bicycle-foldableable-aluminum-alloy",
                "titleEn": "Cross-Border Variable Speed Bicycle Foldableable Aluminum Alloy Lightweight Commuter Foldableing Bicycle 20inch Bicycle",
                "titleAr": "Cross-Border Variable Speed Bicycle Foldableable Aluminum Alloy Lightweight Commuter Foldableing Bicycle 20inch Bicycle",
                "briefEn": "",
                "briefAr": "",
                "description": "",
                "descriptionEn": "",
                "status": "ACTIVE"
            },
            "variant": {
                "uuid": "ed0286b4-3eb8-4a84-971a-fb49fd6bcfd1",
                "titleEn": "Technology gray [aluminum alloy spoke wheel] 20inch [price for each of 5 to 19 vehicles]",
                "titleAr": "Technology gray [aluminum alloy spoke wheel] 20inch [price for each of 5 to 19 vehicles]",
                "sku": "5627530595058",
                "barcode": "5627530595058",
                "price": {
                    "amount": 688,
                    "currencyCode": "usd"
                },
                "weight": {
                    "amount": 16,
                    "unit": "kg"
                },
                "dimensions": {
                    "width": 36,
                    "height": 57,
                    "length": 88,
                    "unit": "cm"
                }
            },
            "price": {
                "amount": 688,
                "currencyCode": "usd"
            },
            "quantity": 1,
            "total": {
                "amount": 688,
                "currencyCode": "usd"
            }
        }
    ]
}
```

Cancel Order
--------------

```http
DELETE /v1/orders/<order-uuid> HTTP/1.1
```

---

Order Tracking
--------------

Returns 8 happy-path tracking stages plus a separate `cancelled` field. Stages that have been reached have `checked: true` and a populated `date`; pending stages have `checked: false` and `date: null`. The `cancelled` field is `null` for active orders and an `OrderTrackingItem` object when the order has been cancelled.

Customers can only retrieve tracking for their own orders; admins can query any order.

```http
GET /v1/orders/<order-uuid>/tracking HTTP/1.1
```

### Query Parameters

| Name | Description | Default |
|---|---|---|
| `language` | Language for stage names. Supported: `en`, `ar` | `en` |

### Stages (always returned in this fixed order)

| `id` | `name (en)` | `name (ar)` | Set automatically when… |
|---|---|---|---|
| `1` | Order Placed | تم تقديم الطلب | Order is created |
| `2` | Payment Confirmed | تم تأكيد الدفع | Skipcash webhook fires with a successful payment status, OR `updateStatus()` is called with `PAYMENT_SUCCESSFUL` |
| `3` | Order Confirmed | تم تأكيد الطلب | Admin sets order status to `confirmed` |
| `4` | Processing | قيد المعالجة | Dispatch worker creates Gulltrans procurement order (1688) |
| `5` | Packing | قيد التغليف | JOP WMS inbound reaches status 14 (STORED — goods at warehouse) |
| `6` | Dispatching | قيد الشحن | JOP WMS outbound receives a waybill number — `metadata.trackingId` is populated |
| `7` | Order Delivered | تم التسليم | Admin sets order status to `delivered` |
| `8` | Order Review | تقييم الطلب | Customer submits a product review with `orderUuid` via `POST /v1/products/:uuid/reviews` — `metadata.reviewText` and `metadata.reviewRating` are populated automatically |

The `cancelled` field (id `9`, name `Order Cancelled` / `تم إلغاء الطلب`) is a separate top-level field returned alongside `stages`. It is `null` for active orders and contains the cancellation event object (with `metadata.cancellationReason`) when the order has been cancelled.

### Response Fields

| Field | Type | Description |
|---|---|---|
| `stages` | `Array` | Ordered list of the 8 happy-path tracking stages |
| `stages[].id` | `number` | Stage ID (1–8, fixed) |
| `stages[].name` | `string` | Stage label in the requested language |
| `stages[].checked` | `boolean` | `true` if this stage has been reached |
| `stages[].date` | `string (ISO 8601) \| null` | When the stage was reached; `null` if not yet reached |
| `stages[].metadata` | `object` | Stage-specific data; all fields `null` unless relevant to that stage |
| `stages[].metadata.trackingId` | `string \| null` | Carrier waybill number — populated on stage 6 (Dispatching) |
| `stages[].metadata.cancellationReason` | `string \| null` | Always `null` on happy-path stages |
| `stages[].metadata.reviewText` | `string \| null` | Review text — populated on stage 8 (Order Review) |
| `stages[].metadata.reviewRating` | `number \| null` | Star rating (1–5) — populated on stage 8 (Order Review) |
| `cancelled` | `object \| null` | Cancellation event (id `9`); `null` if the order has not been cancelled |
| `cancelled.id` | `number` | Always `9` |
| `cancelled.name` | `string` | `"Order Cancelled"` / `"تم إلغاء الطلب"` |
| `cancelled.checked` | `boolean` | Always `true` when present |
| `cancelled.date` | `string (ISO 8601)` | When the order was cancelled |
| `cancelled.metadata.cancellationReason` | `string \| null` | Reason provided at cancellation time |

### Example — order dispatched (`?language=en`)

```json
{
    "stages": [
        { "id": 1, "name": "Order Placed",      "checked": true,  "date": "2026-06-23T10:00:00Z", "metadata": { "trackingId": null, "cancellationReason": null, "reviewText": null, "reviewRating": null } },
        { "id": 2, "name": "Payment Confirmed",  "checked": true,  "date": "2026-06-23T10:01:00Z", "metadata": { "trackingId": null, "cancellationReason": null, "reviewText": null, "reviewRating": null } },
        { "id": 3, "name": "Order Confirmed",    "checked": true,  "date": "2026-06-23T10:05:00Z", "metadata": { "trackingId": null, "cancellationReason": null, "reviewText": null, "reviewRating": null } },
        { "id": 4, "name": "Processing",         "checked": true,  "date": "2026-06-23T11:00:00Z", "metadata": { "trackingId": null, "cancellationReason": null, "reviewText": null, "reviewRating": null } },
        { "id": 5, "name": "Packing",            "checked": true,  "date": "2026-06-24T06:00:00Z", "metadata": { "trackingId": null, "cancellationReason": null, "reviewText": null, "reviewRating": null } },
        { "id": 6, "name": "Dispatching",        "checked": true,  "date": "2026-06-25T08:00:00Z", "metadata": { "trackingId": "TRK1234567890", "cancellationReason": null, "reviewText": null, "reviewRating": null } },
        { "id": 7, "name": "Order Delivered",    "checked": false, "date": null,                   "metadata": { "trackingId": null, "cancellationReason": null, "reviewText": null, "reviewRating": null } },
        { "id": 8, "name": "Order Review",       "checked": false, "date": null,                   "metadata": { "trackingId": null, "cancellationReason": null, "reviewText": null, "reviewRating": null } }
    ],
    "cancelled": null
}
```

### Example — cancelled order (`?language=ar`)

```json
{
    "stages": [
        { "id": 1, "name": "تم تقديم الطلب",   "checked": true,  "date": "2026-06-23T10:00:00Z", "metadata": { "trackingId": null, "cancellationReason": null, "reviewText": null, "reviewRating": null } },
        { "id": 2, "name": "تم تأكيد الدفع",   "checked": true,  "date": "2026-06-23T10:01:00Z", "metadata": { "trackingId": null, "cancellationReason": null, "reviewText": null, "reviewRating": null } },
        { "id": 3, "name": "تم تأكيد الطلب",   "checked": false, "date": null,                   "metadata": { "trackingId": null, "cancellationReason": null, "reviewText": null, "reviewRating": null } },
        { "id": 4, "name": "قيد المعالجة",      "checked": false, "date": null,                   "metadata": { "trackingId": null, "cancellationReason": null, "reviewText": null, "reviewRating": null } },
        { "id": 5, "name": "قيد التغليف",       "checked": false, "date": null,                   "metadata": { "trackingId": null, "cancellationReason": null, "reviewText": null, "reviewRating": null } },
        { "id": 6, "name": "قيد الشحن",         "checked": false, "date": null,                   "metadata": { "trackingId": null, "cancellationReason": null, "reviewText": null, "reviewRating": null } },
        { "id": 7, "name": "تم التسليم",        "checked": false, "date": null,                   "metadata": { "trackingId": null, "cancellationReason": null, "reviewText": null, "reviewRating": null } },
        { "id": 8, "name": "تقييم الطلب",       "checked": false, "date": null,                   "metadata": { "trackingId": null, "cancellationReason": null, "reviewText": null, "reviewRating": null } }
    ],
    "cancelled": { "id": 9, "name": "تم إلغاء الطلب", "checked": true, "date": "2026-06-23T10:30:00Z", "metadata": { "trackingId": null, "cancellationReason": "Out of stock", "reviewText": null, "reviewRating": null } }
}
```

### Example — delivered and reviewed (`?language=en`)

```json
{
    "stages": [
        { "id": 1, "name": "Order Placed",      "checked": true,  "date": "2026-06-23T10:00:00Z", "metadata": { "trackingId": null, "cancellationReason": null, "reviewText": null, "reviewRating": null } },
        { "id": 2, "name": "Payment Confirmed",  "checked": true,  "date": "2026-06-23T10:01:00Z", "metadata": { "trackingId": null, "cancellationReason": null, "reviewText": null, "reviewRating": null } },
        { "id": 3, "name": "Order Confirmed",    "checked": true,  "date": "2026-06-23T10:05:00Z", "metadata": { "trackingId": null, "cancellationReason": null, "reviewText": null, "reviewRating": null } },
        { "id": 4, "name": "Processing",         "checked": true,  "date": "2026-06-23T11:00:00Z", "metadata": { "trackingId": null, "cancellationReason": null, "reviewText": null, "reviewRating": null } },
        { "id": 5, "name": "Packing",            "checked": true,  "date": "2026-06-24T06:00:00Z", "metadata": { "trackingId": null, "cancellationReason": null, "reviewText": null, "reviewRating": null } },
        { "id": 6, "name": "Dispatching",        "checked": true,  "date": "2026-06-25T08:00:00Z", "metadata": { "trackingId": "TRK1234567890", "cancellationReason": null, "reviewText": null, "reviewRating": null } },
        { "id": 7, "name": "Order Delivered",    "checked": true,  "date": "2026-06-27T14:00:00Z", "metadata": { "trackingId": null, "cancellationReason": null, "reviewText": null, "reviewRating": null } },
        { "id": 8, "name": "Order Review",       "checked": true,  "date": "2026-06-28T10:00:00Z", "metadata": { "trackingId": null, "cancellationReason": null, "reviewText": "Great quality, fast delivery!", "reviewRating": 5 } }
    ],
    "cancelled": null
}
```

### Backing store

Stage events are persisted in the `order_tracking_events` table. Each row records `order_uuid`, `stage` (enum), `date`, `tracking_id`, `cancellation_reason`, `review_text`, and `review_rating`. Rows are append-only and idempotent — duplicate events for the same order + stage are never inserted.

The `ORDER_REVIEW` stage is stamped automatically when a customer calls `POST /v1/products/:uuid/reviews` with a valid `orderUuid`. If the customer leaves multiple product reviews for the same order, the text is appended (separated by `\n---\n`) and the rating is averaged.

---

Payment Timeout — Auto-Cancel
------------------------------

When an order is placed, a 30-minute delayed job is queued. If the order status is still `pending` or `payment_pending` when the job fires, the order is automatically cancelled with the reason `"Payment not completed within 30 minutes"` and the customer receives a cancellation push notification.

If payment arrives before the 30 minutes expire, the timeout job exits silently with no action.

**Webhook reopen behaviour:** If a successful payment webhook arrives for an already-cancelled order (e.g. payment completed just after the timeout), the order is automatically reopened — status is set back to `payment_successful`, `cancellationReason` is cleared, and the customer receives a "Payment Successful" push notification and order-confirmed email.

---

Order Review
-------------

Customers submit a review via `POST /v1/products/:productUUID/reviews` with an `orderUuid` in the body. The server validates that the order belongs to the customer, has status `delivered`, and contains the product being reviewed — then automatically stamps stage 8 (Order Review).

Once stamped, `stages[7].checked` becomes `true` and `stages[7].metadata.reviewText` / `stages[7].metadata.reviewRating` are populated in the tracking response.

If the customer submits multiple product reviews linked to the same order, the review text is appended (separated by `\n---\n`) and the rating is averaged. The review is always saved regardless of whether the tracking stamp succeeds.

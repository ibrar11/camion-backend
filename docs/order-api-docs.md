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
paymentMethod | Yes | String | The payment method selected by the customer (e.g., COD, CARD, etc.)

### Request Body
```json
{
    "cartItems": [
        "f7b2a1d0-5c91-4d3e-a2f1-123456789abc"
    ],
    "paymentMethod": "COD"
}
```

### Response Body
```json
{
    "uuid": "f7b2a1d0-5c91-4d3e-a2f1-123456789abc",
    "status": "payment_pending",
    "currency": "USD",
    "subTotal": 1598.00,
    "shippingCost": 0,
    "discount": 0,
    "total": 1598.00,
    "isPaid": false,
    "paidAt": null,
    "orderItems": [
        {
            "uuid": "a9c8f7d6-1234-4567-8901-abcdef123456",
            "price": {
                "amount": 799.00,
                "currencyCode": "USD"
            },
            "quantity": 2,
            "total": {
                "amount": 799.00,
                "currencyCode": "USD"
            }
        }
    ],
    "createdAt": "2026-04-09T10:15:30Z",
    "updatedAt": "2026-04-09T10:15:30Z"
}
```

Retrieve Orders
-----------------

```http
GET /v1/orders HTTP/1.1
```

### Response Body
```json
[
    {
        "uuid": "bf5f6137-ee3d-4b38-a4e8-d006b3703574",
        "status": "payment_pending",
        "subTotal": {
            "amount": 310,
            "currencyCode": "USD"
        },
        "shippingCost": {
            "amount": 0,
            "currencyCode": "USD"
        },
        "discount": {
            "amount": 0,
            "currencyCode": "USD"
        },
        "total": {
            "amount": 310,
            "currencyCode": "USD"
        },
        "orderItems": [
            {
                "uuid": "ef893667-0357-401a-97e6-6f03aba6c06c",
                "price": {
                    "amount": 310,
                    "currencyCode": "USD"
                },
                "quantity": 1,
                "total": {
                    "amount": 310,
                    "currencyCode": "USD"
                }
            }
        ]
    }
]
```

Retrieve My Orders
-----------------

```http
GET /v1/orders/me HTTP/1.1
```

### Response Body
```json
[
    {
        "uuid": "bf5f6137-ee3d-4b38-a4e8-d006b3703574",
        "status": "payment_pending",
        "subTotal": {
            "amount": 310,
            "currencyCode": "USD"
        },
        "shippingCost": {
            "amount": 0,
            "currencyCode": "USD"
        },
        "discount": {
            "amount": 0,
            "currencyCode": "USD"
        },
        "total": {
            "amount": 310,
            "currencyCode": "USD"
        },
        "orderItems": [
            {
                "uuid": "ef893667-0357-401a-97e6-6f03aba6c06c",
                "price": {
                    "amount": 310,
                    "currencyCode": "USD"
                },
                "quantity": 1,
                "total": {
                    "amount": 310,
                    "currencyCode": "USD"
                }
            }
        ]
    },
    {
        "uuid": "8bb057d2-86ee-4877-b429-28d7ef63cbe5",
        "status": "cancelled",
        "subTotal": {
            "amount": 310,
            "currencyCode": "USD"
        },
        "shippingCost": {
            "amount": 0,
            "currencyCode": "USD"
        },
        "discount": {
            "amount": 0,
            "currencyCode": "USD"
        },
        "total": {
            "amount": 310,
            "currencyCode": "USD"
        },
        "orderItems": [
            {
                "uuid": "5c8b2532-4833-4cdc-b6ef-654474e39be3",
                "price": {
                    "amount": 310,
                    "currencyCode": "USD"
                },
                "quantity": 1,
                "total": {
                    "amount": 310,
                    "currencyCode": "USD"
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
                "status": "ACTIVE"
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
                    "currencyCode": "USD"
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
    "address": {
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
    "grand_total": 1009.3325
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
    "uuid": "8bb057d2-86ee-4877-b429-28d7ef63cbe5",
    "status": "cancelled",
    "subTotal": {
        "amount": 310,
        "currencyCode": "USD"
    },
    "shippingCost": {
        "amount": 0,
        "currencyCode": "USD"
    },
    "discount": {
        "amount": 0,
        "currencyCode": "USD"
    },
    "total": {
        "amount": 310,
        "currencyCode": "USD"
    },
    "orderItems": [
        {
            "uuid": "5c8b2532-4833-4cdc-b6ef-654474e39be3",
            "price": {
                "amount": 310,
                "currencyCode": "USD"
            },
            "quantity": 1,
            "total": {
                "amount": 310,
                "currencyCode": "USD"
            }
        }
    ]
}
```

Update Order
--------------

```http
PATCH /v1/orders/<order-uuid> HTTP/1.1
```

Parameter Name | Required | Type | Description
---------------|----------|------|------------
status | Yes | String | new status for order

### Request Body
```json
{
    "status": "cancelled",
}
```

### Response Body
```json
{
    "uuid": "f7b2a1d0-5c91-4d3e-a2f1-123456789abc",
    "status": "payment_pending",
    "currency": "USD",
    "subTotal": 1598.00,
    "shippingCost": 0,
    "discount": 0,
    "total": 1598.00,
    "isPaid": false,
    "paidAt": null,
    "orderItems": [
        {
            "uuid": "a9c8f7d6-1234-4567-8901-abcdef123456",
            "price": {
                "amount": 799.00,
                "currencyCode": "USD"
            },
            "quantity": 2,
            "total": {
                "amount": 799.00,
                "currencyCode": "USD"
            }
        }
    ],
    "createdAt": "2026-04-09T10:15:30Z",
    "updatedAt": "2026-04-09T10:15:30Z"
}
```

Cancel Order
--------------

```http
DELETE /v1/orders/<order-uuid> HTTP/1.1
```
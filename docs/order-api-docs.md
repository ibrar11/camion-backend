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

### Response Body
```json
[
    {
        "uuid": "9f71e265-0343-4cb5-9f00-17b515bfb980",
        "status": "payment_pending",
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
    "status": "payment_pending",
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

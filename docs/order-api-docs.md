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
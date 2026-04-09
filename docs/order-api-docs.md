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
customerData.fullName | No | Full name of the customer
customerData.email | No | String | Email address of the customer
customerData.phoneNumber | No | String | Contact phone number
customerData.streetAddress | No | String | Street address of the customer
customerData.apartment | No | String | Apartment, suite, or unit number
customerData.city | No | String | City of the customer
customerData.state | No | String | State or province
customerData.zipCode | No | String | ZIP or postal code
customerData.country | No | String | Country name
customerData.shippingAddress | No | String | Separate shipping address if different from billing
customerData.shippingAddress.fullName | Yes | String | Full name for shipping
customerData.shippingAddress.countryCode | Yes | String | Country dialing code (e.g., +1)
customerData.shippingAddress.phoneNumber | Yes | String | Shipping contact number
customerData.shippingAddress.streetAddress | Yes | String | Shipping street address
customerData.shippingAddress.apartment | Yes | String | Shipping apartment/unit
customerData.shippingAddress.zipCode | Yes | String | Shipping ZIP/postal code
customerData.shippingAddress.city | Yes | String | Shipping city
customerData.shippingAddress.state | Yes | String | Shipping state/province
customerData.shippingAddress.country | Yes | String | Shipping country
customerData.shippingOption | No | String | Selected shipping option details
paymentMethod | Yes | String | The payment method selected by the customer (e.g., COD, CARD, etc.)

### Request Body
```json
{
    "paymentMethod": "COD",
    "customerData": {
        "fullName": "John Doe",
        "email": "john.doe@example.com",
        "phoneNumber": "+1234567890",
        "couponCode": "SUMMER10",
        "streetAddress": "123 Main Street",
        "apartment": "Apt 4B",
        "city": "New York",
        "state": "NY",
        "zipCode": "10001",
        "country": "USA",
        "shippingAddress": {
            "fullName": "John Doe",
            "countryCode": "+1",
            "phoneNumber": "1234567890",
            "streetAddress": "123 Main Street",
            "apartment": "Apt 4B",
            "zipCode": "10001",
            "city": "New York",
            "state": "NY",
            "country": "USA"
        },
        "shippingOption": {
            "id": "standard",
            "name": "Standard Delivery",
            "estimatedDays": 5
        }
    }
}
```

### Response Body
```json
{
    "uuid": "f7b2a1d0-5c91-4d3e-a2f1-123456789abc",
    "status": "PENDING",
    "currency": "USD",
    "subTotal": 1598.00,
    "shippingCost": 0,
    "discount": 0,
    "total": 1598.00,
    "isPaid": false,
    "paidAt": null,
    "customerSnapshot": {
        "fullName": "John Doe",
        "email": "john.doe@example.com",
        "phoneNumber": "+1234567890",
        "streetAddress": "123 Main Street",
        "apartment": "Apt 4B",
        "city": "New York",
        "state": "NY",
        "zipCode": "10001",
        "country": "USA",
        "shippingAddress": {
            "fullName": "John Doe",
            "countryCode": "+1",
            "phoneNumber": "1234567890",
            "streetAddress": "123 Main Street",
            "apartment": "Apt 4B",
            "zipCode": "10001",
            "city": "New York",
            "state": "NY",
            "country": "USA"
        },
        "shippingOption": {
            "id": "standard",
            "name": "Standard Delivery",
            "estimatedDays": 5
        }
    },
    "orderItems": [
        {
            "uuid": "a9c8f7d6-1234-4567-8901-abcdef123456",
            "productName": "iPhone 17",
            "sku": "IP17-BLK-128",
            "price": 799.00,
            "quantity": 2,
            "total": 1598.00,
            "variant": {
                "uuid": "v1234abcd-5678-ef90-1234-abcdef567890",
                "titleEn": "iPhone 17 Black 128GB",
                "titleAr": "آيفون 17 أسود 128 جيجا"
            },
            "warehouse": {
                "uuid": "w1234abcd-5678-ef90-1234-abcdef567890",
                "name": "New York Warehouse",
                "code": "NY-01"
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
        "uuid": "f7b2a1d0-5c91-4d3e-a2f1-123456789abc",
        "status": "PENDING",
        "currency": "USD",
        "subTotal": 1598.00,
        "shippingCost": 0,
        "discount": 0,
        "total": 1598.00,
        "isPaid": false,
        "paidAt": null,
        "customerSnapshot": {
            "fullName": "John Doe",
            "email": "john.doe@example.com",
            "phoneNumber": "+1234567890",
            "streetAddress": "123 Main Street",
            "apartment": "Apt 4B",
            "city": "New York",
            "state": "NY",
            "zipCode": "10001",
            "country": "USA",
            "shippingAddress": {
                "fullName": "John Doe",
                "countryCode": "+1",
                "phoneNumber": "1234567890",
                "streetAddress": "123 Main Street",
                "apartment": "Apt 4B",
                "zipCode": "10001",
                "city": "New York",
                "state": "NY",
                "country": "USA"
            },
            "shippingOption": {
                "id": "standard",
                "name": "Standard Delivery",
                "estimatedDays": 5
            }
        },
        "orderItems": [
            {
                "uuid": "a9c8f7d6-1234-4567-8901-abcdef123456",
                "productName": "iPhone 17",
                "sku": "IP17-BLK-128",
                "price": 799.00,
                "quantity": 2,
                "total": 1598.00,
                "variant": {
                    "uuid": "v1234abcd-5678-ef90-1234-abcdef567890",
                    "titleEn": "iPhone 17 Black 128GB",
                    "titleAr": "آيفون 17 أسود 128 جيجا"
                },
                "warehouse": {
                    "uuid": "w1234abcd-5678-ef90-1234-abcdef567890",
                    "name": "New York Warehouse",
                    "code": "NY-01"
                }
            }
        ],
        "createdAt": "2026-04-09T10:15:30Z",
        "updatedAt": "2026-04-09T10:15:30Z"
    }
]
```

Retrieve My Orders
-----------------

```http
GET /v1/orders/:<customer-uuid>/orders HTTP/1.1
```

Parameter Name | Required | Type | Description
---------------|----------|------|------------
uuid | Yes | UUID | UUID of the customer for which orders will be fetched

### Response Body
```json
[
    {
        "uuid": "f7b2a1d0-5c91-4d3e-a2f1-123456789abc",
        "status": "PENDING",
        "currency": "USD",
        "subTotal": 1598.00,
        "shippingCost": 0,
        "discount": 0,
        "total": 1598.00,
        "isPaid": false,
        "paidAt": null,
        "customerSnapshot": {
            "fullName": "John Doe",
            "email": "john.doe@example.com",
            "phoneNumber": "+1234567890",
            "streetAddress": "123 Main Street",
            "apartment": "Apt 4B",
            "city": "New York",
            "state": "NY",
            "zipCode": "10001",
            "country": "USA",
            "shippingAddress": {
                "fullName": "John Doe",
                "countryCode": "+1",
                "phoneNumber": "1234567890",
                "streetAddress": "123 Main Street",
                "apartment": "Apt 4B",
                "zipCode": "10001",
                "city": "New York",
                "state": "NY",
                "country": "USA"
            },
            "shippingOption": {
                "id": "standard",
                "name": "Standard Delivery",
                "estimatedDays": 5
            }
        },
        "orderItems": [
            {
                "uuid": "a9c8f7d6-1234-4567-8901-abcdef123456",
                "productName": "iPhone 17",
                "sku": "IP17-BLK-128",
                "price": 799.00,
                "quantity": 2,
                "total": 1598.00,
                "variant": {
                    "uuid": "v1234abcd-5678-ef90-1234-abcdef567890",
                    "titleEn": "iPhone 17 Black 128GB",
                    "titleAr": "آيفون 17 أسود 128 جيجا"
                },
                "warehouse": {
                    "uuid": "w1234abcd-5678-ef90-1234-abcdef567890",
                    "name": "New York Warehouse",
                    "code": "NY-01"
                }
            }
        ],
        "createdAt": "2026-04-09T10:15:30Z",
        "updatedAt": "2026-04-09T10:15:30Z"
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
    "uuid": "f7b2a1d0-5c91-4d3e-a2f1-123456789abc",
    "status": "PENDING",
    "currency": "USD",
    "subTotal": 1598.00,
    "shippingCost": 0,
    "discount": 0,
    "total": 1598.00,
    "isPaid": false,
    "paidAt": null,
    "customerSnapshot": {
        "fullName": "John Doe",
        "email": "john.doe@example.com",
        "phoneNumber": "+1234567890",
        "streetAddress": "123 Main Street",
        "apartment": "Apt 4B",
        "city": "New York",
        "state": "NY",
        "zipCode": "10001",
        "country": "USA",
        "shippingAddress": {
            "fullName": "John Doe",
            "countryCode": "+1",
            "phoneNumber": "1234567890",
            "streetAddress": "123 Main Street",
            "apartment": "Apt 4B",
            "zipCode": "10001",
            "city": "New York",
            "state": "NY",
            "country": "USA"
        },
        "shippingOption": {
            "id": "standard",
            "name": "Standard Delivery",
            "estimatedDays": 5
        }
    },
    "orderItems": [
        {
            "uuid": "a9c8f7d6-1234-4567-8901-abcdef123456",
            "productName": "iPhone 17",
            "sku": "IP17-BLK-128",
            "price": 799.00,
            "quantity": 2,
            "total": 1598.00,
            "variant": {
                "uuid": "v1234abcd-5678-ef90-1234-abcdef567890",
                "titleEn": "iPhone 17 Black 128GB",
                "titleAr": "آيفون 17 أسود 128 جيجا"
            },
            "warehouse": {
                "uuid": "w1234abcd-5678-ef90-1234-abcdef567890",
                "name": "New York Warehouse",
                "code": "NY-01"
            }
        }
    ],
    "createdAt": "2026-04-09T10:15:30Z",
    "updatedAt": "2026-04-09T10:15:30Z"
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
    "status": "Paid",
}
```

### Response Body
```json
{
    "uuid": "f7b2a1d0-5c91-4d3e-a2f1-123456789abc",
    "status": "PENDING",
    "currency": "USD",
    "subTotal": 1598.00,
    "shippingCost": 0,
    "discount": 0,
    "total": 1598.00,
    "isPaid": false,
    "paidAt": null,
    "customerSnapshot": {
        "fullName": "John Doe",
        "email": "john.doe@example.com",
        "phoneNumber": "+1234567890",
        "streetAddress": "123 Main Street",
        "apartment": "Apt 4B",
        "city": "New York",
        "state": "NY",
        "zipCode": "10001",
        "country": "USA",
        "shippingAddress": {
            "fullName": "John Doe",
            "countryCode": "+1",
            "phoneNumber": "1234567890",
            "streetAddress": "123 Main Street",
            "apartment": "Apt 4B",
            "zipCode": "10001",
            "city": "New York",
            "state": "NY",
            "country": "USA"
        },
        "shippingOption": {
            "id": "standard",
            "name": "Standard Delivery",
            "estimatedDays": 5
        }
    },
    "orderItems": [
        {
            "uuid": "a9c8f7d6-1234-4567-8901-abcdef123456",
            "productName": "iPhone 17",
            "sku": "IP17-BLK-128",
            "price": 799.00,
            "quantity": 2,
            "total": 1598.00,
            "variant": {
                "uuid": "v1234abcd-5678-ef90-1234-abcdef567890",
                "titleEn": "iPhone 17 Black 128GB",
                "titleAr": "آيفون 17 أسود 128 جيجا"
            },
            "warehouse": {
                "uuid": "w1234abcd-5678-ef90-1234-abcdef567890",
                "name": "New York Warehouse",
                "code": "NY-01"
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
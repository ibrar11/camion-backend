Camion Referral Program REST API
================================

This documents contains the documentation of camion referral module.

Procedure to become a referral/affiliate
----------------------------------------

Follow the following steps to become an affiliate.

1. Login as a customer
2. Become an affiliate

Affliliates API (Customer)
==========================

> [!IMPORTANT]
> You must include your access token as a `Bearer` token in the Authorization header. Your must have a Customer account to create an affiliate.

Create an affiliate
-------------------

```http
POST /v1/referral/affiliates/affiliate HTTP/1.1
```

Parameter Name | Required | Type | Description
---------------|----------|------|------------
fullName | Yes | String | Your full legal name
gender | Yes | String | Your gender
nationality | Yes | String | Your nationality
bio | No | String | Your bio line

### Request Body

```json
{
    "fullName": "James",
    "gender": "Male",
    "nationality": "Qatari",
    "bio": "I am not a Qatari"
}
```

### Response Body

```json
{
    "uuid": "650c2dab-3347-4223-95be-ed322f915c53",
    "fullName": "James",
    "gender": "Male",
    "nationality": "Qatari",
    "bio": "I am not a Qatari",
    "type": "influencer",
    "status": "accepted",
    "totalCommission": {
        "amount": 0,
        "currencyCode": "qar"
    },
    "totalPaid": {
        "amount": 0,
        "currencyCode": "qar"
    },
    "remainingBalance": {
        "amount": 0,
        "currencyCode": "qar"
    },
    "couponsCreated": 17,
    "couponsUsed": 0,
    "wallet": {
        "uuid": "c807c0a1-152d-4348-a7b1-b2320eabf9fc",
        "amount": {
            "amount": 200,
            "currencyCode": "qar"
        },
        "amountPending": {
            "amount": 0,
            "currencyCode": "qar"
        },
        "amountAvailable": {
            "amount": 0,
            "currencyCode": "qar"
        }
    }
}
```

Create an influencer
--------------------

```http
POST /v1/referral/affiliates/influencer HTTP/1.1
```

Parameter Name | Required | Type | Description
---------------|----------|------|------------
fullName | Yes | String | Your full legal name
gender | Yes | String | Your gender
nationality | Yes | String | Your nationality
bio | No | String | Your bio line

### Request Body

```json
{
    "fullName": "James",
    "gender": "Male",
    "nationality": "Qatari",
    "bio": "I am not a Qatari"
}
```

### Response Body

```json
{
    "uuid": "650c2dab-3347-4223-95be-ed322f915c53",
    "fullName": "James",
    "gender": "Male",
    "nationality": "Qatari",
    "bio": "I am not a Qatari",
    "type": "affiliate",
    "status": "accepted",
    "totalCommission": {
        "amount": 0,
        "currencyCode": "qar"
    },
    "totalPaid": {
        "amount": 0,
        "currencyCode": "qar"
    },
    "remainingBalance": {
        "amount": 0,
        "currencyCode": "qar"
    },
    "couponsCreated": 17,
    "couponsUsed": 0,
    "wallet": {
        "uuid": "c807c0a1-152d-4348-a7b1-b2320eabf9fc",
        "amount": {
            "amount": 200,
            "currencyCode": "qar"
        },
        "amountPending": {
            "amount": 0,
            "currencyCode": "qar"
        },
        "amountAvailable": {
            "amount": 0,
            "currencyCode": "qar"
        }
    }
}
```

Affliliates API (User)
======================

> [!IMPORTANT]
> You must include your access token as a `Bearer` token in the Authorization header. Your must have a user account to retrieve affiliates.

Get Affiliates
--------------

```http
GET /v1/referral/affiliates HTTP/1.1
```

### Response Body

```json
[
    {
        "uuid": "650c2dab-3347-4223-95be-ed322f915c53",
        "customer": {
            "uuid": "6c90d8ef-7f9f-4dcb-8db3-9769fa771ae7",
            "fullName": "Your Name",
            "emailAddress": "your-name@your-domain.com",
            "phoneNumber": "+974 12345678",
            "role": "influencer"
        },
        "fullName": "James",
        "gender": "Male",
        "nationality": "Qatari",
        "bio": "I am not a Qatari",
        "type": "influencer",
        "status": "accepted",
        "totalCommission": {
            "amount": 0,
            "currencyCode": "qar"
        },
        "totalPaid": {
            "amount": 0,
            "currencyCode": "qar"
        },
        "remainingBalance": {
            "amount": 0,
            "currencyCode": "qar"
        },
        "couponsCreated": 18,
        "couponsUsed": 0,
        "wallet": {
            "uuid": "c807c0a1-152d-4348-a7b1-b2320eabf9fc",
            "amount": {
                "amount": 200,
                "currencyCode": "qar"
            },
            "amountPending": {
                "amount": 0,
                "currencyCode": "qar"
            },
            "amountAvailable": {
                "amount": 0,
                "currencyCode": "qar"
            }
        }
    }
]
```

Get Affiliates By Type
----------------------

```http
GET /v1/referral/affiliates?filters={"type":"influencer"} HTTP/1.1
```

### Response Body

```json
[
    {
        "uuid": "650c2dab-3347-4223-95be-ed322f915c53",
        "customer": {
            "uuid": "6c90d8ef-7f9f-4dcb-8db3-9769fa771ae7",
            "fullName": "Your Name",
            "emailAddress": "your-name@your-domain.com",
            "phoneNumber": "+974 12345678",
            "role": "influencer"
        },
        "fullName": "James",
        "gender": "Male",
        "nationality": "Qatari",
        "bio": "I am not a Qatari",
        "type": "influencer",
        "status": "accepted",
        "totalCommission": {
            "amount": 0,
            "currencyCode": "qar"
        },
        "totalPaid": {
            "amount": 0,
            "currencyCode": "qar"
        },
        "remainingBalance": {
            "amount": 0,
            "currencyCode": "qar"
        },
        "couponsCreated": 18,
        "couponsUsed": 0,
        "wallet": {
            "uuid": "c807c0a1-152d-4348-a7b1-b2320eabf9fc",
            "amount": {
                "amount": 200,
                "currencyCode": "qar"
            },
            "amountPending": {
                "amount": 0,
                "currencyCode": "qar"
            },
            "amountAvailable": {
                "amount": 0,
                "currencyCode": "qar"
            }
        }
    }
]
```

Get Affliliate
--------------

```http
GET /v1/referral/affiliates/<affiliate-uuid> HTTP/1.1
```

### Response Body

```json
{
    "uuid": "650c2dab-3347-4223-95be-ed322f915c53",
    "customer": {
        "uuid": "6c90d8ef-7f9f-4dcb-8db3-9769fa771ae7",
        "fullName": "Your Name",
        "emailAddress": "your-name@your-domain.com",
        "phoneNumber": "+974 12345678",
        "role": "influencer"
    },
    "fullName": "James",
    "gender": "Male",
    "nationality": "Qatari",
    "bio": "I am not a Qatari",
    "type": "influencer",
    "status": "accepted",
    "totalCommission": {
        "amount": 0,
        "currencyCode": "qar"
    },
    "totalPaid": {
        "amount": 0,
        "currencyCode": "qar"
    },
    "remainingBalance": {
        "amount": 0,
        "currencyCode": "qar"
    },
    "couponsCreated": 18,
    "couponsUsed": 0,
    "wallet": {
        "uuid": "c807c0a1-152d-4348-a7b1-b2320eabf9fc",
        "amount": {
            "amount": 200,
            "currencyCode": "qar"
        },
        "amountPending": {
            "amount": 0,
            "currencyCode": "qar"
        },
        "amountAvailable": {
            "amount": 0,
            "currencyCode": "qar"
        }
    }
}
```

Update Affiliate
----------------

```http
PUT /v1/referral/affiliates/<affiliate-uuid> HTTP/1.1
```

### Request Body

```json
{
    "fullName": "James",
    "gender": "Male",
    "nationality": "Saudi",
    "bio": "I am a Saudi"
}
```

### Response Body

```json
{
    "uuid": "650c2dab-3347-4223-95be-ed322f915c53",
    "fullName": "James",
    "gender": "Male",
    "nationality": "Saudi",
    "bio": "I am a Saudi",
    "type": "influencer",
    "status": "accepted",
    "totalCommission": {
        "amount": 0,
        "currencyCode": "qar"
    },
    "totalPaid": {
        "amount": 0,
        "currencyCode": "qar"
    },
    "remainingBalance": {
        "amount": 0,
        "currencyCode": "qar"
    },
    "couponsCreated": 18,
    "couponsUsed": 0
}
```

Update Affiliate Status
-----------------------

```http
PATCH /v1/referral/affiliates/<affiliate-uuid>/status HTTP/1.1
```

### Request Body

```json
{
    "status": "rejected"
}
```

### Response Body

```json
{
    "uuid": "650c2dab-3347-4223-95be-ed322f915c53",
    "fullName": "James",
    "gender": "Male",
    "nationality": "Saudi",
    "bio": "I am a Saudi",
    "type": "influencer",
    "status": "rejected",
    "totalCommission": {
        "amount": 0,
        "currencyCode": "qar"
    },
    "totalPaid": {
        "amount": 0,
        "currencyCode": "qar"
    },
    "remainingBalance": {
        "amount": 0,
        "currencyCode": "qar"
    },
    "couponsCreated": 18,
    "couponsUsed": 0
}
```

Update Affiliate Type
---------------------

```http
PATCH /v1/referral/affiliates/<Affiliate-uuid>/type HTTP/1.1
```

### Request Body

```json
{
    "type": "affiliate"
}
```

### Response Body

```json
{
    "uuid": "650c2dab-3347-4223-95be-ed322f915c53",
    "fullName": "James",
    "gender": "Male",
    "nationality": "Saudi",
    "bio": "I am a Saudi",
    "type": "affiliate",
    "status": "rejected",
    "totalCommission": {
        "amount": 0,
        "currencyCode": "qar"
    },
    "totalPaid": {
        "amount": 0,
        "currencyCode": "qar"
    },
    "remainingBalance": {
        "amount": 0,
        "currencyCode": "qar"
    },
    "couponsCreated": 18,
    "couponsUsed": 0
}
```

Create Affiliate Coupon
-----------------------

```http
POST /v1/referral/affiliates/<affiliate-uuid>/coupons
```

### Request Body

```json
{
    "code": "summer10",
    "discountPercentage": 10,
    "expiresAt": "2029-12-31"
}
```

### Response Body

```json
{
    "uuid": "1d31ab12-8bfb-4a72-a143-d33feae5b987",
    "affiliate": {
        "uuid": "688c6cb4-6e27-4fca-a417-bc11d401cdc4",
        "fullName": "Hamza Affiliator",
        "gender": "male",
        "nationality": "Qatari",
        "bio": "this is my description",
        "type": "influencer",
        "status": "accepted",
        "totalCommission": {
            "amount": 12,
            "currencyCode": "qar"
        },
        "totalPaid": {
            "amount": 0,
            "currencyCode": "qar"
        },
        "remainingBalance": {
            "amount": 12,
            "currencyCode": "qar"
        },
        "couponsCreated": 7,
        "couponsUsed": 3,
        "createdAt": "2026-05-09T08:57:50.144Z"
    },
    "code": "summer10",
    "discountPercentage": "10",
    "ordersCount": 0,
    "totalSales": {
        "amount": 0,
        "currencyCode": "usd"
    },
    "totalCommission": {
        "amount": 0,
        "currencyCode": "usd"
    },
    "expiresAt": "2029-12-31T00:00:00.000Z",
    "createdAt": "2026-05-25T12:30:12.023Z"
}
```


Delete Affiliate
----------------

```http
DELETE /v1/referral/affiliates/<affiliate-uuid> HTTP/1.1
```

Wallets (User)
==============

> [!IMPORTANT]
> You must include your access token as a `Bearer` token in the Authorization header. Your must have a user account to retrieve create and retrieve transactions.

Get Wallets
-----------

```http
GET /v1/referral/wallets HTTP/1.1
```

### Response Body

```json
[
    {
        "uuid": "e5e3889d-d800-4ab3-8f6b-065c9cb5612d",
        "amount": {
            "amount": 0,
            "currencyCode": "qar"
        },
        "amountPending": {
            "amount": 0,
            "currencyCode": "qar"
        },
        "amountAvailable": {
            "amount": 0,
            "currencyCode": "qar"
        }
    }
]
```

Get Wallets By Affiliate
------------------------

```http
GET /v1/referral/wallets?filters={"affiliateUUID":"<affiliate-uuid>"} HTTP/1.1
```

### Response Body

```json
[
    {
        "uuid": "af2d76c2-8912-4143-8b04-b3131669600a",
        "amount": {
            "amount": 121,
            "currencyCode": "qar"
        },
        "amountPending": {
            "amount": 0,
            "currencyCode": "qar"
        },
        "amountAvailable": {
            "amount": 121,
            "currencyCode": "qar"
        }
    }
]
```

Get Wallet
----------

```http
GET /v1/referral/wallets/<wallet-uuid> HTTP/1.1
```

### Response Body

```json
{
    "uuid": "af2d76c2-8912-4143-8b04-b3131669600a",
    "amount": {
        "amount": 121,
        "currencyCode": "qar"
    },
    "amountPending": {
        "amount": 0,
        "currencyCode": "qar"
    },
    "amountAvailable": {
        "amount": 121,
        "currencyCode": "qar"
    }
}
```


Transactions (User)
===================

> [!IMPORTANT]
> You must include your access token as a `Bearer` token in the Authorization header. Your must have a user account to retrieve create and retrieve transactions.

Create Transaction
------------------

```http
POST /v1/referral/wallets/<wallet-uuid>/transactions HTTP/1.1
```

Parameter Name | Required | Type | Description
---------------|----------|------|------------
amount | Yes | String | Your full legal name
currencyCode | Yes | String | Your gender
type | Yes | String | Your nationality
description | No | String | Your bio line

### Request Body

```json
{
    "amount": 100,
    "currencyCode": "qar",
    "type": "credit",
    "description": "Your commission for the month of July"
}
```

### Response Body

```json
{
    "uuid": "32a41b95-25dd-4024-beea-5858633d034a",
    "wallet": {
        "uuid": "c807c0a1-152d-4348-a7b1-b2320eabf9fc",
        "amount": {
            "amount": 300,
            "currencyCode": "qar"
        },
        "amountPending": {
            "amount": 0,
            "currencyCode": "qar"
        },
        "amountAvailable": {
            "amount": 0,
            "currencyCode": "qar"
        }
    },
    "amount": {
        "amount": 100,
        "currencyCode": "qar"
    },
    "type": "credit",
    "description": "Your commission for the month of July"
}
```

Get Transactions
----------------

```http
GET /v1/referral/wallets/<wallet-uuid>/transactions HTTP/1.1
```

### Response Body

```json
[
    {
        "uuid": "32a41b95-25dd-4024-beea-5858633d034a",
        "amount": {
            "amount": 100,
            "currencyCode": "qar"
        },
        "type": "credit",
        "description": "Your commission for the month of July"
    },
    {
        "uuid": "e883c151-de96-4ba3-b294-24db6e75661d",
        "amount": {
            "amount": 100,
            "currencyCode": "qar"
        },
        "type": "credit",
        "description": "Your commission for the month of July"
    },
    {
        "uuid": "505f3585-fe14-4d1b-b12d-85c9f822f8ee",
        "amount": {
            "amount": 100,
            "currencyCode": "qar"
        },
        "type": "credit",
        "description": "Your commission for the month of July"
    },
    {
        "uuid": "34995443-d0ff-4c94-b7ee-975850a85a00",
        "amount": {
            "amount": 100,
            "currencyCode": "qar"
        },
        "type": "debit",
        "description": "Reversed transaction # 804f8446-cb10-4997-bfac-d7e0487aba93"
    },
    {
        "uuid": "804f8446-cb10-4997-bfac-d7e0487aba93",
        "amount": {
            "amount": 100,
            "currencyCode": "qar"
        },
        "type": "credit",
        "description": "Your commission for the month of July"
    }
]
```

Get Transaction
---------------

```http
GET /v1/referral/wallets/<wallet-uuid>/transactions/<transaction-uuid> HTTP/1.1
```

### Response Body

```json
{
    "uuid": "34995443-d0ff-4c94-b7ee-975850a85a00",
    "amount": {
        "amount": 100,
        "currencyCode": "qar"
    },
    "type": "debit",
    "description": "Reversed transaction # 804f8446-cb10-4997-bfac-d7e0487aba93"
}
```

Reverse Transaction
-------------------

```http
PATCH /v1/referral/wallets/<wallet-uuid>/transactions/<transaction-uuid>/reverse HTTP/1.1
```

### Response Body

```json
{
    "uuid": "72b2d69c-aa4b-44ff-b61e-920c7947e909",
    "wallet": {
        "uuid": "c807c0a1-152d-4348-a7b1-b2320eabf9fc",
        "amount": {
            "amount": 200,
            "currencyCode": "qar"
        },
        "amountPending": {
            "amount": 0,
            "currencyCode": "qar"
        },
        "amountAvailable": {
            "amount": 0,
            "currencyCode": "qar"
        }
    },
    "amount": {
        "amount": 100,
        "currencyCode": "qar"
    },
    "type": "debit",
    "description": "Reversed transaction # 804f8446-cb10-4997-bfac-d7e0487aba93"
}
```

Transactions (Customer)
=======================

> [!IMPORTANT]
> You must include your access token as a `Bearer` token in the Authorization header. Your must have a Customer and affiliate account to retrieve your transactions.

Get Transactions
----------------

```http
GET /v1/referral/wallets/c807c0a1-152d-4348-a7b1-b2320eabf9fc/transactions HTTP/1.1
```

### Response Body

```json
[
    {
        "uuid": "804f8446-cb10-4997-bfac-d7e0487aba93",
        "amount": {
            "amount": 100,
            "currencyCode": "qar"
        },
        "type": "credit",
        "description": "Your commission for the month of July"
    },
    {
        "uuid": "34995443-d0ff-4c94-b7ee-975850a85a00",
        "amount": {
            "amount": 100,
            "currencyCode": "qar"
        },
        "type": "debit",
        "description": "Reversed transaction # 804f8446-cb10-4997-bfac-d7e0487aba93"
    },
    {
        "uuid": "505f3585-fe14-4d1b-b12d-85c9f822f8ee",
        "amount": {
            "amount": 100,
            "currencyCode": "qar"
        },
        "type": "credit",
        "description": "Your commission for the month of July"
    },
    {
        "uuid": "e883c151-de96-4ba3-b294-24db6e75661d",
        "amount": {
            "amount": 100,
            "currencyCode": "qar"
        },
        "type": "credit",
        "description": "Your commission for the month of July"
    },
    {
        "uuid": "32a41b95-25dd-4024-beea-5858633d034a",
        "amount": {
            "amount": 100,
            "currencyCode": "qar"
        },
        "type": "credit",
        "description": "Your commission for the month of July"
    },
    {
        "uuid": "72b2d69c-aa4b-44ff-b61e-920c7947e909",
        "amount": {
            "amount": 100,
            "currencyCode": "qar"
        },
        "type": "debit",
        "description": "Reversed transaction # 804f8446-cb10-4997-bfac-d7e0487aba93"
    }
]
```

Coupons (Customer)
==================

> [!IMPORTANT]
> You must include your access token as a `Bearer` token in the Authorization header. Your must have a Customer and affiliate account to create and retrieve your coupons.

Create Coupon
-------------

```http
POST /v1/referral/coupons HTTP/1.1
```

Parameter Name | Required | Type | Description
---------------|----------|------|------------
code | Yes | String | Your coupon code
discountPercentage | Yes | String | The discount percentage against the coupon
expiresAt | Yes | String | The expiry code of the coupon, The date must be in `YYYY-MM-DD` format.

### Request Body

```json
{
    "code": "james10",
    "discountPercentage": 10,
    "expiresAt": "2026-12-31"
}
```

### Response Body

```json
{
    "uuid": "32c60164-f17f-4a79-8388-2133e5a4f5e9",
    "affiliate": {
        "uuid": "650c2dab-3347-4223-95be-ed322f915c53",
        "fullName": "James",
        "gender": "Male",
        "nationality": "Qatari",
        "bio": "I am not a Qatari",
        "type": "influencer",
        "status": "accepted",
        "totalCommission": {
            "amount": 0,
            "currencyCode": "qar"
        },
        "totalPaid": {
            "amount": 0,
            "currencyCode": "qar"
        },
        "remainingBalance": {
            "amount": 0,
            "currencyCode": "qar"
        },
        "couponsCreated": 18,
        "couponsUsed": 0
    },
    "code": "james10",
    "discountPercentage": "10",
    "expiresAt": "2026-12-31T00:00:00.000Z"
}
```

Get Coupons
-----------

```http
GET /v1/referral/coupons HTTP/1.1
```

### Response Body

```json
[
    {
        "uuid": "a7f3c97b-0f3a-4da3-89b9-3820b526742a",
        "affiliate": {
            "uuid": "64077cd1-0c4e-47bb-a125-76fff8445971",
            "customer": {
                "uuid": "c439ae78-1132-464c-9940-bf240e1a8f53",
                "fullName": "jimmy",
                "emailAddress": "jimmy@gmail.com",
                "phoneNumber": null,
                "role": "influencer",
                "unreadNotificationCount": 0,
                "ordersCount": 0,
                "cartItemsCount": 0
            },
            "fullName": "jimmy",
            "gender": "male",
            "nationality": "american",
            "bio": "this is my bio",
            "type": "influencer",
            "status": "accepted",
            "totalCommission": {
                "amount": 0,
                "currencyCode": "qar"
            },
            "totalPaid": {
                "amount": 0,
                "currencyCode": "qar"
            },
            "remainingBalance": {
                "amount": 0,
                "currencyCode": "qar"
            },
            "couponsCreated": 1,
            "couponsUsed": 0,
            "createdAt": "2026-06-01T23:12:14.030Z"
        },
        "code": "ffa",
        "discountPercentage": "10",
        "ordersCount": 0,
        "totalSales": {
            "amount": 0,
            "currencyCode": "usd"
        },
        "totalCommission": {
            "amount": 0,
            "currencyCode": "usd"
        },
        "expiresAt": "2026-06-02T00:00:00.000Z",
        "createdAt": "2026-06-01T23:17:02.551Z"
    }
]
```

Get Coupons By Affiliate
------------------------

```http
GET /v1/referral/coupons?filters={"affiliateUUID":"<affiliate-uuid>"}
```

### Response Body

```json
[
    {
        "uuid": "e002ca52-88fa-4788-a621-4a511b1e795c",
        "code": "teat",
        "discountPercentage": "9",
        "ordersCount": 4,
        "totalSales": {
            "amount": 260,
            "currencyCode": "qar"
        },
        "totalCommission": {
            "amount": 23,
            "currencyCode": "qar"
        },
        "expiresAt": "2026-05-31T00:00:00.000Z",
        "createdAt": "2026-05-20T05:55:40.802Z"
    }
]
```


Get Coupon
----------

```http
GET /v1/referral/coupons/<coupon-uuid> HTTP/1.1
```

### Response Body

```json
{
    "uuid": "32c60164-f17f-4a79-8388-2133e5a4f5e9",
    "affiliate": {
        "uuid": "650c2dab-3347-4223-95be-ed322f915c53",
        "customer": {
            "uuid": "6c90d8ef-7f9f-4dcb-8db3-9769fa771ae7",
            "fullName": "Your Name",
            "emailAddress": "your-name@your-domain.com",
            "phoneNumber": "+974 12345678",
            "role": "influencer"
        },
        "fullName": "James",
        "gender": "Male",
        "nationality": "Saudi",
        "bio": "I am a Saudi",
        "type": "affiliate",
        "status": "rejected",
        "totalCommission": {
            "amount": 0,
            "currencyCode": "qar"
        },
        "totalPaid": {
            "amount": 0,
            "currencyCode": "qar"
        },
        "remainingBalance": {
            "amount": 0,
            "currencyCode": "qar"
        },
        "couponsCreated": 18,
        "couponsUsed": 0
    },
    "code": "james10",
    "discountPercentage": "10.4",
    "expiresAt": "2026-12-31T00:00:00.000Z"
}
```

Update Coupon
-------------

```http
PUT /v1/referral/coupons/<coupon-uuid> HTTP/1.1
```

Parameter Name | Required | Type | Description
---------------|----------|------|------------
code | Yes | String | Your coupon code
discountPercentage | Yes | String | The discount percentage against the coupon
expiresAt | Yes | String | The expiry code of the coupon

### Request Body

```json
{
    "code": "james12",
    "discountPercentage": 4,
    "expiresAt": "2026-12-31"
}
```

### Response Body

```json
{
    "uuid": "32c60164-f17f-4a79-8388-2133e5a4f5e9",
    "affiliate": {
        "uuid": "650c2dab-3347-4223-95be-ed322f915c53",
        "customer": {
            "uuid": "6c90d8ef-7f9f-4dcb-8db3-9769fa771ae7",
            "fullName": "Your Name",
            "emailAddress": "your-name@your-domain.com",
            "phoneNumber": "+974 12345678",
            "role": "influencer"
        },
        "fullName": "James",
        "gender": "Male",
        "nationality": "Saudi",
        "bio": "I am a Saudi",
        "type": "affiliate",
        "status": "rejected",
        "totalCommission": {
            "amount": 0,
            "currencyCode": "qar"
        },
        "totalPaid": {
            "amount": 0,
            "currencyCode": "qar"
        },
        "remainingBalance": {
            "amount": 0,
            "currencyCode": "qar"
        },
        "couponsCreated": 18,
        "couponsUsed": 0
    },
    "code": "james12",
    "discountPercentage": 4,
    "expiresAt": "2026-12-31T00:00:00.000Z"
}
```

Delete Coupon
-------------

```http
DELETE /v1/referral/coupons/<coupon-uuid> HTTP/1.1
```

Coupons (User)
==============

> [!IMPORTANT]
> You must include your access token as a `Bearer` token in the Authorization header. Your must have a user account to retrieve coupons.

Get Coupons
-----------

```http
GET /v1/referral/coupons HTTP/1.1
```

### Response Body

```json
[
    {
        "uuid": "32c60164-f17f-4a79-8388-2133e5a4f5e9",
        "affiliate": {
            "uuid": "650c2dab-3347-4223-95be-ed322f915c53",
            "customer": {
                "uuid": "6c90d8ef-7f9f-4dcb-8db3-9769fa771ae7",
                "fullName": "Your Name",
                "emailAddress": "your-name@your-domain.com",
                "phoneNumber": "+974 12345678",
                "role": "influencer"
            },
            "fullName": "James",
            "gender": "Male",
            "nationality": "Saudi",
            "bio": "I am a Saudi",
            "type": "affiliate",
            "status": "rejected",
            "totalCommission": {
                "amount": 0,
                "currencyCode": "qar"
            },
            "totalPaid": {
                "amount": 0,
                "currencyCode": "qar"
            },
            "remainingBalance": {
                "amount": 0,
                "currencyCode": "qar"
            },
            "couponsCreated": 18,
            "couponsUsed": 0
        },
        "code": "james12",
        "discountPercentage": "4",
        "expiresAt": "2026-12-31T00:00:00.000Z"
    }
]
```

Get Coupon
----------

```http
GET /v1/referral/coupons/<coupon-uuid> HTTP/1.1
```

### Response Body

```json
{
    "uuid": "32c60164-f17f-4a79-8388-2133e5a4f5e9",
    "code": "james12",
    "discountPercentage": "4",
    "expiresAt": "2026-12-31T00:00:00.000Z"
}
```

Delete Coupon
-------------

```http
DELETE /v1/referral/coupons/<coupon-uuid> HTTP/1.1
```

Bank Account (Customer)
=======================

> [!IMPORTANT]
> You must include your access token as a `Bearer` token in the Authorization header. Your must have a Customer and affiliate account to create and retrieve your bank accounts.

Create Bank Account
-------------------

```http
POST /v1/referral/bank-accounts HTTP/1.1
```

Parameter Name | Required | Type | Description
---------------|----------|------|------------
bankName | Yes | String | Your bank's full name
accountHolderName | Yes | String | Account holder's name
accountNumber | Yes | String | Your bank account number
iban | Yes | String | Your bank account's iban
swiftCode | Yes | String | The SWIFT code of your bank

### Request Body

```json
{
    "bankName": "Habib Bank Limited",
    "accountHolderName": "James Cann",
    "accountNumber": "1993 9899 3948 3948 12392",
    "iban": "PKHBLL199398993948394812394",
    "swiftCode": "PKHBLL1"
}
```

### Response Body

```json
{
    "uuid": "0857e105-675c-47d9-a134-c256814ca132",
    "affiliate": {
        "uuid": "650c2dab-3347-4223-95be-ed322f915c53",
        "fullName": "James",
        "gender": "Male",
        "nationality": "Saudi",
        "bio": "I am a Saudi",
        "type": "affiliate",
        "status": "rejected",
        "totalCommission": {
            "amount": 0,
            "currencyCode": "qar"
        },
        "totalPaid": {
            "amount": 0,
            "currencyCode": "qar"
        },
        "remainingBalance": {
            "amount": 0,
            "currencyCode": "qar"
        },
        "couponsCreated": 18,
        "couponsUsed": 0
    },
    "bankName": "Habib Bank Limited",
    "accountHolderName": "James Cann",
    "accountNumber": "1993 9899 3948 3948 12394",
    "iban": "PKHBLL199398993948394812394",
    "swiftCode": "PKHBLL1",
    "isDefault": true
}
```

Get Bank Accounts
-----------------

```http
GET /v1/referral/bank-accounts HTTP/1.1
```

### Response Body

```json
[
    {
        "uuid": "0857e105-675c-47d9-a134-c256814ca132",
        "bankName": "Habib Bank Limited",
        "accountHolderName": "James Cann",
        "accountNumber": "1993 9899 3948 3948 12398",
        "iban": "PKHBLL199398993948394812394",
        "swiftCode": "PKHBLL1",
        "isDefault": true
    },
    {
        "uuid": "15aca348-0ef6-49ca-85ac-6917ffaef677",
        "bankName": "Habib Bank Limited",
        "accountHolderName": "James Cann",
        "accountNumber": "1993 9899 3948 3948 12392",
        "iban": "PKHBLL199398993948394812394",
        "swiftCode": "PKHBLL1",
        "isDefault": false
    },
    {
        "uuid": "61b690d6-de05-497d-bef9-ca2be1b75476",
        "bankName": "Habib Bank Limited",
        "accountHolderName": "James Cann",
        "accountNumber": "1993 9899 3948 3948 12394",
        "iban": "PKHBLL199398993948394812394",
        "swiftCode": "PKHBLL1",
        "isDefault": false
    },
    {
        "uuid": "cc1f48c9-4d77-4422-be4d-d26e92c76cbc",
        "bankName": "Habib Bank Limited",
        "accountHolderName": "James Cann",
        "accountNumber": "1993 9899 3948 3948 12394",
        "iban": "PKHBLL199398993948394812394",
        "swiftCode": "PKHBLL1",
        "isDefault": false
    }
]
```

Get Bank Account
----------------

```http
GET /v1/referral/bank-accounts/<bank-account-uuid> HTTP/1.1
```

### Response Body

```json
{
    "uuid": "61b690d6-de05-497d-bef9-ca2be1b75476",
    "affiliate": {
        "uuid": "650c2dab-3347-4223-95be-ed322f915c53",
        "customer": {
            "uuid": "6c90d8ef-7f9f-4dcb-8db3-9769fa771ae7",
            "fullName": "Your Name",
            "emailAddress": "your-name@your-domain.com",
            "phoneNumber": "+974 12345678",
            "role": "influencer"
        },
        "fullName": "James",
        "gender": "Male",
        "nationality": "Saudi",
        "bio": "I am a Saudi",
        "type": "affiliate",
        "status": "rejected",
        "totalCommission": {
            "amount": 0,
            "currencyCode": "qar"
        },
        "totalPaid": {
            "amount": 0,
            "currencyCode": "qar"
        },
        "remainingBalance": {
            "amount": 0,
            "currencyCode": "qar"
        },
        "couponsCreated": 18,
        "couponsUsed": 0
    },
    "bankName": "Habib Bank Limited",
    "accountHolderName": "James Cann",
    "accountNumber": "1993 9899 3948 3948 12394",
    "iban": "PKHBLL199398993948394812394",
    "swiftCode": "PKHBLL1",
    "isDefault": false
}
```

Update Bank Account
-------------------

```http
PUT /v1/referral/bank-accounts/<bank-account-uuid> HTTP/1.1
```

Parameter Name | Required | Type | Description
---------------|----------|------|------------
bankName | Yes | String | Your bank's full name
accountHolderName | Yes | String | Account holder's name
accountNumber | Yes | String | Your bank account number
iban | Yes | String | Your bank account's iban
swiftCode | Yes | String | The SWIFT code of your bank

### Request Body

```json
{
    "bankName": "Habib Bank Limited",
    "accountHolderName": "James Cann",
    "accountNumber": "1993 9899 3948 3948 12394",
    "iban": "PKHBLL199398993948394812394",
    "swiftCode": "PKHBLL1"
}
```

### Response Body

```json
{
    "uuid": "cc1f48c9-4d77-4422-be4d-d26e92c76cbc",
    "affiliate": {
        "uuid": "650c2dab-3347-4223-95be-ed322f915c53",
        "customer": {
            "uuid": "6c90d8ef-7f9f-4dcb-8db3-9769fa771ae7",
            "fullName": "Your Name",
            "emailAddress": "your-name@your-domain.com",
            "phoneNumber": "+974 12345678",
            "role": "influencer"
        },
        "fullName": "James",
        "gender": "Male",
        "nationality": "Saudi",
        "bio": "I am a Saudi",
        "type": "affiliate",
        "status": "rejected",
        "totalCommission": {
            "amount": 0,
            "currencyCode": "qar"
        },
        "totalPaid": {
            "amount": 0,
            "currencyCode": "qar"
        },
        "remainingBalance": {
            "amount": 0,
            "currencyCode": "qar"
        },
        "couponsCreated": 18,
        "couponsUsed": 0
    },
    "bankName": "Habib Bank Limited",
    "accountHolderName": "James Cann",
    "accountNumber": "1993 9899 3948 3948 12394",
    "iban": "PKHBLL199398993948394812394",
    "swiftCode": "PKHBLL1",
    "isDefault": false
}
```

Patch Bank Account as Default
-----------------------------

```http
PATCH /v1/referral/bank-accounts/<bank-account-uuid> HTTP/1.1
```

### Request Body

```json
{
    "isDefault": true
}
```

### Response Body

```json
{
    "uuid": "cc1f48c9-4d77-4422-be4d-d26e92c76cbc",
    "affiliate": {
        "uuid": "650c2dab-3347-4223-95be-ed322f915c53",
        "customer": {
            "uuid": "6c90d8ef-7f9f-4dcb-8db3-9769fa771ae7",
            "fullName": "Your Name",
            "emailAddress": "your-name@your-domain.com",
            "phoneNumber": "+974 12345678",
            "role": "influencer"
        },
        "fullName": "James",
        "gender": "Male",
        "nationality": "Saudi",
        "bio": "I am a Saudi",
        "type": "affiliate",
        "status": "rejected",
        "totalCommission": {
            "amount": 0,
            "currencyCode": "qar"
        },
        "totalPaid": {
            "amount": 0,
            "currencyCode": "qar"
        },
        "remainingBalance": {
            "amount": 0,
            "currencyCode": "qar"
        },
        "couponsCreated": 18,
        "couponsUsed": 0
    },
    "bankName": "Habib Bank Limited",
    "accountHolderName": "James Cann",
    "accountNumber": "1993 9899 3948 3948 12394",
    "iban": "PKHBLL199398993948394812394",
    "swiftCode": "PKHBLL1",
    "isDefault": true
}
```

Bank Account (User)
===================

> [!IMPORTANT]
> You must include your access token as a `Bearer` token in the Authorization header. Your must have a user account to retrieve bank accounts.

Get Bank Accounts
-----------------

```http
GET /v1/referral/bank-accounts HTTP/1.1
```

### Response Body

```json
[
    {
        "uuid": "0857e105-675c-47d9-a134-c256814ca132",
        "affiliate": {
            "uuid": "650c2dab-3347-4223-95be-ed322f915c53",
            "customer": {
                "uuid": "6c90d8ef-7f9f-4dcb-8db3-9769fa771ae7",
                "fullName": "Your Name",
                "emailAddress": "your-name@your-domain.com",
                "phoneNumber": "+974 12345678",
                "role": "influencer"
            },
            "fullName": "James",
            "gender": "Male",
            "nationality": "Saudi",
            "bio": "I am a Saudi",
            "type": "affiliate",
            "status": "rejected",
            "totalCommission": {
                "amount": 0,
                "currencyCode": "qar"
            },
            "totalPaid": {
                "amount": 0,
                "currencyCode": "qar"
            },
            "remainingBalance": {
                "amount": 0,
                "currencyCode": "qar"
            },
            "couponsCreated": 18,
            "couponsUsed": 0
        },
        "bankName": "Habib Bank Limited",
        "accountHolderName": "James Cann",
        "accountNumber": "1993 9899 3948 3948 12398",
        "iban": "PKHBLL199398993948394812394",
        "swiftCode": "PKHBLL1",
        "isDefault": false
    },
    {
        "uuid": "15aca348-0ef6-49ca-85ac-6917ffaef677",
        "affiliate": {
            "uuid": "650c2dab-3347-4223-95be-ed322f915c53",
            "customer": {
                "uuid": "6c90d8ef-7f9f-4dcb-8db3-9769fa771ae7",
                "fullName": "Your Name",
                "emailAddress": "your-name@your-domain.com",
                "phoneNumber": "+974 12345678",
                "role": "influencer"
            },
            "fullName": "James",
            "gender": "Male",
            "nationality": "Saudi",
            "bio": "I am a Saudi",
            "type": "affiliate",
            "status": "rejected",
            "totalCommission": {
                "amount": 0,
                "currencyCode": "qar"
            },
            "totalPaid": {
                "amount": 0,
                "currencyCode": "qar"
            },
            "remainingBalance": {
                "amount": 0,
                "currencyCode": "qar"
            },
            "couponsCreated": 18,
            "couponsUsed": 0
        },
        "bankName": "Habib Bank Limited",
        "accountHolderName": "James Cann",
        "accountNumber": "1993 9899 3948 3948 12392",
        "iban": "PKHBLL199398993948394812394",
        "swiftCode": "PKHBLL1",
        "isDefault": false
    },
    {
        "uuid": "61b690d6-de05-497d-bef9-ca2be1b75476",
        "affiliate": {
            "uuid": "650c2dab-3347-4223-95be-ed322f915c53",
            "customer": {
                "uuid": "6c90d8ef-7f9f-4dcb-8db3-9769fa771ae7",
                "fullName": "Your Name",
                "emailAddress": "your-name@your-domain.com",
                "phoneNumber": "+974 12345678",
                "role": "influencer"
            },
            "fullName": "James",
            "gender": "Male",
            "nationality": "Saudi",
            "bio": "I am a Saudi",
            "type": "affiliate",
            "status": "rejected",
            "totalCommission": {
                "amount": 0,
                "currencyCode": "qar"
            },
            "totalPaid": {
                "amount": 0,
                "currencyCode": "qar"
            },
            "remainingBalance": {
                "amount": 0,
                "currencyCode": "qar"
            },
            "couponsCreated": 18,
            "couponsUsed": 0
        },
        "bankName": "Habib Bank Limited",
        "accountHolderName": "James Cann",
        "accountNumber": "1993 9899 3948 3948 12394",
        "iban": "PKHBLL199398993948394812394",
        "swiftCode": "PKHBLL1",
        "isDefault": false
    },
    {
        "uuid": "cc1f48c9-4d77-4422-be4d-d26e92c76cbc",
        "affiliate": {
            "uuid": "650c2dab-3347-4223-95be-ed322f915c53",
            "customer": {
                "uuid": "6c90d8ef-7f9f-4dcb-8db3-9769fa771ae7",
                "fullName": "Your Name",
                "emailAddress": "your-name@your-domain.com",
                "phoneNumber": "+974 12345678",
                "role": "influencer"
            },
            "fullName": "James",
            "gender": "Male",
            "nationality": "Saudi",
            "bio": "I am a Saudi",
            "type": "affiliate",
            "status": "rejected",
            "totalCommission": {
                "amount": 0,
                "currencyCode": "qar"
            },
            "totalPaid": {
                "amount": 0,
                "currencyCode": "qar"
            },
            "remainingBalance": {
                "amount": 0,
                "currencyCode": "qar"
            },
            "couponsCreated": 18,
            "couponsUsed": 0
        },
        "bankName": "Habib Bank Limited",
        "accountHolderName": "James Cann",
        "accountNumber": "1993 9899 3948 3948 12394",
        "iban": "PKHBLL199398993948394812394",
        "swiftCode": "PKHBLL1",
        "isDefault": true
    }
]
```

Global Coupons
==============

| Discount Type | Description |
|---|---|
| percentage | The coupon applies a percentage of the coupon. |
| fixed | The coupon applies a fixed discount at the order. |

Create Global Coupon
--------------------

> [!IMPORTANT]
> Required roles: `SuperAdmin`, `Admin`, `Manager`

```http
POST /v1/referral/global-coupons HTTP/1.1
```

| Format | Description |
|---|---|
| code | The unique coupon code |
| discountType | Discount type on the coupon |
| discountPercentage | Discount percentage. Applicable when `discountType` is 'percentage' |
| discountValue | Discount value. Applicable when `discountType` is 'fixed' |
| usageLimit | The number of times a coupon is applicable. |
| timesUsed | The number of times a coupon has been used. |
| expiresAt | The expiry date of the coupon |

### Request Body

```json
{
    "code": "JAMES89",
    "discountType": "fixed",
    "discountPercentage": 99,
    "discountValue": 100,
    "usageLimit": 1,
    "expiresAt": "2029-12-31"
}
```

### Response Body

```json
{
    "uuid": "cdc4c904-0dd1-495f-91a4-5e57ae09007d",
    "code": "JAMES89",
    "discountType": "fixed",
    "discountPercentage": "99",
    "discountValue": 100,
    "usageLimit": 1,
    "ordersCount": 0,
    "totalSales": {
        "amount": 0,
        "currencyCode": "qar"
    },
    "totalCommission": {
        "amount": 0,
        "currencyCode": "qar"
    },
    "expiresAt": "2029-12-31T00:00:00.000Z",
    "updatedAt": "2026-06-10T11:43:36.277Z",
    "createdAt": "2026-06-10T11:43:36.277Z"
}
```

Get Global Coupons
------------------

> [!IMPORTANT]
> Required roles: `SuperAdmin`, `Admin`, `Manager`

```http
GET /v1/referral/global-coupons HTTP/1.1
```

### Response Body

```json
[
    {
        "uuid": "cdc4c904-0dd1-495f-91a4-5e57ae09007d",
        "code": "JAMES89",
        "discountType": "fixed",
        "discountPercentage": "99",
        "discountValue": 100,
        "usageLimit": 1,
        "ordersCount": 0,
        "totalSales": {
            "amount": 0,
            "currencyCode": "qar"
        },
        "totalCommission": {
            "amount": 0,
            "currencyCode": "qar"
        },
        "expiresAt": "2029-12-31T00:00:00.000Z",
        "updatedAt": "2026-06-10T11:45:33.229Z",
        "createdAt": "2026-06-10T11:43:36.277Z"
    }
]
```

Get Global Coupon
-----------------

> [!IMPORTANT]
> Required roles: `SuperAdmin`, `Admin`, `Manager`

```http
GET /v1/referral/global-coupons/<global-coupon-uuid> HTTP/1.1
```

### Response Body

```json
{
    "uuid": "cdc4c904-0dd1-495f-91a4-5e57ae09007d",
    "code": "JAMES89",
    "discountType": "fixed",
    "discountPercentage": "99",
    "discountValue": 100,
    "usageLimit": 1,
    "ordersCount": 0,
    "totalSales": {
        "amount": 0,
        "currencyCode": "qar"
    },
    "totalCommission": {
        "amount": 0,
        "currencyCode": "qar"
    },
    "expiresAt": "2029-12-31T00:00:00.000Z",
    "updatedAt": "2026-06-10T11:45:33.229Z",
    "createdAt": "2026-06-10T11:43:36.277Z"
}
```

Update Global Coupon
--------------------

> [!IMPORTANT]
> Required roles: `SuperAdmin`, `Admin`, `Manager`

```http
PUT /v1/referral/global-coupons/<global-coupon-uuid> HTTP/1.1
```

### Request Body

```json
{
    "code": "JAMES89",
    "discountType": "fixed",
    "discountPercentage": 99,
    "discountValue": 100,
    "usageLimit": 1,
    "expiresAt": "2029-12-31"
}
```

### Response Body

```json
{
    "uuid": "cdc4c904-0dd1-495f-91a4-5e57ae09007d",
    "code": "JAMES89",
    "discountType": "fixed",
    "discountPercentage": 99,
    "discountValue": 100,
    "usageLimit": 1,
    "ordersCount": 0,
    "totalSales": {
        "amount": 0,
        "currencyCode": "qar"
    },
    "totalCommission": {
        "amount": 0,
        "currencyCode": "qar"
    },
    "expiresAt": "2029-12-31T00:00:00.000Z",
    "updatedAt": "2026-06-10T11:45:33.229Z",
    "createdAt": "2026-06-10T11:43:36.277Z"
}
```

Delete Global Coupon
--------------------

> [!IMPORTANT]
> Required roles: `SuperAdmin`, `Admin`, `Manager`

```http
DELETE /v1/referral/global-coupons/<global-coupon-uuid> HTTP/1.1
```

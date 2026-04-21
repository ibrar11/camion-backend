Wishlist REST API
=================

This document includes the documentation of wishlist module.

Procedure to Add Your First Product to Wishlist
-----------------------------------------------

Follow the following steps to add your first product to wishlist. Your can find the documentation of each step below.

1.  Create your product. (See Inventory API)
2.  Add the product to your wishlist.
3.  Retrieve your wishlist.

Wishlist API
============

> [!IMPORTANT]
> You must include your access token as a `Bearer` token in the Authorization header. Your must have a Customer account while making these requests.

Add item to wishlist
--------------------

> [!IMPORTANT]
> Required roles: `Customer`, `Influencer`, `Affiliate`

```http
POST /v1/wishlist HTTP/1.1
```

Parameter Name | Required | Type | Description
---------------|----------|------|------------
productUuid | Yes | UUID | The UUID of the product to add to the wishlist

### Request Body
```json
{
    "productUuid": "28da9466-2e8d-4b09-b6bc-fa429484f9c6"
}
```

### Response Body
```json
{
    "uuid": "ffc0889c-dc10-4a8f-b67b-48834a723598",
    "product": {
        "uuid": "28da9466-2e8d-4b09-b6bc-fa429484f9c6",
        "slug": "iphone-22",
        "titleEn": "iPhone 22",
        "titleAr": "آيفون 22",
        "briefEn": "From $799 or $33.29/mo. per month for 24 months",
        "briefAr": "ابتداءً من 799 دولارًا أو 33.29 دولارًا شهريًا لمدة 24 شهرًا",
        "descriptionEn": "Your new iPhone awaits. Make it yours.",
        "descriptionAr": "جهاز آيفون الجديد بانتظارك. اجعله ملكك.",
        "descriptionHtmlEn": "<b>Your new iPhone awaits. Make it yours</b>",
        "descriptionHtmlAr": "<b>Your new iPhone awaits. Make it yours</b>",
        "status": "active",
        "salesCount": 0,
        "variants": [
            {
                "uuid": "27da54da-8ef9-424f-9c62-ba11f4f924fd",
                "titleEn": "iPhone 20 RED 1 TB",
                "titleAr": "iPhone 20 RED 1 TB",
                "sku": "iphone-20-red-1tb",
                "barcode": "10000",
                "cost": {
                    "amount": 2000,
                    "currencyCode": "qar"
                },
                "weight": {
                    "amount": 1,
                    "unit": "kg"
                },
                "dimensions": {
                    "width": 1000,
                    "height": 1000,
                    "length": 1000,
                    "unit": "in"
                },
                "salesCount": 0
            }
        ]
    }
}
```

Retrieve Wishlist
------------------

> [!IMPORTANT]
> Required roles: `Customer`, `Influencer`, `Affiliate`

```http
GET /v1/wishlist HTTP/1.1
```

### Response Body
```json
[
    {
        "uuid": "3393b1e3-c4f9-40a9-a809-fccaf46e8c46",
        "product": {
            "uuid": "a383097d-1555-4c85-a388-84eb864225c4",
            "slug": "cross-border-variable-speed-bicycle-foldableable-aluminum-alloy",
            "titleEn": "Cross-Border Variable Speed Bicycle Foldableable Aluminum Alloy Lightweight Commuter Foldableing Bicycle 20inch Bicycle",
            "titleAr": "Cross-Border Variable Speed Bicycle Foldableable Aluminum Alloy Lightweight Commuter Foldableing Bicycle 20inch Bicycle",
            "briefEn": "",
            "briefAr": "",
            "descriptionEn": "<div style=\"width: 790.0px;\">...</div>",
            "descriptionAr": "<div style=\"width: 790.0px;\">...</div>",
            "descriptionHtmlEn": "<div style=\"width: 790.0px;\">...</div>",
            "descriptionHtmlAr": "<div style=\"width: 790.0px;\">...</div>",
            "status": "ACTIVE"
        }
    }
]
```

Retrieve Wishlist Item
-----------------------

> [!IMPORTANT]
> Required roles: `Customer`, `Influencer`, `Affiliate`

```http
GET /v1/wishlist/<wishlist-item-uuid> HTTP/1.1
```

### Response Body
```json
{
    "uuid": "f0fdab43-b693-4762-a997-cc9d3817ba85",
    "customer": {
        "uuid": "b7c838b0-c03d-4b76-96d6-49736b71c53e",
        "fullName": "ibrar",
        "emailAddress": "ibrarmunawar0@gamil.com",
        "phoneNumber": "+82 30 2043 5885",
        "role": "customer",
        "deviceId": null
    },
    "product": {
        "uuid": "a383097d-1555-4c85-a388-84eb864225c4",
        "slug": "cross-border-variable-speed-bicycle-foldableable-aluminum-alloy",
        "titleEn": "Cross-Border Variable Speed Bicycle Foldableable Aluminum Alloy Lightweight Commuter Foldableing Bicycle 20inch Bicycle",
        "titleAr": "Cross-Border Variable Speed Bicycle Foldableable Aluminum Alloy Lightweight Commuter Foldableing Bicycle 20inch Bicycle",
        "briefEn": "",
        "briefAr": "",
        "descriptionEn": "<div style=\"width: 790.0px;\">...</div>",
        "descriptionAr": "<div style=\"width: 790.0px;\">...</div>",
        "descriptionHtmlEn": "<div style=\"width: 790.0px;\">...</div>",
        "descriptionHtmlAr": "<div style=\"width: 790.0px;\">...</div>",
        "status": "ACTIVE"
    }
}
```

Remove Item from Wishlist
--------------------------

> [!IMPORTANT]
> Required roles: `Customer`, `Influencer`, `Affiliate`

```http
DELETE /v1/wishlist/<wishlist-item-uuid> HTTP/1.1
```


Clear Wishlist
---------------

> [!IMPORTANT]
> Required roles: `Customer`, `Influencer`, `Affiliate`

```http
DELETE /v1/wishlist HTTP/1.1
```

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
> You must include your access token as a `Bearer` token in the Authorization header. Your account must be active while making these requests.

Add item to wishlist
--------------------

> [!IMPORTANT]
> Required roles: `SuperAdmin`, `Admin`, `Customer`, `Guest`

```http
POST /v1/wishlist HTTP/1.1
```

Parameter Name | Required | Type | Description
---------------|----------|------|------------
productUuid | Yes | UUID | The UUID of the product to add to the wishlist

### Request Body
```json
{
    "productUuid": "a383097d-1555-4c85-a388-84eb864225c4"
}
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

Retrieve Wishlist
------------------

> [!IMPORTANT]
> Required roles: `SuperAdmin`, `Admin`, `Customer`, `Guest`

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
> Required roles: `SuperAdmin`, `Admin`, `Customer`, `Guest`

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
> Required roles: `SuperAdmin`, `Admin`, `Customer`, `Guest`

```http
DELETE /v1/wishlist/remove/<product-uuid> HTTP/1.1
```


Clear Wishlist
---------------

> [!IMPORTANT]
> Required roles: `SuperAdmin`, `Admin`, `Customer`, `Guest`

```http
DELETE /v1/wishlist HTTP/1.1
```
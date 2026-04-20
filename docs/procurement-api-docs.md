Procurement REST API
==================

This document includes the documentation of procurement module.

Procedure to Search and Retrieve Products
--------------------------------------

Follow the following steps to search and retrieve product details from the procurement platform.

1. Search products using keyword and filters.
2. Retrieve a specific product detail using product ID.

Procurement API
=============

> [!IMPORTANT]
> You must include your access token as a `Bearer` token in the Authorization header. Your account must be active while making these requests.

Search Products
------------------

> [!IMPORTANT]
> Required roles: `SuperAdmin`, `Admin`

```http
GET /v1/procurement HTTP/1.1
```
Query Parameters
Parameter Name | Required | Type | Description
---------------|----------|------|------------
keyword | Yes | String | Search keyword for products
page | No | NumberString | Page number for pagination
pageSize | No | NumberString | Number of items per page
sort | No | String | Sorting option (e.g., price, sales)
priceStart | No | String | Minimum price filter
priceEnd | No | String | Maximum price filter

### Response Body
```json
[
    {
        "externalId": "123456",
        "title": "Running Shoes",
        "price": 25.5,
        "originalPrice": 30,
        "image": "https://example.com/image.jpg",
        "productUrl": "https://example.com/product",
        "monthlySales": 120,
        "rating": 4.5,
        "minOrderQuantity": 2,
        "isDropshipping": true,
        "supplierType": "manufacturer",
        "category": {
            "level1": "1",
            "level2": "2",
            "level3": "3"
        },
        "createdAt": "2024-01-01",
        "updatedAt": "2024-01-02"
    }
]
```

Retrieve Product Detail
-------------------

> [!IMPORTANT]
> Required roles: `SuperAdmin`, `Admin`

```http
GET /v1/procurement/<product-id> HTTP/1.1
```

### Response Body
```json
{
    "externalId": "123456",
    "title": "Running Shoes",
    "description": "Original product description",
    "descriptionTrans": "Translated description",
    "images": [
        "https://example.com/image1.jpg",
        "https://example.com/image2.jpg"
    ],
    "mainImage": "https://example.com/image1.jpg",
    "video": "https://example.com/video.mp4",
    "price": 25.5,
    "minOrderQuantity": 2,
    "variants": [
        {
            "skuId": "sku-1",
            "price": 25.5,
            "stock": 100,
            "attributes": [
                {
                    "name": "Color",
                    "value": "Red"
                },
                {
                    "name": "Size",
                    "value": "42"
                }
            ],
            "image": "https://example.com/variant.jpg"
        }
    ],
    "options": [
        {
            "name": "Color",
            "values": ["Red", "Blue"]
        },
        {
            "name": "Size",
            "values": ["40", "41", "42"]
        }
    ],
    "attributes": [
        {
            "name": "Material",
            "value": "Leather"
        }
    ],
    "supplier": {
        "name": "ABC Supplier",
        "id": "supplier-123"
    },
    "category": {
        "level1": "1",
        "level2": "2",
        "level3": "3"
    },
    "shipping": {
        "weight": 1.2,
        "length": 30,
        "width": 20,
        "height": 10,
        "origin": "China"
    },
    "meta": {
        "rating": 4.5,
        "sold": 500,
        "isDropshipping": true
    }
}
```

Import Products
------------------

> [!IMPORTANT]
> Required roles: `SuperAdmin`, `Admin`

```http
Post /v1/procurement/import HTTP/1.1
```
Query Parameters
Parameter Name | Required | Type | Description
---------------|----------|------|------------
externalId | Yes | Array<String> | Array of external Ids
categories | Yes | Array<String> | Array of categories uuIds
warehouseUUID | Yes | String | uuid of waregouse

### Request Body
```json
{
    "externalId": ["724311508795"],
    "categories": ["413ca229-065d-4f29-b4cc-c63151bd3b2a"],
    "warehouseUUID": "6ba35190-ef22-4b73-af06-5ba1e0580b57"
}
```

### Response Body
```json
{
    "success": [
        {
            "externalId": "801224174564",
            "product": {
                "uuid": "60b9ec90-0875-4319-b471-14153f9e5835",
                "slug": "iphone-17",
                "title": "iPhone 17",
                "titleAr": "آيفون 17",
                "brief": "From $799 or $33.29/mo. per month for 24 months",
                "briefAr": "ابتداءً من 799 دولارًا أو 33.29 دولارًا شهريًا لمدة 24 شهرًا",
                "description": "Your new iPhone awaits. Make it yours.",
                "descriptionAr": "جهاز آيفون الجديد بانتظارك. اجعله ملكك.",
                "descriptionHtml": "<b>Your new iPhone awaits. Make it yours</b>",
                "descriptionHtmlAr": "<b>Your new iPhone awaits. Make it yours</b>",
                "status": "DRAFT",
                "options": [],
                "variants": []
            }
        }
    ],
    "failed": [
        {
            "id": "801224174564",
            "reason": "failed to add product options"
        }
    ]
}
```
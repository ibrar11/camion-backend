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
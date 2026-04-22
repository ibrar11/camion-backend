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
    "productUUID": "28da9466-2e8d-4b09-b6bc-fa429484f9c6",
    "variantUUID": "27da54da-8ef9-424f-9c62-ba11f4f924fd"
}
```

### Response Body
```json
{
    "uuid": "4e467d76-a3c6-48a9-99df-dbec67d72c09",
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
        "likesCount": 0,
        "reviewsCount": 1,
        "ratingSum": 5,
        "ratingCount": 1,
        "ratingAvg": "5",
        "ratingOneStarCount": 0,
        "ratingTwoStarCount": 0,
        "ratingThreeStarCount": 0,
        "ratingFourStarCount": 0,
        "ratingFiveStarCount": 0,
        "variants": []
    },
    "variant": {
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
        "uuid": "4e467d76-a3c6-48a9-99df-dbec67d72c09",
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
            "likesCount": 0,
            "reviewsCount": 1,
            "ratingSum": 5,
            "ratingCount": 1,
            "ratingAvg": "5",
            "ratingOneStarCount": 0,
            "ratingTwoStarCount": 0,
            "ratingThreeStarCount": 0,
            "ratingFourStarCount": 0,
            "ratingFiveStarCount": 0,
            "productCategories": [
                {
                    "id": 11,
                    "category": {
                        "uuid": "d66ec8b3-2201-4cfc-bbdb-85274efb7bba",
                        "slug": "iphones",
                        "nameEn": "iphones",
                        "nameAr": "أحذية رياضية",
                        "pricingFactor": "0.9",
                        "thumbnailUrl": "s3://categories/1ec99def-36a4-4b7c-bc82-c06771e51f71.jpg"
                    }
                },
                {
                    "id": 12,
                    "category": {
                        "uuid": "70bcc216-2fc3-4dc2-bd65-642dccdd141a",
                        "slug": "iphones-two",
                        "nameEn": "iphones",
                        "nameAr": "أحذية رياضية",
                        "pricingFactor": "0.9",
                        "thumbnailUrl": "s3://categories/1ec99def-36a4-4b7c-bc82-c06771e51f71.jpg"
                    }
                },
                {
                    "id": 13,
                    "category": {
                        "uuid": "a095966a-95f1-4e75-88ff-572478d08ae9",
                        "slug": "iphones-three",
                        "nameEn": "iphones",
                        "nameAr": "أحذية رياضية",
                        "pricingFactor": "0.9",
                        "thumbnailUrl": "s3://categories/1ec99def-36a4-4b7c-bc82-c06771e51f71.jpg"
                    }
                }
            ]
        },
        "variant": {
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
            "salesCount": 0,
            "images": [
                {
                    "uuid": "e23e83b6-48b9-436b-84c1-617a9bc5a60e",
                    "imageUrl": "s3://product-images/a5e23a38-d42c-4340-b601-51788510e52e.jpg",
                    "thumbnailUrl": "s3://product-images/a5e23a38-d42c-4340-b601-51788510e52e.jpg",
                    "alt": "",
                    "isFeatured": false,
                    "position": 0,
                    "dimensions": {
                        "width": 1000,
                        "height": 1000
                    }
                }
            ]
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
    "uuid": "4e467d76-a3c6-48a9-99df-dbec67d72c09",
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
        "likesCount": 0,
        "reviewsCount": 1,
        "ratingSum": 5,
        "ratingCount": 1,
        "ratingAvg": "5",
        "ratingOneStarCount": 0,
        "ratingTwoStarCount": 0,
        "ratingThreeStarCount": 0,
        "ratingFourStarCount": 0,
        "ratingFiveStarCount": 0
    },
    "variant": {
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
        "salesCount": 0,
        "images": [
            {
                "uuid": "e23e83b6-48b9-436b-84c1-617a9bc5a60e",
                "imageUrl": "s3://product-images/a5e23a38-d42c-4340-b601-51788510e52e.jpg",
                "thumbnailUrl": "s3://product-images/a5e23a38-d42c-4340-b601-51788510e52e.jpg",
                "alt": "",
                "isFeatured": false,
                "position": 0,
                "dimensions": {
                    "width": 1000,
                    "height": 1000
                }
            }
        ]
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

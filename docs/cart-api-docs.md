Cart REST API
==================

This document includes the documentation of the cart module.

Procedure to Use Cart
--------------------------------------

Follow the following steps to use the cart system:

1. Add item to cart (guest or authenticated user).
2. Retrieve cart items.
3. Update cart item (quantity or variant).
4. Remove item from cart.
5. Clear entire cart.

Cart API
=============

> [!IMPORTANT]
> The cart supports both authenticated users and guest users.
> You must include your access token as a `Bearer` token in the Authorization header. Your account must be active while making these requests.
> Guest users must send x-guest-id header.
> If a valid Bearer token is provided → cart is linked to user.
> f no token → x-guest-id header is required.

Add to Cart
------------------


```http
POST /v1/cart-items HTTP/1.1
```

Parameter Name | Required | Type | Description
---------------|----------|------|------------
productUuid | Yes | UUID | UUID of the product
variantUuid | Yes | UUID | UUID of the product variant
quantity | Yes | Number | Quantity to add (minimum 1)
currency | Yes | CurrencyCode | The desired currency code

### Request Body
```json
{
	"productUuid": "28da9466-2e8d-4b09-b6bc-fa429484f9c6",
	"variantUuid": "27da54da-8ef9-424f-9c62-ba11f4f924fd",
	"quantity": 1,
	"currency": "qar"
}
```

### Response Body
```json
{
    "uuid": "8c534e15-673f-440e-b548-04424cc92363",
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
        "variants": [],
        "productCategories": []
    },
    "variant": {
        "uuid": "27da54da-8ef9-424f-9c62-ba11f4f924fd",
        "inventoryItem": {
            "uuid": "244e61b7-939a-47f6-8a1d-e44ab5559078",
            "sku": "iphone-20-red-1tb",
            "levels": [
                {
                    "uuid": "b2372332-e52e-4751-a270-ddf2f7a3743e",
                    "quantity": 100
                }
            ]
        },
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
    },
    "quantity": 1,
    "subTotal": {
        "amount": 7500,
        "currencyCode": "qar"
    },
    "discountPrice": {
        "amount": 1000,
        "currencyCode": "qar"
    },
    "subTotal": {
        "amount": 6500,
        "currencyCode": "qar"
    }
}
```

Retrieve Cart
-------------------

```http
GET /v1/cart-items HTTP/1.1
```

### Response Body
```json
[
    {
        "uuid": "8c534e15-673f-440e-b548-04424cc92363",
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
            "variants": [],
            "productCategories": []
        },
        "variant": {
            "uuid": "27da54da-8ef9-424f-9c62-ba11f4f924fd",
            "inventoryItem": {
                "uuid": "244e61b7-939a-47f6-8a1d-e44ab5559078",
                "sku": "iphone-20-red-1tb",
                "levels": [
                    {
                        "uuid": "b2372332-e52e-4751-a270-ddf2f7a3743e",
                        "quantity": 100
                    }
                ]
            },
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
            ],
            "optionValues": [
                {
                    "optionValue": {
                        "uuid": "853fe098-90a1-460d-ab49-20abc7f55896",
                        "value": "Off-white and dark gray [double standard model]",
                        "position": 8,
                        "option": {
                            "uuid": "caf82529-a8a9-43e3-b927-7447e61eba12",
                            "name": "Color",
                            "position": 1
                        }
                    }
                }
            ]
        },
        "quantity": 1,
        "subTotal": {
            "amount": 7500,
            "currencyCode": "qar"
        },
        "discountPrice": {
            "amount": 1000,
            "currencyCode": "qar"
        },
        "subTotal": {
            "amount": 6500,
            "currencyCode": "qar"
        },
        "availableStock": 100,
        "isAvailable": true
    }
]
```

Update Cart Item
----------------

```http
PATCH /v1/cart-items/<cart-item-uuid> HTTP/1.1
```

Parameter Name | Required | Type | Description
---------------|----------|------|------------
productUuid | Yes | UUID | UUID of the product
variantUuid | Yes | UUID | New variant UUID
quantity | Yes | Number | Updated quantity (minimum 1)
currency | Yes | CurrencyCode | The desired currency code

### Request Body
```json
{
	"productUuid": "28da9466-2e8d-4b09-b6bc-fa429484f9c6",
	"variantUuid": "27da54da-8ef9-424f-9c62-ba11f4f924fd",
	"quantity": 2,
	"currency": "qar"
}
```

### Response Body
```json
{
    "uuid": "8c534e15-673f-440e-b548-04424cc92363",
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
        "variants": [],
        "productCategories": [
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
                "id": 11,
                "category": {
                    "uuid": "d66ec8b3-2201-4cfc-bbdb-85274efb7bba",
                    "slug": "iphones",
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
        "inventoryItem": {
            "uuid": "244e61b7-939a-47f6-8a1d-e44ab5559078",
            "sku": "iphone-20-red-1tb",
            "levels": [
                {
                    "uuid": "b2372332-e52e-4751-a270-ddf2f7a3743e",
                    "quantity": 100
                }
            ]
        },
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
    },
    "quantity": 2,
    "subTotal": {
        "amount": 15000,
        "currencyCode": "qar"
    },
    "discountPrice": {
        "amount": 2000,
        "currencyCode": "qar"
    },
    "subTotal": {
        "amount": 13000,
        "currencyCode": "qar"
    },
}
```

Remove Item from Cart
----------------

```http
DELETE /v1/cart-items/<cart-item-uuid> HTTP/1.1
```

Remove Item from Cart
----------------

```http
DELETE /v1/cart-items HTTP/1.1
```

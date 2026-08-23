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

Campaign Pricing in the Cart
-----------------------------

When a product belongs to a category that is part of an active campaign, the campaign's `discountPercentage` is automatically applied when the item is added to cart or when the cart is fetched. The highest available campaign discount wins.

When a campaign expires, a background scheduler runs within one minute and updates the stored `subTotal` and `total` of every affected cart item back to the standard price. Customers will see the updated (non-discounted) price on their next cart fetch.

Bundle Pricing in the Cart
---------------------------

When the current cart contents match an active fixed bundle, the cart is repriced automatically. Matching bundle discounts are applied when the item is added to cart, when the cart is updated, and whenever the cart is fetched.

The cart item response now includes the following bundle metadata:

Field | Type | Description
------|------|------------
bundleUuid | String \| null | UUID of the first applied bundle affecting this cart row
bundleQuantity | Number | Total quantity from this cart row consumed by bundle matches
bundleAllocations | Array<Object> \| null | Detailed bundle discount allocation entries for this cart row
bundleAllocations[].bundleUuid | String | Bundle UUID
bundleAllocations[].bundleTitle | String | Bundle English title used for debugging/reporting
bundleAllocations[].quantity | Number | Quantity from this row allocated to the bundle
bundleAllocations[].discountMinor | Number | Discount in minor currency units allocated to this row

Cart API
=============

> [!IMPORTANT]
> The cart supports both authenticated users and guest users.
> You must include your access token as a `Bearer` token in the Authorization header. Your account must be active while making these requests.
> Guest users must send x-guest-id header.
> If a valid Bearer token is provided → cart is linked to user.
> If no token → x-guest-id header is required.

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
    "total": {
        "amount": 6500,
        "currencyCode": "qar"
    },
    "bundleUuid": "2aa44389-f5f8-4c57-a344-5127f7fa523f",
    "bundleQuantity": 1,
    "bundleAllocations": [
        {
            "bundleUuid": "2aa44389-f5f8-4c57-a344-5127f7fa523f",
            "bundleTitle": "Complete the Look",
            "quantity": 1,
            "discountMinor": 1000
        }
    ]
}
```

> [!IMPORTANT]
> If the cart no longer satisfies the bundle requirements, bundle pricing is removed automatically and `bundleUuid`, `bundleQuantity`, and `bundleAllocations` are reset.

Add Bundle to Cart
------------------

Adds selected resolved bundle items to cart in one call. The cart still returns normal cart rows, but bundle pricing metadata is attached when the submitted selection reaches the bundle's minimum selection threshold.

```http
POST /v1/cart-items/bundles HTTP/1.1
```

Parameter Name | Required | Type | Description
---------------|----------|------|------------
bundleUuid | Yes | UUID | UUID of the bundle to add
currency | Yes | CurrencyCode | The desired currency code
countryCode | No | String | Customer country used for shipping eligibility checks
quantity | No | Number | Number of bundle sets to add. Defaults to `1`
items | No | Array<Object> | Optional subset of resolved bundle items to add. If omitted, all resolved bundle items are added
items[].productUuid | No | UUID | Product UUID of a resolved bundle item
items[].variantUuid | No | UUID | Variant UUID of a resolved bundle item

### Request Body
```json
{
    "bundleUuid": "8f7ca4c8-7b8a-4600-b1f6-a5a7f8db1f6f",
    "currency": "qar",
    "countryCode": "QA",
    "quantity": 1,
    "items": [
        {
            "productUuid": "8d302728-4d16-4fa7-8540-0c2cedd9ea77"
        },
        {
            "variantUuid": "a8f94af8-0bc7-440b-a244-d6bdb4f4a2c8"
        }
    ]
}
```

### Response Body
```json
[
    {
        "uuid": "8c534e15-673f-440e-b548-04424cc92363",
        "quantity": 1,
        "bundleUuid": "8f7ca4c8-7b8a-4600-b1f6-a5a7f8db1f6f",
        "bundleQuantity": 1,
        "bundleAllocations": [
            {
                "bundleUuid": "8f7ca4c8-7b8a-4600-b1f6-a5a7f8db1f6f",
                "bundleTitle": "Complete the Look",
                "quantity": 1,
                "discountMinor": 1200
            }
        ],
        "subTotal": {
            "amount": 15000,
            "currencyCode": "qar"
        },
        "discountPrice": {
            "amount": 1200,
            "currencyCode": "qar"
        },
        "total": {
            "amount": 13800,
            "currencyCode": "qar"
        }
    }
]
```

### Notes

- This endpoint can add the full resolved bundle or a customer-selected subset of resolved bundle items.
- If the submitted selection count is below the bundle's `minimumSelectionCount`, the selected items are added as normal products and no bundle pricing metadata is applied.
- The response uses the standard cart item shape, so clients do not need a separate cart model for bundles.

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
        "total": {
            "amount": 6500,
            "currencyCode": "qar"
        },
        "bundleUuid": "2aa44389-f5f8-4c57-a344-5127f7fa523f",
        "bundleQuantity": 1,
        "bundleAllocations": [
            {
                "bundleUuid": "2aa44389-f5f8-4c57-a344-5127f7fa523f",
                "bundleTitle": "Complete the Look",
                "quantity": 1,
                "discountMinor": 1000
            }
        ],
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
    "total": {
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

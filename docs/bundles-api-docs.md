Bundles REST API
==================

This document includes the documentation of the bundles module.

Bundle API
============

> [!IMPORTANT]
> You must include your access token as a `Bearer` token in the Authorization header. Your account must be active while making these requests.

Create a Bundle
----------------

> [!IMPORTANT]
> Required roles: `SuperAdmin`, `Admin`, `Manager`

```http
POST /v1/bundles HTTP/1.1
```

Parameter Name | Required | Type | Description
---------------|----------|------|------------
title.en | Yes | String | English title of the bundle
title.ar | Yes | String | Arabic title of the bundle
brief.en | No | String | Optional English short description, max 256 chars
brief.ar | No | String | Optional Arabic short description, max 256 chars
slug | Yes | String | Unique bundle slug, max 64 chars
discountType | Yes | String | One of `percentage_off`, `fixed_amount_off`, `flat_total`
mode | No | String | One of `fixed`, `hybrid`, `auto`. Defaults to `fixed`
flatPriceValue | Conditional | Number | Required when `discountType = flat_total`
discountPercentage | Conditional | Number | Required when `discountType = percentage_off`
discountAmountValue | Conditional | Number | Required when `discountType = fixed_amount_off`
amountCurrencyCode | Conditional | String | Required for `flat_total` and `fixed_amount_off`
isActive | Yes | Boolean | Whether the bundle is active
anchorProductUuid | Conditional | String | Required for `hybrid` and `auto` bundles. Used to target a specific product page
sourceCategoryUuids | No | Array<String> | Optional category UUIDs used for auto-filled products. If omitted, the anchor product's categories are used
autoFillCount | Conditional | Number | Required for `hybrid` and `auto`. Number of generated products to append
minimumSelectionCount | No | Number | Minimum number of resolved bundle items the customer must select for bundle pricing. Defaults to `2`
startsAt | Yes | String | ISO-style start date/time
finishesAt | Yes | String | ISO-style finish date/time
items | Yes | Array<Object> | Bundle items. `fixed` requires at least 2 items, `hybrid` requires at least 1 manual item, `auto` can use an empty array
items[].productUuid | No | String | Product UUID
items[].variantUuid | No | String | Variant UUID
items[].quantity | Yes | Number | Quantity for this bundle item, minimum 1

### Request Body
```json
{
    "title": {
        "en": "Complete the Look",
        "ar": "اكمل الإطلالة"
    },
    "brief": {
        "en": "Dress + bag promotional bundle",
        "ar": "باقة ترويجية للفستان مع الحقيبة"
    },
    "slug": "complete-the-look",
    "discountType": "percentage_off",
    "mode": "fixed",
    "discountPercentage": 10,
    "minimumSelectionCount": 2,
    "isActive": true,
    "startsAt": "2026-08-18T09:00:00Z",
    "finishesAt": "2026-09-18T23:59:59Z",
    "items": [
        {
            "productUuid": "8d302728-4d16-4fa7-8540-0c2cedd9ea77",
            "quantity": 1
        },
        {
            "variantUuid": "a8f94af8-0bc7-440b-a244-d6bdb4f4a2c8",
            "quantity": 1
        }
    ]
}
```

### Bundle Modes

- `fixed`: current manual bundle behavior. Admin stores the exact products or variants that make up the bundle.
- `hybrid`: admin stores one or more manual items, plus `anchorProductUuid` and `autoFillCount`. The backend appends deterministic related products from `sourceCategoryUuids` or the anchor product's own categories.
- `auto`: admin stores the pricing rule and targeting config only. Bundle items are generated at runtime from `sourceCategoryUuids` or the anchor product's own categories. The resolved bundle includes the anchor product itself plus the generated related products.
- `autoFillCount` is validated during create/update. If admin requests more generated items than the selected categories can actually provide, the API returns a validation error instead of saving a bundle that later resolves to an empty result.
- `minimumSelectionCount`: applies to customer-side bundle add for all bundle modes. If the customer selects fewer items than this threshold, the items are added as normal cart products without bundle pricing.

### Example `hybrid` Request Body
```json
{
    "title": {
        "en": "Dress with Matching Add-ons",
        "ar": "فستان مع الإضافات"
    },
    "slug": "dress-matching-addons",
    "discountType": "percentage_off",
    "mode": "hybrid",
    "discountPercentage": 10,
    "isActive": true,
    "anchorProductUuid": "8d302728-4d16-4fa7-8540-0c2cedd9ea77",
    "sourceCategoryUuids": [
        "3a6935de-8d59-4d9f-9b6c-2c5d42a4f6ab"
    ],
    "autoFillCount": 2,
    "startsAt": "2026-08-18T09:00:00Z",
    "finishesAt": "2026-09-18T23:59:59Z",
    "items": [
        {
            "variantUuid": "a8f94af8-0bc7-440b-a244-d6bdb4f4a2c8",
            "quantity": 1
        }
    ]
}
```

### Example `auto` Request Body
```json
{
    "title": {
        "en": "Auto Accessories Bundle",
        "ar": "باقة إكسسوارات تلقائية"
    },
    "slug": "auto-accessories-bundle",
    "discountType": "flat_total",
    "mode": "auto",
    "flatPriceValue": 49,
    "amountCurrencyCode": "qar",
    "isActive": true,
    "anchorProductUuid": "8d302728-4d16-4fa7-8540-0c2cedd9ea77",
    "sourceCategoryUuids": [
        "3a6935de-8d59-4d9f-9b6c-2c5d42a4f6ab"
    ],
    "autoFillCount": 2,
    "startsAt": "2026-08-18T09:00:00Z",
    "finishesAt": "2026-09-18T23:59:59Z",
    "items": []
}
```

### Response Body
```json
{
    "uuid": "8f7ca4c8-7b8a-4600-b1f6-a5a7f8db1f6f",
    "titleEn": "Complete the Look",
    "titleAr": "اكمل الإطلالة",
    "briefEn": "Dress + bag promotional bundle",
    "briefAr": "باقة ترويجية للفستان مع الحقيبة",
    "slug": "complete-the-look",
    "imageUrl": null,
    "discountType": "percentage_off",
    "mode": "fixed",
    "flatPriceValue": null,
    "discountPercentage": 10,
    "discountAmountValue": null,
    "amountCurrencyCode": null,
    "isActive": true,
    "anchorProductUuid": null,
    "sourceCategoryUuids": null,
    "autoFillCount": null,
    "startsAt": "2026-08-18T09:00:00.000Z",
    "finishesAt": "2026-09-18T23:59:59.000Z",
    "items": [
        {
            "product": {
                "uuid": "8d302728-4d16-4fa7-8540-0c2cedd9ea77",
                "slug": "dress-product"
            },
            "variant": null,
            "quantity": 1
        },
        {
            "product": {
                "uuid": "26e7c92d-5158-49a6-a8be-7b0a636f913f",
                "slug": "bag-product"
            },
            "variant": {
                "uuid": "a8f94af8-0bc7-440b-a244-d6bdb4f4a2c8",
                "sku": "BAG-BLACK-01"
            },
            "quantity": 1
        }
    ]
}
```

Retrieve Bundles
-----------------

> [!IMPORTANT]
> Required roles: `SuperAdmin`, `Admin`, `Manager`, `User`

```http
GET /v1/bundles HTTP/1.1
```

### Query Parameters
Name | Description | Default
-----|-------------|--------
filters | Reserved for future filtering support | ``
sort | Reserved for future sorting support | ``
pageNumber | The current page number | `1`
itemsPerPage | The number of results to retrieve in the response | `100`

### Response Body
```json
[
    {
        "uuid": "8f7ca4c8-7b8a-4600-b1f6-a5a7f8db1f6f",
        "titleEn": "Complete the Look",
        "titleAr": "اكمل الإطلالة",
        "briefEn": "Dress + bag promotional bundle",
        "briefAr": "باقة ترويجية للفستان مع الحقيبة",
        "slug": "complete-the-look",
        "imageUrl": "https://assets.example.com/bundles/complete-the-look.jpg",
        "discountType": "percentage_off",
        "mode": "fixed",
        "flatPriceValue": null,
        "discountPercentage": 10,
        "discountAmountValue": null,
        "amountCurrencyCode": null,
        "isActive": true,
        "anchorProductUuid": null,
        "sourceCategoryUuids": null,
        "autoFillCount": null,
        "startsAt": "2026-08-18T09:00:00.000Z",
        "finishesAt": "2026-09-18T23:59:59.000Z",
        "items": [
            {
                "product": {
                    "uuid": "8d302728-4d16-4fa7-8540-0c2cedd9ea77",
                    "slug": "dress-product"
                },
                "variant": null,
                "quantity": 1
            }
        ]
    }
]
```

Retrieve Bundles for a Product
-------------------------------

> [!IMPORTANT]
> Required roles: `SuperAdmin`, `Admin`, `Manager`, `User`

```http
GET /v1/bundles/product/<product-uuid>?currency=qar&countryCode=QA HTTP/1.1
```

### Query Parameters
Name | Required | Type | Description
-----|----------|------|------------
currency | Yes | String | Customer-facing currency code used for availability/pricing checks
countryCode | No | String | Customer country code used for shipping eligibility checks

### Response Body
```json
[
    {
        "uuid": "8f7ca4c8-7b8a-4600-b1f6-a5a7f8db1f6f",
        "titleEn": "Complete the Look",
        "titleAr": "اكمل الإطلالة",
        "slug": "complete-the-look",
        "discountType": "percentage_off",
        "mode": "hybrid",
        "discountPercentage": 10,
        "isActive": true,
        "anchorProductUuid": "8d302728-4d16-4fa7-8540-0c2cedd9ea77",
        "sourceCategoryUuids": [
            "3a6935de-8d59-4d9f-9b6c-2c5d42a4f6ab"
        ],
        "autoFillCount": 1,
        "startsAt": "2026-08-18T09:00:00.000Z",
        "finishesAt": "2026-09-18T23:59:59.000Z",
        "items": [
            {
                "product": {
                    "uuid": "8d302728-4d16-4fa7-8540-0c2cedd9ea77",
                    "slug": "dress-product"
                },
                "variant": null,
                "quantity": 1
            },
            {
                "product": {
                    "uuid": "26e7c92d-5158-49a6-a8be-7b0a636f913f",
                    "slug": "bag-product"
                },
                "variant": {
                    "uuid": "a8f94af8-0bc7-440b-a244-d6bdb4f4a2c8",
                    "sku": "BAG-BLACK-01"
                },
                "quantity": 1
            }
        ]
    }
]
```

### Notes

- Each `items[].product` is returned as a lightweight storefront preview for bundle discovery. Core product fields remain available, but the nested `items[].product.variants` list is intentionally omitted to avoid duplicate payload because the selected bundle variant is already returned in `items[].variant`.
- If the bundle item was configured only at product level and no specific variant was pinned by admin, the API still returns a concrete default variant in `items[].variant` so clients can add the bundle directly to cart.
- `hybrid` and `auto` bundles are resolved dynamically at request time, but the response shape remains the same as fixed bundles.
- `auto` bundles include the anchor/source product as the first hydrated item, followed by the generated related products.
- Bundle item responses do not expose a nested `items[].bundle` field.

Retrieve Bundle
----------------

> [!IMPORTANT]
> Required roles: `SuperAdmin`, `Admin`, `Manager`, `User`

```http
GET /v1/bundles/<bundle-uuid> HTTP/1.1
```

### Response Body
```json
{
    "uuid": "8f7ca4c8-7b8a-4600-b1f6-a5a7f8db1f6f",
    "titleEn": "Complete the Look",
    "titleAr": "اكمل الإطلالة",
    "briefEn": "Dress + bag promotional bundle",
    "briefAr": "باقة ترويجية للفستان مع الحقيبة",
    "slug": "complete-the-look",
    "imageUrl": "https://assets.example.com/bundles/complete-the-look.jpg",
    "discountType": "percentage_off",
    "flatPriceValue": null,
    "discountPercentage": 10,
    "discountAmountValue": null,
    "amountCurrencyCode": null,
    "isActive": true,
    "startsAt": "2026-08-18T09:00:00.000Z",
    "finishesAt": "2026-09-18T23:59:59.000Z",
    "items": [
        {
            "product": {
                "uuid": "8d302728-4d16-4fa7-8540-0c2cedd9ea77",
                "slug": "dress-product"
            },
            "variant": null,
            "quantity": 1
        }
    ]
}
```

Update Bundle
--------------

> [!IMPORTANT]
> Required roles: `SuperAdmin`, `Admin`, `Manager`

```http
PUT /v1/bundles/<bundle-uuid> HTTP/1.1
```

The request body has the same shape as the create bundle API.

### Response Body
```json
{
    "uuid": "8f7ca4c8-7b8a-4600-b1f6-a5a7f8db1f6f",
    "titleEn": "Complete the Look Updated",
    "titleAr": "اكمل الإطلالة المحدثة",
    "briefEn": "Updated bundle copy",
    "briefAr": "نسخة محدثة للباقة",
    "slug": "complete-the-look",
    "imageUrl": "https://assets.example.com/bundles/complete-the-look.jpg",
    "discountType": "flat_total",
    "flatPriceValue": 199,
    "discountPercentage": null,
    "discountAmountValue": null,
    "amountCurrencyCode": "qar",
    "isActive": true,
    "startsAt": "2026-08-18T09:00:00.000Z",
    "finishesAt": "2026-09-30T23:59:59.000Z",
    "items": [
        {
            "product": {
                "uuid": "8d302728-4d16-4fa7-8540-0c2cedd9ea77",
                "slug": "dress-product"
            },
            "variant": null,
            "quantity": 1
        }
    ]
}
```

Upload Bundle Image
--------------------

> [!IMPORTANT]
> Required roles: `SuperAdmin`, `Admin`, `Manager`

```http
PUT /v1/bundles/<bundle-uuid>/image HTTP/1.1
Content-Type: multipart/form-data
```

Parameter Name | Required | Type | Description
---------------|----------|------|------------
file | Yes | File | Bundle image file

### Response Body
```json
{
    "uuid": "8f7ca4c8-7b8a-4600-b1f6-a5a7f8db1f6f",
    "imageUrl": "https://assets.example.com/bundles/complete-the-look.jpg"
}
```

Delete Bundle
--------------

> [!IMPORTANT]
> Required roles: `SuperAdmin`, `Admin`, `Manager`

```http
DELETE /v1/bundles/<bundle-uuid> HTTP/1.1
```

### Response Body
This endpoint returns an empty successful response body.

Bundle Discount Rules
----------------------

1. `percentage_off` applies a percentage discount to the summed bundle subtotal.
2. `fixed_amount_off` subtracts a fixed amount in the selected currency from the bundle subtotal.
3. `flat_total` forces the matched bundle set to the specified final total in the selected currency.
4. A bundle must include at least 2 items.
5. Each item must include either `productUuid` or `variantUuid`.
6. Duplicate product/variant combinations are rejected.
7. `finishesAt` must be later than `startsAt`.

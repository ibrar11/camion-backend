Urgency Stock Count REST API
============================

This document includes the documentation of the product urgency count module.

Procedure to Configure Urgency Stock Count
------------------------------------------

Follow the following steps to configure urgency stock count.

1. Configure urgency on a product.
2. Configure urgency on a campaign.

> [!IMPORTANT]
> You must include your access token as a `Bearer` token in the Authorization header. Your account must be active while making these requests.

Product Urgency
===============

> [!IMPORTANT]
> Required roles: `SuperAdmin`, `Admin`, `Manager`

Update Product Urgency
----------------------

```http
PUT /v1/products/<product-uuid>/urgency HTTP/1.1
```

| Parameter Name | Required | Type    | Description                                                               |
| -------------- | -------- | ------- | ------------------------------------------------------------------------- |
| enabled        | Yes      | Boolean | Determines whether the manual urgency override is enabled for the product |
| stockCount     | No       | Number  | The exact fake stock count to return when urgency is enabled              |

### Request Body

```json
{
    "enabled": true,
    "stockCount": 18
}
```

### Response Body

```json
{
    "uuid": "66a8cf81-97a2-4999-a8a0-477621b13903",
    "slug": "sample-product",
    "titleEn": "Sample Product",
    "titleAr": "Sample Product (AR)",
    "briefEn": "Sample brief",
    "briefAr": "Sample brief (AR)",
    "descriptionEn": "Sample description",
    "descriptionAr": "Sample description (AR)",
    "descriptionHtmlEn": "<p>Sample description</p>",
    "descriptionHtmlAr": "<p>Sample description (AR)</p>",
    "procurementId": "1234567890",
    "urgencyEnabled": true,
    "urgencyStockCount": 18,
    "stockCount": 18,
    "updatedAt": "2026-08-12T02:00:00.000Z",
    "createdAt": "2026-08-12T02:00:00.000Z"
}
```

Disable Product Urgency
-----------------------

```http
PUT /v1/products/<product-uuid>/urgency HTTP/1.1
```

### Request Body

```json
{
    "enabled": false
}
```

### Response Body

```json
{
    "uuid": "66a8cf81-97a2-4999-a8a0-477621b13903",
    "slug": "sample-product",
    "titleEn": "Sample Product",
    "urgencyEnabled": false,
    "urgencyStockCount": null,
    "stockCount": 8
}
```

> `stockCount` falls back to campaign urgency when the manual override is disabled. If no campaign urgency applies, the value is `null`.

Campaign Urgency
================

> [!IMPORTANT]
> Required roles: `SuperAdmin`, `Admin`

Update Campaign Urgency
-----------------------

```http
PUT /v1/campaigns/<campaign-uuid>/urgency HTTP/1.1
```

| Parameter Name | Required | Type    | Description                                                      |
| -------------- | -------- | ------- | ---------------------------------------------------------------- |
| enabled        | Yes      | Boolean | Determines whether urgency is enabled for the campaign           |
| minStockCount  | No       | Number  | Minimum fake stock count used for deterministic campaign urgency |
| maxStockCount  | No       | Number  | Maximum fake stock count used for deterministic campaign urgency |

### Request Body

```json
{
    "enabled": true,
    "minStockCount": 3,
    "maxStockCount": 9
}
```

### Response Body

```json
{
    "uuid": "511561bd-e110-498a-9b34-ec4db6d3d07c",
    "nameEn": "Summer Sale",
    "nameAr": "Summer Sale (AR)",
    "briefEn": "Seasonal campaign",
    "briefAr": "Seasonal campaign (AR)",
    "slug": "summer-sale",
    "pricingFactor": 10,
    "discountPercentage": "20",
    "urgencyEnabled": true,
    "urgencyMinStockCount": 3,
    "urgencyMaxStockCount": 9,
    "startsAt": "2026-08-12T00:00:00.000Z",
    "finishesAt": "2026-09-12T00:00:00.000Z",
    "isActive": true,
    "isFeatured": false,
    "updatedAt": "2026-08-12T02:00:00.000Z",
    "createdAt": "2026-08-12T02:00:00.000Z"
}
```

Disable Campaign Urgency
------------------------

```http
PUT /v1/campaigns/<campaign-uuid>/urgency HTTP/1.1
```

### Request Body

```json
{
    "enabled": false
}
```

### Response Body

```json
{
    "uuid": "511561bd-e110-498a-9b34-ec4db6d3d07c",
    "nameEn": "Summer Sale",
    "urgencyEnabled": false,
    "urgencyMinStockCount": null,
    "urgencyMaxStockCount": null
}
```

Resolved Product Stock Count
----------------------------

The product API returns a single resolved urgency field named `stockCount`.

### Resolution Order

1. Manual product urgency override
2. Matching active campaign urgency
3. `null` when no urgency applies

### Behavior

| Source                   | Behavior                                                                            |
| ------------------------ | ----------------------------------------------------------------------------------- |
| Manual product urgency   | Always returns the configured`stockCount`                                         |
| Campaign urgency         | Returns a deterministic fake stock count between the configured minimum and maximum |
| No urgency configuration | Returns`null`                                                                     |

### Example Product Response

```json
{
    "uuid": "66a8cf81-97a2-4999-a8a0-477621b13903",
    "titleEn": "Sample Product",
    "stockCount": 8,
    "campaign": {
        "uuid": "511561bd-e110-498a-9b34-ec4db6d3d07c",
        "urgencyEnabled": true,
        "urgencyMinStockCount": 3,
        "urgencyMaxStockCount": 9
    }
}
```

> The generated campaign-based `stockCount` is stable for the same product and campaign combination.

Campaigns REST API
==================

```http
POST /v1/campaigns HTTP/1.1
```

| Format | Description |
|---|---|
| name.en | The name of the campaign in English |
| name.ar | The name of the campaign in Arabic |
| brief.en | The brief of the campaign in English |
| brief.ar | The brief of the campaign in Arabic |
| slug | The slug of the campaign |
| pricingFactor | The pricing factor applied on the products in the campaign |
| discountPercentage | Discount percentage applied of the products in the campaign |
| startsAt | The date at which the campaign starts |
| finishesAt | The date at which the campaign finishes |
| isFeatured | Determines if the campaign is featured on the homepage |
| categories | A list of categories under the campaign |

### Request Body

```json
{
    "name": {
        "en": "Summer 70%",
        "ar": "Summer 70% (Ar)"
    },
    "brief": {
        "en": "Get 70% off on all summer wear",
        "ar": "Get 70% off on all summer wear (AR)"
    },
    "slug": "summer-70",
    "pricingFactor": 10,
    "discountPercentage": 70,
    "startsAt": "2026-01-01",
    "finishesAt": "2026-12-31",
    "isFeatured": true,
    "categories": [
        "4b5e04b0-631e-4a01-841e-0fb7bad45928"
    ]
}
```

### Response Body

```json
{
    "uuid": "bfee8c29-c12c-4baa-b0fc-e2cc6fa6e8b0",
    "nameEn": "Summer 70%",
    "nameAr": "Summer 70% (Ar)",
    "briefEn": "Get 70% off on all summer wear",
    "briefAr": "Get 70% off on all summer wear (AR)",
    "slug": "summer-70",
    "pricingFactor": 10,
    "discountPercentage": "70",
    "startsAt": "2026-01-01T00:00:00.000Z",
    "finishesAt": "2026-12-31T00:00:00.000Z",
    "isActive": true,
    "isFeatured": true,
    "cartAdjustedAt": null,
    "updatedAt": "2026-06-16T07:16:12.203Z",
    "createdAt": "2026-06-16T07:16:12.203Z"
}
```

Get Campaigns
-------------

```http
GET /v1/campaigns HTTP/1.1
```

### Response Body

```json
[
    {
        "uuid": "3475a613-56cb-457b-b80c-94abd8df4f70",
        "nameEn": "Summer 50%",
        "nameAr": "Summer 50% (Ar)",
        "briefEn": "Get 50% off on all summer wear",
        "briefAr": "Get 50% off on all summer wear (AR)",
        "slug": "summer-50",
        "pricingFactor": 10,
        "discountPercentage": "50",
        "startsAt": "2026-01-01T00:00:00.000Z",
        "finishesAt": "2026-12-31T00:00:00.000Z",
        "isActive": true,
        "isFeatured": true,
        "cartAdjustedAt": null,
        "updatedAt": "2026-06-18T09:49:00.614Z",
        "createdAt": "2026-06-18T09:49:00.614Z"
    }
]
```

Get Campaign
------------

```http
GET /v1/campaigns/<campaign-uuid> HTTP/1.1
```

### Response Body

```json
{
    "uuid": "bfee8c29-c12c-4baa-b0fc-e2cc6fa6e8b0",
    "nameEn": "Summer 70%",
    "nameAr": "Summer 70% (Ar)",
    "briefEn": "Get 70% off on all summer wear",
    "briefAr": "Get 70% off on all summer wear (AR)",
    "slug": "summer-70",
    "pricingFactor": 10,
    "discountPercentage": "70",
    "startsAt": "2026-01-01T00:00:00.000Z",
    "finishesAt": "2026-12-31T00:00:00.000Z",
    "isActive": true,
    "isFeatured": true,
    "cartAdjustedAt": null,
    "campaignCategories": [
        {
            "id": 6,
            "category": {
                "uuid": "4b5e04b0-631e-4a01-841e-0fb7bad45928",
                "slug": "women-clothing",
                "nameEn": "Clothing",
                "nameAr": "ملابس",
                "pricingFactor": "1",
                "discountPercentage": "0",
                "thumbnailUrl": "s3://categories/1042cd68-f047-492d-a127-ce4e6b667a52.jpg",
                "isFeatured": false,
                "isFeaturedOnHomepage": false
            }
        }
    ],
    "cartAdjustedAt": null,
    "updatedAt": "2026-06-16T07:16:36.120Z",
    "createdAt": "2026-06-16T07:16:12.203Z"
}
```

Update Campaign
---------------

```http
PUT /v1/campaigns/<campaign-uuid> HTTP/1.1
```

### Request Body

```json
{
    "name": {
        "en": "Summer 70%",
        "ar": "Summer 70% (Ar)"
    },
    "brief": {
        "en": "Get 70% off on all summer wear",
        "ar": "Get 70% off on all summer wear (AR)"
    },
    "slug": "summer-70",
    "pricingFactor": 10,
    "discountPercentage": 70,
    "startsAt": "2026-01-01",
    "finishesAt": "2026-12-31",
    "isFeatured": true,
    "categories": [
        "4b5e04b0-631e-4a01-841e-0fb7bad45928"
    ]
}
```

### Response Body

```json
{
    "uuid": "bfee8c29-c12c-4baa-b0fc-e2cc6fa6e8b0",
    "nameEn": "Summer 70%",
    "nameAr": "Summer 70% (Ar)",
    "briefEn": "Get 70% off on all summer wear",
    "briefAr": "Get 70% off on all summer wear (AR)",
    "slug": "summer-70",
    "pricingFactor": 10,
    "discountPercentage": 70,
    "startsAt": "2026-01-01T00:00:00.000Z",
    "finishesAt": "2026-12-31T00:00:00.000Z",
    "isActive": true,
    "isFeatured": true,
    "cartAdjustedAt": null,
    "updatedAt": "2026-06-16T07:30:04.790Z",
    "createdAt": "2026-06-16T07:16:12.203Z"
}
```

Delete Campaign
---------------

```http
DELETE /v1/campaigns/<campaign-uuid> HTTP/1.1
```

---

Campaign Expiry & Automatic Cart Price Adjustment
-------------------------------------------------

When a campaign's `finishesAt` timestamp passes, a background scheduler (`CampaignsScheduler`) automatically reverts the campaign-discounted prices stored in every affected customer's cart back to the standard price.

### How it works

1. The scheduler runs **every minute**.
2. It queries for campaigns where `finishesAt < now` and `cartAdjustedAt IS NULL` (expired but not yet processed).
3. For each such campaign it finds all cart items whose product belongs to one of the campaign's categories (via `product → productCategories → category → campaignCategories`).
4. Each affected cart item's `subTotal`, `discountPrice`, and `total` are recalculated using the standard pricing logic — without the campaign discount. Any category-level base discount remains applied.
5. Once all affected cart items are updated, `cartAdjustedAt` is stamped on the campaign record so it is never re-processed.

### `cartAdjustedAt` field

| Value | Meaning |
|---|---|
| `null` | Campaign is active, or has expired but cart adjustment has not run yet |
| ISO timestamp | Cart prices for this campaign were adjusted at this time |

The adjustment is idempotent — if the server restarts mid-run, the scheduler will re-process only campaigns still showing `cartAdjustedAt = null`.

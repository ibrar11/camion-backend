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
    "discountPercentage": "70",
    "startsAt": "2026-01-01T00:00:00.000Z",
    "finishesAt": "2026-12-31T00:00:00.000Z",
    "isActive": true,
    "isFeatured": true,
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
        "discountPercentage": "50",
        "startsAt": "2026-01-01T00:00:00.000Z",
        "finishesAt": "2026-12-31T00:00:00.000Z",
        "isActive": true,
        "isFeatured": true,
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
    "discountPercentage": "70",
    "startsAt": "2026-01-01T00:00:00.000Z",
    "finishesAt": "2026-12-31T00:00:00.000Z",
    "isActive": true,
    "isFeatured": true,
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
    "discountPercentage": 70,
    "startsAt": "2026-01-01T00:00:00.000Z",
    "finishesAt": "2026-12-31T00:00:00.000Z",
    "isActive": true,
    "isFeatured": true,
    "updatedAt": "2026-06-16T07:30:04.790Z",
    "createdAt": "2026-06-16T07:16:12.203Z"
}
```

Delete Campaign
---------------

```http
DELETE /v1/campaigns/<campaign-uuid> HTTP/1.1
```

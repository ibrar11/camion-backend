Export Requests REST API Docs
=============================

Export requests api will be used to generate json or csv export files for supported entities.

Supported Entities
------------------

1. Products
2. Customers

Supported Formats
-----------------

1. CSV
2. JSON

Create Export Request
---------------------

```http
POST /v1/export-requests HTTP/1.1
```

| Format | Description |
|---|---|
| products-json | Products are exported as json |
| products-csv | Products are exported as csv |
| customers-json | Customers are exported as json |
| customers-csv | Customers are exported as csv |

### Request Body

```json
{
    "name": "Export Customers",
    "format": "products-json",
    "pagesCount": 20,
    "category": "b0ad2ed7-cd7c-439f-9b22-482ef8a0da8a"
}
```

### Response Body

```json
{
    "uuid": "0b212e00-99a3-430b-b7a8-4e584d2c6dbb",
    "name": "Export Customers",
    "format": "products-json",
    "pagesCount": 20,
    "category": {
        "uuid": "b14e3337-9c1e-4014-83a1-c2c0984cd44a",
        "slug": "women-t-shirts",
        "nameEn": "T-shirts",
        "nameAr": "تيشيرتات",
        "pricingFactor": "7",
        "discountPercentage": "35",
        "thumbnailUrl": "s3://categories/509692fb-571b-4893-8b15-254d084fc1b7.jpg",
        "isFeatured": false,
        "isFeaturedOnHomepage": false
    },
    "downloadUrl": "",
    "status": "pending",
    "updatedAt": "2026-06-10T13:53:14.333Z",
    "createdAt": "2026-06-10T13:53:14.333Z"
}
```

Get Export Requests
-------------------

```http
GET /v1/export-requests HTTP/1.1
```

### Response Body

```json
[
    {
        "uuid": "0b212e00-99a3-430b-b7a8-4e584d2c6dbb",
        "name": "Export Products",
        "format": "products-json",
        "pagesCount": 20,
        "category": {
            "uuid": "b14e3337-9c1e-4014-83a1-c2c0984cd44a",
            "slug": "women-t-shirts",
            "nameEn": "T-shirts",
            "nameAr": "تيشيرتات",
            "pricingFactor": "7",
            "discountPercentage": "35",
            "thumbnailUrl": "s3://categories/509692fb-571b-4893-8b15-254d084fc1b7.jpg",
            "isFeatured": false,
            "isFeaturedOnHomepage": false
        },
        "downloadUrl": "s3://exports/70846f73-b6cf-4414-b0e3-969d6303a77b.json",
        "status": "completed",
        "updatedAt": "2026-06-10T13:53:14.333Z",
        "createdAt": "2026-06-10T13:53:14.333Z"
    },
    {
        "uuid": "00e45502-a8cd-4d09-8526-ca447d85b74a",
        "name": "Export Products",
        "format": "products-json",
        "pagesCount": 20,
        "category": {
            "uuid": "b14e3337-9c1e-4014-83a1-c2c0984cd44a",
            "slug": "women-t-shirts",
            "nameEn": "T-shirts",
            "nameAr": "تيشيرتات",
            "pricingFactor": "7",
            "discountPercentage": "35",
            "thumbnailUrl": "s3://categories/509692fb-571b-4893-8b15-254d084fc1b7.jpg",
            "isFeatured": false,
            "isFeaturedOnHomepage": false
        },
        "downloadUrl": "",
        "status": "stopped",
        "updatedAt": "2026-06-10T13:51:00.538Z",
        "createdAt": "2026-06-10T13:50:04.274Z"
    }
]
```

Get Export Request
------------------

```http
GET /v1/export-requests/<export-request-uuid> HTTP/1.1
```

### Response Body

```json
{
    "uuid": "0b212e00-99a3-430b-b7a8-4e584d2c6dbb",
    "name": "Export Products",
    "format": "products-json",
    "pagesCount": 20,
    "category": {
        "uuid": "b14e3337-9c1e-4014-83a1-c2c0984cd44a",
        "slug": "women-t-shirts",
        "nameEn": "T-shirts",
        "nameAr": "تيشيرتات",
        "pricingFactor": "7",
        "discountPercentage": "35",
        "thumbnailUrl": "s3://categories/509692fb-571b-4893-8b15-254d084fc1b7.jpg",
        "isFeatured": false,
        "isFeaturedOnHomepage": false
    },
    "downloadUrl": "",
    "status": "stopped",
    "updatedAt": "2026-06-10T13:54:01.695Z",
    "createdAt": "2026-06-10T13:53:14.333Z"
}
```

Update Export Request
---------------------

```http
PUT /v1/export-requests/<export-request-uuid> HTTP/1.1
```

### Request Body

```json
{
    "name": "Export Products"
}
```

### Response Body

```json
{
    "uuid": "0ebabc7e-530a-4217-a313-21a7c1cbd284",
    "name": "Export Products",
    "format": "products-csv",
    "pagesCount": 20,
    "downloadUrl": "s3://exports/b5e68d51-6682-4cb5-9030-426247f3e914.csv",
    "status": "completed",
    "updatedAt": "2026-06-10T08:39:00.706Z",
    "createdAt": "2026-06-10T08:37:20.991Z"
}
```

Update Export Request Status
----------------------------

```http
PATCH /v1/export-requests/<export-request-uuid>/status HTTP/1.1
```

| Status | Description |
|---|---|
| pending | The request has been submitted successfully and is waiting to be processed |
| processing | The request is being processed |
| completed | The request is completed and the result can be downloaded from s3 |
| canceled | The request has been canceled by the user. |
| stopped | The request has been stopped by the server due to an error. |

### Request Body

```json
{
    "status": "canceled"
}
```

### Response Body

```json
{
    "uuid": "0ebabc7e-530a-4217-a313-21a7c1cbd284",
    "name": "Export Products",
    "format": "products-csv",
    "pagesCount": 20,
    "downloadUrl": "s3://exports/b5e68d51-6682-4cb5-9030-426247f3e914.csv",
    "status": "canceled",
    "updatedAt": "2026-06-10T08:55:40.853Z",
    "createdAt": "2026-06-10T08:37:20.991Z"
}
```

Delete Export Request
---------------------

```http
DELETE /v1/export-requests/<export-request-uuid> HTTP/1.1
```

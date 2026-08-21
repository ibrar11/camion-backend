Inventory REST API
==================

This document includes the documentation of inventory module.

Procedure to Create Your First Product
--------------------------------------

Follow the following steps to create your first product. Your can find the documentation of each step below.

1. Create your warehouse.
2. Create your product.
3. Create your product options.
4. Create your product option values.
5. Create your product variants.
6. Create your product variant images.
7. Upload attachments.

Warehouse API
=============

> [!IMPORTANT]
> You must include your access token as a `Bearer` token in the Authorization header. Your account must be active while making these requests.

Create a warehouse
------------------

> [!IMPORTANT]
> Required roles: `SuperAdmin`, `Admin`, `Manager`

```http
POST /v1/warehouses HTTP/1.1
```

Parameter Name | Required | Type | Description
---------------|----------|------|------------
name | Yes | String | Name of your warehouse
code | Yes | String | A short unique code name of the warehouse
addressLine1 | Yes | String | Address line 1
addressLine2 | No | String | Address line 2
country | Yes | String | The country in which the warehouse is based in, must be 3 letter ISO country name.
state | Yes | String | The state in which the warehouse is based in
city | Yes | String | The city in which the warehouse is based in
contactName | No | String | Name of the warehouse contact person
phone | No | String | Contact phone number
postcode | No | String | Postal/ZIP code
gulltransWarehouseId | No | String | Gulltrans warehouse ID used when creating procurement orders
gulltransUserId | No | String | Gulltrans user ID used when creating procurement orders

### Request Body
```json
{
    "name": "1688",
    "code": "1688",
    "addressLine1": "Example Road",
    "addressLine2": "Example Building",
    "country": "CHN",
    "state": "Xinjiang",
    "city": "Xinjiang",
    "contactName": "John Doe",
    "phone": "+971501234567",
    "postcode": "00000",
    "gulltransWarehouseId": "12345",
    "gulltransUserId": "67890"
}
```

### Response Body
```json
{
    "uuid": "09d89f39-755b-4959-a5df-654c4f28c35f",
    "name": "1688",
    "code": "1688",
    "addressLine1": "Example Road",
    "addressLine2": "Example Building",
    "country": "CHN",
    "countryCode": null,
    "state": "Xinjiang",
    "city": "Xinjiang",
    "postcode": "00000",
    "contactName": "John Doe",
    "phone": "+971501234567",
    "gulltransWarehouseId": "12345",
    "gulltransUserId": "67890",
    "isActive": true
}
```

Retrieve Warehouses
-------------------

> [!IMPORTANT]
> Required roles: `SuperAdmin`, `Admin`, `Manager`, `User`

```http
GET /v1/warehouses HTTP/1.1
```

### Query Parameters
Name | Description | Default
-----|-------------|--------
filters | A JSON string containing your search term, or any advanced search parameters. | `{}`
sort | The order in which we need to sort results |
pageNumber | The current page number | 1
itemsPerPage | The number of results to retrieve in the response | 100

### Response Body
```json
[
    {
        "uuid": "09d89f39-755b-4959-a5df-654c4f28c35f",
        "name": "1688 (Partner)",
        "code": "1688",
        "addressLine1": "Example Road",
        "addressLine2": "Example Building",
        "country": "China",
        "countryCode": null,
        "state": "Xingyang",
        "city": "Xingyang",
        "postcode": null,
        "contactName": null,
        "phone": null,
        "gulltransWarehouseId": "12345",
        "gulltransUserId": "67890",
        "isActive": true
    }
]
```

Retrieve Warehouse
------------------

> [!IMPORTANT]
> Required roles: `SuperAdmin`, `Admin`, `Manager`, `User`

```http
GET /v1/warehouses/<warehouse-uuid> HTTP/1.1
```

### Response Body
```json
{
    "uuid": "09d89f39-755b-4959-a5df-654c4f28c35f",
    "name": "1688 (Partner)",
    "code": "1688",
    "addressLine1": "Example Road",
    "addressLine2": "Example Building",
    "country": "China",
    "countryCode": null,
    "state": "Xingyang",
    "city": "Xingyang",
    "postcode": null,
    "contactName": null,
    "phone": null,
    "gulltransWarehouseId": "12345",
    "gulltransUserId": "67890",
    "isActive": true
}
```

Update Warehouse
----------------

> [!IMPORTANT]
> Required roles: `SuperAdmin`, `Admin`, `Manager`

```http
PUT /v1/warehouses/<warehouse-uuid> HTTP/1.1
```

Parameter Name | Required | Type | Description
---------------|----------|------|------------
name | Yes | String | Name of your warehouse
code | Yes | String | A short unique code name of the warehouse
addressLine1 | Yes | String | Address line 1
addressLine2 | No | String | Address line 2
country | Yes | String | The country in which the warehouse is based in, must be 3 letter ISO country name.
state | Yes | String | The state in which the warehouse is based in
city | Yes | String | The city in which the warehouse is based in
contactName | No | String | Name of the warehouse contact person
phone | No | String | Contact phone number
postcode | No | String | Postal/ZIP code
gulltransWarehouseId | No | String | Gulltrans warehouse ID used when creating procurement orders
gulltransUserId | No | String | Gulltrans user ID used when creating procurement orders

### Request Body
```json
{
    "name": "1688 (Partner)",
    "code": "1688",
    "addressLine1": "Example Road",
    "addressLine2": "Example Building",
    "country": "CHN",
    "state": "Xingyang",
    "city": "Xingyang",
    "contactName": "John Doe",
    "phone": "+971501234567",
    "postcode": "00000",
    "gulltransWarehouseId": "12345",
    "gulltransUserId": "67890"
}
```

### Response Body
```json
{
    "uuid": "09d89f39-755b-4959-a5df-654c4f28c35f",
    "name": "1688 (Partner)",
    "code": "1688",
    "addressLine1": "Example Road",
    "addressLine2": "Example Building",
    "country": "CHN",
    "countryCode": null,
    "state": "Xingyang",
    "city": "Xingyang",
    "postcode": "00000",
    "contactName": "John Doe",
    "phone": "+971501234567",
    "gulltransWarehouseId": "12345",
    "gulltransUserId": "67890",
    "isActive": true
}
```

Delete Warehouse
----------------

> [!IMPORTANT]
> Required roles: `SuperAdmin`, `Admin`, `Manager`

```http
DELETE /v1/warehouses/<warehouse-uuid> HTTP/1.1
```

Categories API
==============
Categories are a way to organize products into logical groups so both your system and your users can understand what product belongs where.

> [!IMPORTANT]
> You must include your access token as a `Bearer` token in the Authorization header. Your account must be active while making these requests.

Create a Category
-----------------

> [!IMPORTANT]
> Required roles: `SuperAdmin`, `Admin`, `Manager`

```http
POST /v1/categories HTTP/1.1
```

Parameter Name | Required | Type | Description
---------------|----------|------|------------
parentUUID | Yes | String | The UUID of the parent category. Must be null for root categories
slug | Yes | String | A unique string that identifies the category
name.en | Yes | String | The name of the category in English
name.ar | Yes | String | The name of the category in Arabic
pricingFactor | Yes | Number | The pricing factor of the category
discountPercentage | Yes | Number | The discount percentage of the category
isFeatured | Yes | Boolean | Determines if the category is featured.
isFeaturedOnHomepage | Yes | Boolean | Determines if the category is featured on the homepage

### Request Body
```json
{
    "parentUUID": null,
    "slug": "iphones-nine",
    "name": {
        "en": "iPhones",
        "ar": "أحذية رياضية"
    },
    "pricingFactor": 10,
    "discountPercentage": 5,
    "isFeatured": true,
    "isFeaturedOnHomepage": true
}
```

### Response Body
```json
{
    "uuid": "5d32adfe-cdaa-4d19-9a3b-c2374b2a0aab",
    "slug": "iphones-nine",
    "nameEn": "iPhones",
    "nameAr": "أحذية رياضية",
    "pricingFactor": 10,
    "discountPercentage": 5,
    "isFeatured": true,
    "isFeaturedOnHomepage": true,
    "parent": null
}
```

Retrieve Categories
-------------------

> [!IMPORTANT]
> Required roles: `SuperAdmin`, `Admin`, `Manager`, `User`

```http
GET /v1/categories HTTP/1.1
```

### Query Parameters
Name | Description | Default
-----|-------------|--------
filters | A JSON string containing your search term, or any advanced search parameters. | `{}`
sort | The order in which we need to sort results |
pageNumber | The current page number | 1
itemsPerPage | The number of results to retrieve in the response | 100

### Response Body
```json
[
    {
        "uuid": "5d32adfe-cdaa-4d19-9a3b-c2374b2a0aab",
        "slug": "sneakers",
        "nameEn": "sneakers",
        "nameAr": "أحذية رياضية",
        "pricingFactor": "1.2",
        "discountPercentage": "5",
        "isFeatured": true,
        "isFeaturedOnHomepage": true,
        "children": [
            {
                "uuid": "f5d519fa-9b21-435c-97ab-8c06e1fb782c",
                "slug": "sneakers-shoes",
                "nameEn": "sneakers-shoes",
                "nameAr": "أحذية رياضية",
                "pricingFactor": "1.2",
                "discountPercentage": "5",
                "isFeatured": true,
                "isFeaturedOnHomepage": true,
                "children": []
            }
        ],
        "productsCount": 108
    }
]
```

Retrieve a category
-------------------

> [!IMPORTANT]
> Required roles: `SuperAdmin`, `Admin`, `Manager`, `User`

```http
GET /v1/categories/<category-uuid> HTTP/1.1
```

### Response Body
```json
{
    "uuid": "e45cc8ed-72ec-4780-885c-5a378d85822a",
    "slug": "sneakers",
    "nameEn": "sneakers",
    "nameAr": "sneakers",
    "pricingFactor": 1.4,
    "discountPercentage": 5,
    "isFeatured": true,
    "isFeaturedOnHomepage": true,
    "productsCount": 108
}
```

Update a category
-----------------

> [!IMPORTANT]
> Required roles: `SuperAdmin`, `Admin`, `Manager`

```http
PUT /v1/categories/<category-uuid> HTTP/1.1
```

Parameter Name | Required | Type | Description
---------------|----------|------|------------
slug | Yes | String | A unique string that identifies the category
name.en | Yes | String | The name of the category in English
name.ar | Yes | String | The name of the category in Arabic
pricingFactor | Yes | Number | The pricing factor of the category
discountPercentage | Yes | Number | The discount percentage on products in this category
isFeatured | Yes | Boolean | Determines if the category is featured.
isFeaturedOnHomepage | Yes | Boolean | Determines if the category is featured on the homepage

### Request Body
```json
{
    "slug": "sneakers",
    "name": {
        "en": "Sneakers",
        "ar": "أحذية رياضية"
    },
    "pricingFactor": 1.4,
    "discountPercentage": 5,
    "isFeatured": true,
    "isFeaturedOnHomepage": false
}
```

### Response Body
```json
{
    "uuid": "fbb6e9d6-60e3-4d45-8dba-8cd01e6f6e52",
    "slug": "sneakers",
    "nameEn": "Sneakers",
    "nameAr": "أحذية رياضية",
    "pricingFactor": 1.4,
    "discountPercentage": 5,
    "isFeatured": true,
    "isFeaturedOnHomepage": false
}
```

Delete a category
-----------------

> [!IMPORTANT]
> Required roles: `SuperAdmin`, `Admin`, `Manager`

```http
DELETE /v1/categories/<category-uuid> HTTP/1.1
```

Products API
============

> [!IMPORTANT]
> You must include your access token as a `Bearer` token in the Authorization header. Your account must be active while making these requests.

Example Product Document
------------------------

> [!NOTE]
> Once all the parameters of a product are set. We should get the following sample document from the products api.

```json
{
    "uuid": "c023bd4c-e8ce-453e-b41b-07b42c7f0d6d",
    "slug": "iphone-17",
    "title": "iPhone 17",
    "titleAr": "آيفون 17",
    "brief": "From $799 or $33.29/mo. per month for 24 months",
    "briefAr": "ابتداءً من 799 دولارًا أو 33.29 دولارًا شهريًا لمدة 24 شهرًا",
    "description": "Your new iPhone awaits. Make it yours.",
    "descriptionAr": "جهاز آيفون الجديد بانتظارك. اجعله ملكك.",
    "descriptionHtml": "<b>Your new iPhone awaits. Make it yours</b>",
    "descriptionHtmlAr": "<b>Your new iPhone awaits. Make it yours</b>",
    "status": "ACTIVE",
    "attachments": [
        {
            "uuid": "c3390237-08e1-4d21-8992-a4a722501d87",
            "mediaUrl": "s3://attachments/1dd28f63-23e1-4b64-b6d5-7f9a26f894fd.webp",
            "mediaType": "image"
        }
    ]
    "options": [
        {
            "uuid": "53487190-70a4-4eae-81e8-397df22bf78b",
            "name": "Color",
            "position": "0",
            "values": [
                {
                    "uuid": "6e423590-34e3-4a70-9bfe-b5257ed691a4",
                    "value": "Lavender",
                    "position": "0"
                },
                {
                    "uuid": "d0f60727-004e-43e5-bab5-af7fbe5de099",
                    "value": "Sage",
                    "position": "1"
                },
                {
                    "uuid": "58fde376-2250-48fc-a966-2f425bfe07b6",
                    "value": "Mist Blue",
                    "position": "2"
                },
                {
                    "uuid": "78f5b805-2513-4634-9628-3c5ce785c63f",
                    "value": "White",
                    "position": "3"
                },
                {
                    "uuid": "32c822bf-cddb-4e7e-939d-894842bab6b9",
                    "value": "Black",
                    "position": "4"
                }
            ]
        },
        {
            "uuid": "881f85ef-a333-42f8-ae3d-08cc5d2df6f9",
            "name": "Storage",
            "position": "1",
            "values": [
                {
                    "uuid": "1a5b73f2-423b-49fd-a005-362e24b6115b",
                    "value": "256 GB",
                    "position": "0"
                },
                {
                    "uuid": "3e587518-cbd3-4296-8a3b-8b97ceef899c",
                    "value": "512 GB",
                    "position": "1"
                }
            ]
        }
    ],
    "variants": [
        {
            "uuid": "45078e0a-7637-48e5-a7d5-a8645b1ae66f",
            "title": "iPhone 17 Lavender 256 GB",
            "titleAr": "iPhone 17 Lavender 256 GB",
            "sku": "iphone-17-lavender-256",
            "barcode": "10000",
            "price": {
                "amount": "1000",
                "currencyCode": "qar"
            },
            "weight": {
                "amount": "1",
                "unit": "kg"
            },
            "dimensions": {
                "width": "1000",
                "height": "1000",
                "length": "1000",
                "unit": "in"
            },
            "optionValues": [
                {
                    "uuid": "67283ddc-86c4-4ddf-a7c2-c70251dfab96",
                    "optionValue": {
                        "uuid": "6e423590-34e3-4a70-9bfe-b5257ed691a4",
                        "value": "Lavender",
                        "position": "0"
                    }
                },
                {
                    "uuid": "b02d9cab-871b-49f3-84b4-20461567ca48",
                    "optionValue": {
                        "uuid": "1a5b73f2-423b-49fd-a005-362e24b6115b",
                        "value": "256 GB",
                        "position": "0"
                    }
                }
            ]
        }
    ]
}
```

Create a Product
----------------

> [!IMPORTANT]
> Required roles: `SuperAdmin`, `Admin`

```http
POST /v1/products HTTP/1.1
```

Parameter Name | Required | Type | Description
---------------|----------|------|------------
slug | Yes | String | A unique short slug of the product
title.en | Yes | String | Title of the product in English
title.ar | Yes | String | Title of the product in Arabic
brief.en | Yes | String | Short brief of the product in English
brief.ar | Yes | String | Short brief of the product in Arabic
description.en | Yes | String | Description of the product in English
description.ar | Yes | String | Description of the product in Arabic
descriptionHtml.en | Yes | String | HTML Description of the product in English
descriptionHtml.ar | Yes | String | HTML Description of the product in Arabic
categories | No | List[UUID] | A list of UUIDs of categories

### Request Body
```json
{
    "slug": "iphone-17",
    "title": {
        "en": "iPhone 17",
        "ar": "آيفون 17"
    },
    "brief": {
        "en": "From $799 or $33.29/mo. per month for 24 months",
        "ar": "ابتداءً من 799 دولارًا أو 33.29 دولارًا شهريًا لمدة 24 شهرًا"
    },
    "description": {
        "en": "Your new iPhone awaits. Make it yours.",
        "ar": "جهاز آيفون الجديد بانتظارك. اجعله ملكك."
    },
    "descriptionHtml": {
        "en": "<b>Your new iPhone awaits. Make it yours</b>",
        "ar": "<b>Your new iPhone awaits. Make it yours</b>"
    },
    "categories": [
        "e45cc8ed-72ec-4780-885c-5a378d85822a"
    ]
}
```

### Response Body
```json
{
    "uuid": "60b9ec90-0875-4319-b471-14153f9e5835",
    "slug": "iphone-17",
    "titleEn": "iPhone 17",
    "titleAr": "آيفون 17",
    "briefEn": "From $799 or $33.29/mo. per month for 24 months",
    "briefAr": "ابتداءً من 799 دولارًا أو 33.29 دولارًا شهريًا لمدة 24 شهرًا",
    "descriptionEn": "Your new iPhone awaits. Make it yours.",
    "descriptionAr": "جهاز آيفون الجديد بانتظارك. اجعله ملكك.",
    "descriptionHtmlEn": "<b>Your new iPhone awaits. Make it yours</b>",
    "descriptionHtmlAr": "<b>Your new iPhone awaits. Make it yours</b>",
    "status": "DRAFT"
}
```

Retrieve Products
-----------------

> [!IMPORTANT]
> Required roles: `SuperAdmin`, `Admin`, `Manager`, `User`

```http
GET /v1/products HTTP/1.1
```

### Query Parameters
Name | Description | Default
-----|-------------|--------
filters | A JSON string containing your search term, or any advanced search parameters. | `{}`
sort | The order in which we need to sort results |
pageNumber | The current page number | 1
itemsPerPage | The number of results to retrieve in the response | 100

### Filters
Filter | Syntax
-------|-------
Get products by a category | `filters={"slug":"sneakers"}`

### Response Body
```json
[
    {
        "uuid": "60b9ec90-0875-4319-b471-14153f9e5835",
        "slug": "iphone-17",
        "titleEn": "iPhone 17",
        "titleAr": "آيفون 17",
        "briefEn": "From $799 or $33.29/mo. per month for 24 months",
        "briefAr": "ابتداءً من 799 دولارًا أو 33.29 دولارًا شهريًا لمدة 24 شهرًا",
        "descriptionEn": "Your new iPhone awaits. Make it yours.",
        "descriptionAr": "جهاز آيفون الجديد بانتظارك. اجعله ملكك.",
        "descriptionHtmlEn": "<b>Your new iPhone awaits. Make it yours</b>",
        "descriptionHtmlAr": "<b>Your new iPhone awaits. Make it yours</b>",
        "status": "DRAFT",
        "procurementStatus": true, //by default true for products that are available on 1688, will be false for products that are removed from 1688.
        "resyncStatus": false, //by default false, will be true for products whose variants have been changed on 1688 and need to be resync.
        "options": [],
        "variants": []
    }
]
```

Retrieve Product
----------------

> [!IMPORTANT]
> Required roles: `SuperAdmin`, `Admin`, `Manager`, `User`

```http
GET /v1/products/<product-uuid> HTTP/1.1
```

### Response Body
```json
{
    "uuid": "60b9ec90-0875-4319-b471-14153f9e5835",
    "slug": "iphone-17",
    "titleEn": "iPhone 17",
    "titleAr": "آيفون 17",
    "briefEn": "From $799 or $33.29/mo. per month for 24 months",
    "briefAr": "ابتداءً من 799 دولارًا أو 33.29 دولارًا شهريًا لمدة 24 شهرًا",
    "descriptionEn": "Your new iPhone awaits. Make it yours.",
    "descriptionAr": "جهاز آيفون الجديد بانتظارك. اجعله ملكك.",
    "descriptionHtmlEn": "<b>Your new iPhone awaits. Make it yours</b>",
    "descriptionHtmlAr": "<b>Your new iPhone awaits. Make it yours</b>",
    "status": "DRAFT",
    "procurementStatus": true, //by default true for products that are available on 1688, will be false for products that are removed from 1688.
    "resyncStatus": false, //by default false, will be true for products whose variants have been changed on 1688 and need to be resync.
    "options": [],
    "variants": []
}
```

Update Product
--------------

> [!IMPORTANT]
> Required roles: `SuperAdmin`, `Admin`

```http
PUT /v1/products/<product-uuid> HTTP/1.1
```

Parameter Name | Required | Type | Description
---------------|----------|------|------------
title.en | Yes | String | Title of the product in English
title.ar | Yes | String | Title of the product in Arabic
brief.en | Yes | String | Short brief of the product in English
brief.ar | Yes | String | Short brief of the product in Arabic
description.en | Yes | String | Description of the product in English
description.ar | Yes | String | Description of the product in Arabic
descriptionHtml.en | Yes | String | HTML Description of the product in English
descriptionHtml.ar | Yes | String | HTML Description of the product in Arabic

### Request Body
```json
{
    "title": {
        "en": "iPhone 17",
        "ar": "آيفون 17"
    },
    "brief": {
        "en": "From $899 or $33.29/mo. per month for 24 months",
        "ar": "ابتداءً من 899 دولارًا أو 33.29 دولارًا شهريًا لمدة 24 شهرًا"
    },
    "description": {
        "en": "Your new iPhone awaits. Make it yours.",
        "ar": "جهاز آيفون الجديد بانتظارك. اجعله ملكك."
    },
    "descriptionHtml": {
        "en": "<b>Your new iPhone awaits. Make it yours</b>",
        "ar": "<b>Your new iPhone awaits. Make it yours</b>"
    }
}
```

### Response Body
```json
{
    "uuid": "60b9ec90-0875-4319-b471-14153f9e5835",
    "slug": "iphone-17",
    "titleEn": "iPhone 17",
    "titleAr": "آيفون 17",
    "briefEn": "From $899 or $33.29/mo. per month for 24 months",
    "briefAr": "ابتداءً من 899 دولارًا أو 33.29 دولارًا شهريًا لمدة 24 شهرًا",
    "descriptionEn": "Your new iPhone awaits. Make it yours.",
    "descriptionAr": "جهاز آيفون الجديد بانتظارك. اجعله ملكك.",
    "descriptionHtmlEn": "<b>Your new iPhone awaits. Make it yours</b>",
    "descriptionHtmlAr": "<b>Your new iPhone awaits. Make it yours</b>",
    "status": "DRAFT"
}
```

Update Product Slug
-------------------

> [!IMPORTANT]
> Required roles: `SuperAdmin`, `Admin`

### API Endpoint
```http
PUT /v1/products/<product-uuid>/slug HTTP/1.1
```

Parameter Name | Required | Type | Description
---------------|----------|------|------------
slug | Yes | String | A unique short slug of the product

### Request Body
```json
{
    "slug": "iphone-17-pro"
}
```

### Response Body
```json
{
    "uuid": "60b9ec90-0875-4319-b471-14153f9e5835",
    "slug": "iphone-17-pro",
    "titleEn": "iPhone 17",
    "titleAr": "آيفون 17",
    "briefEn": "From $899 or $33.29/mo. per month for 24 months",
    "briefAr": "ابتداءً من 899 دولارًا أو 33.29 دولارًا شهريًا لمدة 24 شهرًا",
    "descriptionEn": "Your new iPhone awaits. Make it yours.",
    "descriptionAr": "جهاز آيفون الجديد بانتظارك. اجعله ملكك.",
    "descriptionHtmlEn": "<b>Your new iPhone awaits. Make it yours</b>",
    "descriptionHtmlAr": "<b>Your new iPhone awaits. Make it yours</b>",
    "status": "DRAFT"
}
```

Update Product Status
---------------------

> [!IMPORTANT]
> Required roles: `SuperAdmin`, `Admin`, `Manager`

```http
PUT /v1/products/<product-uuid>/status HTTP/1.1
```

Parameter Name | Required | Type | Description
---------------|----------|------|------------
status | Yes | String | The current status of the product. Possible values are `ACTIVE`, `ARCHIVED` and `DRAFT`

### Request Body
```json
{
    "status": "ACTIVE"
}
```

### Response Body
```json
{
    "uuid": "60b9ec90-0875-4319-b471-14153f9e5835",
    "slug": "iphone-17-pro",
    "titleEn": "iPhone 17",
    "titleAr": "آيفون 17",
    "briefEn": "From $899 or $33.29/mo. per month for 24 months",
    "briefAr": "ابتداءً من 899 دولارًا أو 33.29 دولارًا شهريًا لمدة 24 شهرًا",
    "descriptionEn": "Your new iPhone awaits. Make it yours.",
    "descriptionAr": "جهاز آيفون الجديد بانتظارك. اجعله ملكك.",
    "descriptionHtmlEn": "<b>Your new iPhone awaits. Make it yours</b>",
    "descriptionHtmlAr": "<b>Your new iPhone awaits. Make it yours</b>",
    "status": "ACTIVE"
}
```

Update Product Featured Image
-----------------------------

> [!IMPORTANT]
> Required roles: `SuperAdmin`, `Admin`, `Manager`

```http
PUT /v1/products/<product-uuid>/featured-image HTTP/1.1
```

Parameter Name | Required | Type | Description
---------------|----------|------|------------
imageUUID | Yes | String | The UUID of the product variant image

### Request Body
```json
{
    "imageUUID": "e23e83b6-48b9-436b-84c1-617a9bc5a60e"
}
```

### Response Body
```json
{
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
    "featuredImageUrl": "s3://product-images/320e44b7-cc8c-40e1-ad6b-d592df0f7888.webp",
    "featuredThumbnailUrl": "s3://product-images/0f8f43f6-8c88-41d3-a175-4ff69a45feb9.webp",
    "status": "active",
    "shopId": null,
    "shopName": null,
    "procurementId": null,
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
}
```

Update Product Sizechart Image
------------------------------

> [!IMPORTANT]
> Required roles: `SuperAdmin`, `Admin`, `Manager`

```http
PUT /v1/products/<product-uuid>/sizechart HTTP/1.1
```

### Request Body

```bash
curl --location --request PUT 'http://localhost:8000/v1/products/<product-uuid>/sizechart' \
--header 'Authorization: Bearer <YOUR_ACCESS_TOKEN>' \
--form 'file=@"/C:/Users/Gloria/Pictures/Test/m_Direct_Media____YWCMXRBDU8.jpg"'
```

### Response Body

```json
{
    "uuid": "8ba85e9b-ebae-4a5b-9165-55cc438ef0d4",
    "slug": "triangle-leopard-print-silk-printed-silk-scarf-w-1035742933292",
    "titleEn": "Triangle Leopard Print Silk Printed Silk Scarf Women's Long Scarf Spring and Summer Shawl",
    "titleAr": "Triangle Leopard Print Silk Printed Silk Scarf Women's Long Scarf Spring and Summer Shawl",
    "briefEn": "Triangle Leopard Print Silk Printed Silk Scarf Women's Long Scarf Spring and Summer Shawl",
    "briefAr": "Triangle Leopard Print Silk Printed Silk Scarf Women's Long Scarf Spring and Summer Shawl",
    "descriptionEn": "Triangle Leopard Print Silk Printed Silk Scarf Women's Long Scarf Spring and Summer Shawl",
    "descriptionAr": "وشاح حرير مطبوع بنقشة فهد مثلث، وشاح طويل نسائي لفصلي الربيع والصيف، شال",
    "descriptionHtmlEn": "FASHION TREND\n品名材质尺寸克重包装JY260409棉麻手感/聚酯纤维88*180cm约100g单个opp\n测量说明：尺寸均是平铺手工测量，由于测量方法不同，可能会有1~3CM的允许范围内的误差。\n温馨提示：围巾纺织品面料特点，不能保证每条围巾都无暇，部分有轻微的面料飞纱，勾丝，小染色等完全不影响佩戴效果和牢固效果，请在意的亲请慎拍。\n为什么选择我们？\n厂家直销，货源稳定；自主设计，款式新颖；实力雄厚，价格合理",
    "descriptionHtmlAr": "FASHION TREND\n品名材质尺寸克重包装JY260409棉麻手感/聚酯纤维88*180cm约100g单个opp\n测量说明：尺寸均是平铺手工测量，由于测量方法不同，可能会有1~3CM的允许范围内的误差。\n温馨提示：围巾纺织品面料特点，不能保证每条围巾都无暇，部分有轻微的面料飞纱，勾丝，小染色等完全不影响佩戴效果和牢固效果，请在意的亲请慎拍。\n为什么选择我们？\n厂家直销，货源稳定；自主设计，款式新颖；实力雄厚，价格合理",
    "featuredImageUrl": "s3://product-images/af28d700-ea28-4a6c-80c4-4cbd80e642b0.webp",
    "featuredThumbnailUrl": "s3://product-images/5a9be6a8-d192-4af3-b4b3-7bfbb0886b51.webp",
    "sizechartUrl": "s3://sizecharts/57b2df31-c0be-410b-b5cd-3070a766e211.webp",
    "status": "active",
    "shopId": "BBB1xC2MM5HFhsw0VHNbzeHVA",
    "shopName": "德清新景悦服饰有限公司",
    "procurementId": "1035742933292",
    "salesCount": 0,
    "likesCount": 0,
    "reviewsCount": 0,
    "viewsCount": 0,
    "ratingSum": 0,
    "ratingCount": 0,
    "ratingAvg": "0",
    "ratingOneStarCount": 0,
    "ratingTwoStarCount": 0,
    "ratingThreeStarCount": 0,
    "ratingFourStarCount": 0,
    "ratingFiveStarCount": 0
}
```

Delete Product Sizechart Image
------------------------------

> [!IMPORTANT]
> Required roles: `SuperAdmin`, `Admin`, `Manager`

```http
DELETE /v1/products/<product-uuid>/sizechart HTTP/1.1
```

Delete Product
--------------

> [!IMPORTANT]
> Required roles: `SuperAdmin`, `Admin`

```http
DELETE /v1/products/<product-uuid> HTTP/1.1
```

Products Options
================

Products options are the choices a customer gets when they buy a product, eg. Color, Size or Memory etc.

Create a Product Option
-----------------------

> [!IMPORTANT]
> Required roles: `SuperAdmin`, `Admin`

```http
POST /v1/products/<product-uuid>/options HTTP/1.1
```

Parameter Name | Required | Type | Description
---------------|----------|------|------------
name | Yes | String | Name of the option
position | Yes | Number | Display position of the option

### Request Body
```json
{
    "name": {
        "en": "Storage",
        "ar": "Storage (in Arabic)"
    },
    "position": 0
}
```

### Response Body
```json
{
    "uuid": "5926e2de-5e66-4e30-ba75-ecda7fbf4522",
    "nameEn": "Storage",
    "nameAr": "Storage (in Arabic)",
    "position": 0,
    "product": {
        "uuid": "60b9ec90-0875-4319-b471-14153f9e5835",
        "slug": "iphone-17-pro",
        "title": "iPhone 17",
        "titleAr": "آيفون 17",
        "brief": "From $899 or $33.29/mo. per month for 24 months",
        "briefAr": "ابتداءً من 899 دولارًا أو 33.29 دولارًا شهريًا لمدة 24 شهرًا",
        "description": "Your new iPhone awaits. Make it yours.",
        "descriptionAr": "جهاز آيفون الجديد بانتظارك. اجعله ملكك.",
        "descriptionHtml": "<b>Your new iPhone awaits. Make it yours</b>",
        "descriptionHtmlAr": "<b>Your new iPhone awaits. Make it yours</b>",
        "status": "ACTIVE"
    }
}
```

Get Product Options
-------------------

> [!IMPORTANT]
> Required roles: `SuperAdmin`, `Admin`

```http
GET /v1/products/<product-uuid>/options HTTP/1.1
```

### Query Parameters
Name | Description | Default
-----|-------------|--------
filters | A JSON string containing your search term, or any advanced search parameters. | `{}`
sort | The order in which we need to sort results |
pageNumber | The current page number | 1
itemsPerPage | The number of results to retrieve in the response | 100

### Response Body
```json
[
    {
        "uuid": "e7685ad8-fa88-41f3-bc97-745fc41fbad2",
        "nameEn": "Size",
        "nameAr": "Size (In Arabic)",
        "position": "1"
    },
    {
        "uuid": "5926e2de-5e66-4e30-ba75-ecda7fbf4522",
        "nameEn": "Color",
        "nameAr": "Color (In Arabic)",
        "position": "0"
    }
]
```

Get Product Option
------------------

> [!IMPORTANT]
> Required roles: `SuperAdmin`, `Admin`

```http
GET /v1/products/<product-uuid>/options/<option-uuid> HTTP/1.1
```

### Response Body
```json
{
    "uuid": "e7685ad8-fa88-41f3-bc97-745fc41fbad2",
    "nameEn": "Size",
    "nameAr": "Size (In Arabic)",
    "position": "1"
}
```

Update Product Option
---------------------

> [!IMPORTANT]
> Required roles: `SuperAdmin`, `Admin`

```http
PUT /v1/products/<product-uuid>/options/<option-uuid> HTTP/1.1
```

Parameter Name | Required | Type | Description
---------------|----------|------|------------
name | Yes | String | Name of the option
position | Yes | Number | Display position of the option

### Request Body
```json
{
    "name": {
        "en": "Memory Size",
        "ar": "Memory Size (In Arabic)"
    },
    "position": 1
}
```

### Response Body
```json
{
    "uuid": "e7685ad8-fa88-41f3-bc97-745fc41fbad2",
    "nameEn": "Memory Size",
    "nameAr": "Memory Size (In Arabic)",
    "position": 1
}
```

Delete Product Option
---------------------

> [!IMPORTANT]
> Required roles: `SuperAdmin`, `Admin`

```http
DELETE /v1/products/<product-uuid>/options/<option-uuid> HTTP/1.1
```

Products Options Values
=======================

Products options values are the values a customer selects when they buy a product, eg. Color=Red, Size=Large or Memory=512GB etc.

Create Product Option Value
---------------------------

> [!IMPORTANT]
> Required roles: `SuperAdmin`, `Admin`

```http
POST /v1/products/<product-uuid>/options/<option-uuid>/values HTTP/1.1
```

Parameter Name | Required | Type | Description
---------------|----------|------|------------
value | Yes | String | Value of the option-value
position | Yes | Number | Display position of the option-value

### Request Body
```json
{
    "value": {
        "en": "Blue",
        "ar": "Blue (Arabic)"
    },
    "position": 0
}
```

### Response Body
```json
{
    "uuid": "cdb4ed20-04f9-407c-bcc6-0d0f8679ddfd",
    "valueEn": "Blue",
    "valueAr": "Blue (Arabic)",
    "position": 0
}
```

Retrieve Product Option Values
------------------------------

> [!IMPORTANT]
> Required roles: `SuperAdmin`, `Admin`

```http
GET /v1/products/<product-uuid>/options/<option-uuid>/values HTTP/1.1
```

### Query Parameters
Name | Description | Default
-----|-------------|--------
filters | A JSON string containing your search term, or any advanced search parameters. | `{}`
sort | The order in which we need to sort results |
pageNumber | The current page number | 1
itemsPerPage | The number of results to retrieve in the response | 100

### Response Body
```json
[
    {
        "uuid": "cdb4ed20-04f9-407c-bcc6-0d0f8679ddfd",
        "valueEn": "Blue",
        "valueAr": "Blue (Arabic)",
        "position": "0"
    }
]
```

Retrieve Product Option Value
-----------------------------

> [!IMPORTANT]
> Required roles: `SuperAdmin`, `Admin`

```http
GET /v1/products/<product-uuid>/options/<option-uuid>/values/<value-uuid> HTTP/1.1
```

### Response Body
```json
{
    "uuid": "cdb4ed20-04f9-407c-bcc6-0d0f8679ddfd",
    "valueEn": "Blue",
    "valueAr": "Blue (Arabic)",
    "position": "0"
}
```

Update Product Option Value
---------------------------

> [!IMPORTANT]
> Required roles: `SuperAdmin`, `Admin`

```http
PUT /v1/products/<product-uuid>/options/<option-uuid>/values/<value-uuid> HTTP/1.1
```

Parameter Name | Required | Type | Description
---------------|----------|------|------------
value | Yes | String | Value of the option-value
position | Yes | Number | Display position of the option-value

### Request Body
```json
{
    "value": {
        "en": "Red",
        "ar": "Red (Arabic)"
    },
    "position": 1
}
```

### Response Body
```json
{
    "uuid": "cdb4ed20-04f9-407c-bcc6-0d0f8679ddfd",
    "valueEn": "Red",
    "valueAr": "Red (Arabic)",
    "position": 1
}
```

Delete Product Option Value
---------------------------

> [!IMPORTANT]
> Required roles: `SuperAdmin`, `Admin`

```http
DELETE /v1/products/<product-uuid>/options/<option-uuid>/values/<value-uuid> HTTP/1.1
```

Product Variants
================

Create Product Variant
----------------------

> [!IMPORTANT]
Required roles: `SuperAdmin`, `Admin`

```http
PUT /v1/products/<product-uuid>/variants HTTP/1.1
```

Parameter Name | Required | Type | Description
---------------|----------|------|------------
warehouse | Yes | UUID | UUID of the warehouse from which this product-variant will be sourced
title.en | Yes | String | Title of the variant in English — must be specific to this variant (e.g. "Brown / Single size: 90-140cm"), not the product-level title
title.ar | Yes | String | Title of the variant in Arabic
sku | Yes | String | The sku of the variant
quantity | Yes | Number | The quantity of the variant in the warehouse
barcode | Yes | String | The unique barcode of the variant
price.amount | Yes | Number | The amount in which we will charge the customer
price.currencyCode | Yes | String | The currency code of the price amount
weight.amount | Yes | Number | The actual weight of this variant from the supplier. **Do not use placeholder values** — this is sent to JOP WMS for inbound declarations and affects shipping calculations.
weight.unit | Yes | String| The weight-unit of the variant. A value from, `g, kg, oz, lb` must be provided.
dimensions.width | Yes | Number | The actual width of this variant from the supplier. **Do not use placeholder values.**
dimensions.height | Yes | Number | The actual height of this variant from the supplier.
dimensions.length | Yes | Number | The actual length of this variant from the supplier.
dimensions.unit | Yes | String | The unit of measurement for dimensions. A value from, `mm, cm, m, km, in, ft, yd, mi` must be provided.
optionValues | No | List[UUID] | A list of UUIDs of option-values
skuMeta | Yes | Object | Supplier SKU metadata required for Gulltrans procurement orders. **Must be provided for any variant sourced from a 1688 supplier.** If omitted, `sku_info` will be sent as an empty object to Gulltrans, meaning the daigou agent cannot identify the correct color/size variant to purchase. See structure below.

> [!WARNING]
> **Procurement impact of missing or placeholder data**
>
> Variants created via the frontend without `skuMeta`, or with placeholder `weight`/`dimensions` values (e.g. `1 kg`, `1×1×1 mm`), will cause failures in the WMS dispatch flow:
> - `skuMeta: null` → Gulltrans receives `sku_info: {}` — the daigou agent cannot identify which supplier variant to buy (`spec_id` and `specs` are missing)
> - Placeholder weight → wrong total weight declared on JOP WMS inbound and wrong shipping estimates
> - Placeholder dimensions → wrong box size sent to WMS product sync
>
> Variants imported via the bulk procurement import API populate all three fields automatically from the supplier API response. When creating variants manually, always copy these values from the supplier listing.

**`skuMeta` object structure** (sourced from the 1688 supplier API at import time):

Field | Type | Description
------|------|------------
shop_id | String | Supplier's shop ID on 1688
shop_name | String | Supplier's shop name
spec_id | String | 1688 SKU spec ID — identifies the exact color/size combination
sku_img | String | URL of the SKU-specific image
min_order_quantity | String | Minimum order quantity as a string
batch_number | String | Batch number (usually `"1"`)
imgs | Array | Product-level images from the supplier
specs | Array | Array of `{ label, value }` pairs for each spec attribute (e.g. `[{ "label": "Color", "value": "Brown" }, { "label": "Size", "value": "Single size: 90-140cm" }]`)

### Request Body
```json
{
    "warehouse": "09d89f39-755b-4959-a5df-654c4f28c35f",
    "title": {
        "en": "Brown / Single size: 90-140cm",
        "ar": "بني / مقاس واحد: 90-140 سم"
    },
    "sku": "6063095111989",
    "quantity": 100,
    "barcode": "6063095111989",
    "price": {
        "amount": 1000,
        "currencyCode": "qar"
    },
    "weight": {
        "amount": 0.5,
        "unit": "kg"
    },
    "dimensions": {
        "width": 30,
        "height": 10,
        "length": 40,
        "unit": "cm"
    },
    "optionValues": [
        "443d0325-c769-49eb-8867-9287b18c2318"
    ],
    "skuMeta": {
        "shop_id": "BBByHrSBdD6rcCxxTgxjQEQ6g",
        "shop_name": "南通市飞凡梦纺织品有限公司",
        "spec_id": "1234567890",
        "sku_img": "https://...",
        "min_order_quantity": "1",
        "batch_number": "1",
        "imgs": [],
        "specs": [
            { "label": "Color", "value": "Brown" },
            { "label": "Size", "value": "Single size: 90-140cm" }
        ]
    }
}
```

### Response Body
```json
{
    "uuid": "f1f6fb3a-f1d1-43b3-95b6-e213a020ca08",
    "titleEn": "Brown / Single size: 90-140cm",
    "titleAr": "بني / مقاس واحد: 90-140 سم",
    "sku": "6063095111989",
    "barcode": "6063095111989",
    "price": {
        "amount": 1000,
        "currencyCode": "qar"
    },
    "weight": {
        "amount": 0.5,
        "unit": "kg"
    },
    "dimensions": {
        "width": 30,
        "height": 10,
        "length": 40,
        "unit": "cm"
    },
    "skuMeta": {
        "shop_id": "BBByHrSBdD6rcCxxTgxjQEQ6g",
        "shop_name": "南通市飞凡梦纺织品有限公司",
        "spec_id": "1234567890",
        "sku_img": "https://...",
        "min_order_quantity": "1",
        "batch_number": "1",
        "imgs": [],
        "specs": [
            { "label": "Color", "value": "Brown" },
            { "label": "Size", "value": "Single size: 90-140cm" }
        ]
    },
    "product": {
        "uuid": "4a91cd1d-c006-4fd9-af85-03c0275dab86",
        "slug": "light-luxury-sofa-cover",
        "titleEn": "Light Luxury Sofa Cover",
        "titleAr": "غطاء أريكة فاخر",
        "briefEn": "",
        "briefAr": "",
        "descriptionEn": "Light Luxury Sofa Cover",
        "descriptionAr": "غطاء أريكة فاخر",
        "descriptionHtmlEn": "<p>Light Luxury Sofa Cover</p>",
        "descriptionHtmlAr": "<p>غطاء أريكة فاخر</p>",
        "status": "active"
    }
}
```

Get Product Variants
--------------------

> [!IMPORTANT]
> Required roles: `SuperAdmin`, `Admin`

```http
GET /v1/products/<product-uuid>/variants HTTP/1.1
```

### Query Parameters
Name | Description | Default
-----|-------------|--------
filters | A JSON string containing your search term, or any advanced search parameters. | `{}`
sort | The order in which we need to sort results |
pageNumber | The current page number | 1
itemsPerPage | The number of results to retrieve in the response | 100

### Response Body
```json
[
    {
        "uuid": "f1f6fb3a-f1d1-43b3-95b6-e213a020ca08",
        "titleEn": "iPhone 17 Lavender 256 GB",
        "titleAr": "iPhone 17 Lavender 256 GB",
        "sku": "iphone-17-lavender-256",
        "barcode": "10000",
        "price": {
            "amount": "1000",
            "currencyCode": "qar"
        },
        "weight": {
            "amount": "1",
            "unit": "kg"
        },
        "dimensions": {
            "width": "1000",
            "height": "1000",
            "length": "1000",
            "unit": "in"
        }
    }
]
```

Get Product Variant
-------------------

> [!IMPORTANT]
> Required roles: `SuperAdmin`, `Admin`

```http
GET /v1/products/<product-uuid>/variants/<variant-uuid> HTTP/1.1
```

### Response Body
```json
{
	"uuid": "f1f6fb3a-f1d1-43b3-95b6-e213a020ca08",
	"titleEn": "iPhone 17 Lavender 256 GB",
	"titleAr": "iPhone 17 Lavender 256 GB",
	"sku": "iphone-17-lavender-256",
	"barcode": "10000",
	"price": {
		"amount": "1000",
		"currencyCode": "qar"
	},
	"weight": {
		"amount": "1",
		"unit": "kg"
	},
	"dimensions": {
		"width": "1000",
		"height": "1000",
		"length": "1000",
        "unit": "in"
	}
}
```

Update Product Variant
----------------------

> [!IMPORTANT]
> Required roles: `SuperAdmin`, `Admin`

```http
PUT /v1/products/<product-uuid>/variants/<variant-uuid> HTTP/1.1
```

Parameter Name | Required | Type | Description
---------------|----------|------|------------
title.en | Yes | String | Title of the variant in English — must be specific to this variant, not the product-level title
title.ar | Yes | String | Title of the variant in Arabic
sku | Yes | String | The sku of the variant
barcode | Yes | String | The unique barcode of the variant
price.amount | Yes | Number | The amount in which we will charge the customer
price.currencyCode | Yes | String | The currency code of the price amount
weight.amount | Yes | Number | The actual weight of this variant. **Do not use placeholder values.**
weight.unit | Yes | String| The weight-unit of the variant. A value from, `g, kg, oz, lb` must be provided.
dimensions.width | Yes | Number | The actual width of this variant. **Do not use placeholder values.**
dimensions.height | Yes | Number | The actual height of this variant.
dimensions.length | Yes | Number | The actual length of this variant.
dimensions.unit | Yes | String | The unit of measurement for dimensions. A value from, `mm, cm, m, km, in, ft, yd, mi` must be provided.
skuMeta | Yes | Object | Supplier SKU metadata. Use this to backfill `skuMeta` on variants that were created without it. See the Create Variant section for the full field structure.

### Request Body
```json
{
    "title": {
        "en": "Brown / Single size: 90-140cm",
        "ar": "بني / مقاس واحد: 90-140 سم"
    },
    "sku": "6063095111989",
    "barcode": "6063095111989",
    "price": {
        "amount": 1000,
        "currencyCode": "qar"
    },
    "weight": {
        "amount": 0.5,
        "unit": "kg"
    },
    "dimensions": {
        "width": 30,
        "height": 10,
        "length": 40,
        "unit": "cm"
    },
    "skuMeta": {
        "shop_id": "BBByHrSBdD6rcCxxTgxjQEQ6g",
        "shop_name": "南通市飞凡梦纺织品有限公司",
        "spec_id": "1234567890",
        "sku_img": "https://...",
        "min_order_quantity": "1",
        "batch_number": "1",
        "imgs": [],
        "specs": [
            { "label": "Color", "value": "Brown" },
            { "label": "Size", "value": "Single size: 90-140cm" }
        ]
    }
}
```

### Response Body
```json
{
    "uuid": "f1f6fb3a-f1d1-43b3-95b6-e213a020ca08",
    "titleEn": "Brown / Single size: 90-140cm",
    "titleAr": "بني / مقاس واحد: 90-140 سم",
    "sku": "6063095111989",
    "barcode": "6063095111989",
    "price": {
        "amount": 1000,
        "currencyCode": "qar"
    },
    "weight": {
        "amount": 0.5,
        "unit": "kg"
    },
    "dimensions": {
        "width": 30,
        "height": 10,
        "length": 40,
        "unit": "cm"
    },
    "skuMeta": {
        "shop_id": "BBByHrSBdD6rcCxxTgxjQEQ6g",
        "shop_name": "南通市飞凡梦纺织品有限公司",
        "spec_id": "1234567890",
        "sku_img": "https://...",
        "min_order_quantity": "1",
        "batch_number": "1",
        "imgs": [],
        "specs": [
            { "label": "Color", "value": "Brown" },
            { "label": "Size", "value": "Single size: 90-140cm" }
        ]
    }
}
```

Delete Product Variant
----------------------

> [!IMPORTANT]
> Required roles: `SuperAdmin`, `Admin`

```http
DELETE /v1/products/<product-uuid>/variants/<variant-uuid> HTTP/1.1
```

Product Variant Images
======================

Upload Variant Images
---------------------

> [!IMPORTANT]
> Required roles: `SuperAdmin`, `Admin`

```http
POST /v1/products/<product-uuid>/variants/<product-variant-uuid>/images HTTP/1.1
```

### Example
```bash
curl --location --request POST 'http://localhost:8000/v1/products/d0bd2ed9-81b2-44fe-84dc-9c52a794a2a3/variants/d0bd2ed9-81b2-44fe-84dc-9c52a794a2a3/images' \
--header 'Authorization: Bearer <YOUR_ACCESS_TOKEN>' \
--form 'file=@"/C:/m_Direct_Media____YWCMXRBDU8.jpg"'
```

### Response Body

```json
{
    "uuid": "feb8f0da-32db-46d6-a132-69cfdd23e29d",
    "variant": {
        "uuid": "28a9db5c-1fb1-4acb-8193-e44514fb0952",
        "titleEn": "iPhone 24 Red 1 TB",
        "titleAr": "iPhone 24 Red 1 TB",
        "sku": "iphone-24-red-1tb",
        "barcode": "10000",
        "price": {
            "amount": 4000,
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
        }
    },
    "imageUrl": "https://camion.s3.us-east-1.amazonaws.com/13f903c1-88d4-48b0-8ee4-dcde4c36eb15.jpg",
    "thumbnailUrl": "https://camion.s3.us-east-1.amazonaws.com/13f903c1-88d4-48b0-8ee4-dcde4c36eb15.jpg",
    "alt": "",
    "isFeatured": false,
    "isEnabled": true,
    "position": 0,
    "dimensions": {
        "width": 1000,
        "height": 1000
    }
}
```

Get Variant Images
------------------

> [!IMPORTANT]
> Required roles: `SuperAdmin`, `Admin`

```http
GET /v1/products/<product-uuid>/variants/<product-variant-uuid>/images HTTP/1.1
```

### Response Body

```json
[
    {
        "uuid": "feb8f0da-32db-46d6-a132-69cfdd23e29d",
        "imageUrl": "https://camion.s3.us-east-1.amazonaws.com/13f903c1-88d4-48b0-8ee4-dcde4c36eb15.jpg",
        "thumbnailUrl": "https://camion.s3.us-east-1.amazonaws.com/13f903c1-88d4-48b0-8ee4-dcde4c36eb15.jpg",
        "alt": "",
        "isFeatured": false,
        "isEnabled": true,
        "position": 0,
        "dimensions": {
            "width": 1000,
            "height": 1000
        }
    },
    {
        "uuid": "2321d5c9-0b93-4ef4-a4f5-5dd4f48f7946",
        "imageUrl": "https://camion.s3.us-east-1.amazonaws.com/bcec2846-6350-4547-a248-55c47851c93a.jpg",
        "thumbnailUrl": "https://camion.s3.us-east-1.amazonaws.com/bcec2846-6350-4547-a248-55c47851c93a.jpg",
        "alt": "",
        "isFeatured": false,
        "isEnabled": true,
        "position": 0,
        "dimensions": {
            "width": 1000,
            "height": 1000
        }
    },
    {
        "uuid": "c9066b08-aa75-4947-8c21-a9aa7d1d77d1",
        "imageUrl": "https://camion.s3.us-east-1.amazonaws.com/787d4649-9a61-4ea8-a69b-f10299397aa9.jpg",
        "thumbnailUrl": "https://camion.s3.us-east-1.amazonaws.com/787d4649-9a61-4ea8-a69b-f10299397aa9.jpg",
        "alt": "iPhone Photo",
        "isFeatured": true,
        "isEnabled": true,
        "position": 0,
        "dimensions": {
            "width": 1000,
            "height": 1000
        }
    }
]
```

Get Variant Image
-----------------

> [!IMPORTANT]
> Required roles: `SuperAdmin`, `Admin`

```http
GET /v1/products/<product-uuid>/variants/<product-variant-uuid>/images/<product-variant-image-uuid> HTTP/1.1
```

### Response Body

```json
{
    "uuid": "c9066b08-aa75-4947-8c21-a9aa7d1d77d1",
    "imageUrl": "https://camion.s3.us-east-1.amazonaws.com/787d4649-9a61-4ea8-a69b-f10299397aa9.jpg",
    "thumbnailUrl": "https://camion.s3.us-east-1.amazonaws.com/787d4649-9a61-4ea8-a69b-f10299397aa9.jpg",
    "alt": "",
    "isFeatured": false,
    "isEnabled": true,
    "position": 0,
    "dimensions": {
        "width": 1000,
        "height": 1000
    }
}
```

Update Variant Image
--------------------

> [!IMPORTANT]
> Required roles: `SuperAdmin`, `Admin`

```http
PUT /v1/products/<product-uuid>/variants/<product-variant-uuid>/images/<product-variant-image-uuid> HTTP/1.1
```

### Request Body

```json
{
    "alt": "iPhone Photo",
    "position": 0,
    "isFeatured": true,
    "isEnabled": true,
}
```

### Response Body

```json
{
    "uuid": "c9066b08-aa75-4947-8c21-a9aa7d1d77d1",
    "imageUrl": "https://camion.s3.us-east-1.amazonaws.com/787d4649-9a61-4ea8-a69b-f10299397aa9.jpg",
    "thumbnailUrl": "https://camion.s3.us-east-1.amazonaws.com/787d4649-9a61-4ea8-a69b-f10299397aa9.jpg",
    "alt": "iPhone Photo",
    "isFeatured": true,
    "isEnabled": true,
    "position": 0,
    "dimensions": {
        "width": 1000,
        "height": 1000
    }
}
```

Replace Variant Image
---------------------

```http
POST /v1/products/<product-uuid>/variants/<product-variant-uuid>/images/<product-variant-image-uuid> HTTP/1.1
```

### Request Body

```bash
curl --location --request POST '/v1/products/<product-uuid>/variants/<product-variant-uuid>/images/<product-variant-image-uuid>' \
--header 'Authorization: Bearer <YOUR_ACCESS_TOKEN>' \
--form 'file=@"/Work/camiontrading/e0af200a-ccb8-4530-918a-2be7e4e761ab.png"'
```

### Response Body

```json
{
    "uuid": "e23e83b6-48b9-436b-84c1-617a9bc5a60e",
    "imageUrl": "s3://product-images/cb15384d-2f33-4fc0-9eb6-374697677ff6.png",
    "thumbnailUrl": "s3://product-images/4b61155f-4fbe-4c03-acae-f1b3b916a95e.jpg",
    "alt": "iPhone Photo",
    "isFeatured": true,
    "isEnabled": true,
    "position": 0,
    "dimensions": {
        "width": 1000,
        "height": 1000
    }
}
```

Delete Variant Image
--------------------

> [!IMPORTANT]
> Required roles: `SuperAdmin`, `Admin`

```http
DELETE /v1/products/<product-uuid>/variants/<product-variant-uuid>/images/<product-variant-image-uuid> HTTP/1.1
```

Product Reviews
===============

> [!IMPORTANT]
> You must include your access token as a `Bearer` token in the Authorization header. Your account must be a customer while making these requests.

Create Product Review
---------------------

```http
POST /v1/products/<product-uuid>/reviews HTTP/1.1
```

### Request Body

| Field | Type | Required | Description |
|---|---|---|---|
| `rating` | `number` (1–5) | Yes | Star rating |
| `comment` | `string` (1–512 chars) | Yes | Review text |
| `orderUuid` | `string (UUID v4)` | No | When provided, automatically stamps the `ORDER_REVIEW` tracking stage on the linked order |

```json
{
    "rating": 5,
    "comment": "Great quality, fast delivery!",
    "orderUuid": "0a791d05-f5cb-4005-aa63-7ba68a8c06b9"
}
```

> **Order tracking auto-stamp:** If `orderUuid` is provided, the server validates that the order belongs to the authenticated customer, has status `delivered`, and contains the product being reviewed. If all conditions pass, the `ORDER_REVIEW` tracking stage is stamped automatically. If the customer leaves a second review for the same order, the review text is appended (separated by `\n---\n`) and the rating is averaged. The review is always saved regardless of whether the tracking stamp succeeds.

### Response Body

```json
{
    "uuid": "7887b00a-b74a-4621-8e8b-0e5233643b4f",
    "customer": {
        "uuid": "6c90d8ef-7f9f-4dcb-8db3-9769fa771ae7",
        "fullName": "Your Name",
        "emailAddress": "your-name@your-domain.com",
        "phoneNumber": "+974 12345678",
        "role": "influencer"
    },
    "product": {
        "uuid": "660e5d31-24e8-42e2-b8d7-1c45118ef29a",
        "slug": "iphone-17",
        "titleEn": "iPhone 17",
        "titleAr": "آيفون 17",
        "briefEn": "From $799 or $33.29/mo. per month for 24 months",
        "briefAr": "ابتداءً من 799 دولارًا أو 33.29 دولارًا شهريًا لمدة 24 شهرًا",
        "descriptionEn": "Your new iPhone awaits. Make it yours.",
        "descriptionAr": "جهاز آيفون الجديد بانتظارك. اجعله ملكك.",
        "descriptionHtmlEn": "<b>Your new iPhone awaits. Make it yours</b>",
        "descriptionHtmlAr": "<b>Your new iPhone awaits. Make it yours</b>",
        "status": "DRAFT"
    },
    "rating": "5",
    "comment": "Great quality, fast delivery!",
    "orderUuid": "0a791d05-f5cb-4005-aa63-7ba68a8c06b9",
    "isEdited": false
}
```

Create Product Review (v2)
--------------------------

```http
GET /v2/products/<product-uuid>/reviews HTTP/1.1
```

| Field | Type | Required | Description |
|---|---|---|---|
| `rating` | `number` (1–5) | Yes | Star rating |
| `comment` | `string` (1–512 chars) | Yes | Review text |
| `orderUuid` | `string (UUID v4)` | No | When provided, automatically stamps the `ORDER_REVIEW` tracking stage on the linked order |
| `images` | Image[] | No | A list of images in the review. The max number of images per review is 5. |

### Request Body

```bash
curl --location --request POST 'http://localhost:8000/v2/products/b2389dfe-16c6-441d-8c62-0af01be49ee1/reviews' \
--header 'Authorization: Bearer <YOUR_ACCESS_TOKEN>' \
--form 'images=@"/C:/m_Direct_Media____YWCMXRBDU8.jpg"' \
--form 'images=@"/C:/m_Freerangestock-Skintone_Studios-12.jpg"' \
--form 'rating="5"' \
--form 'comment="This is a little bad."' \
--form 'orderUuid="8298ad98-12c0-4901-820e-29c16df3301f"'
```

### Response Body

```json
{
    "uuid": "c218c439-43fb-4fb6-9c85-92115ba65e0b",
    "customer": {
        "uuid": "de4b1f29-d5c7-4f7b-98a4-9a9cd62a9287",
        "fullName": "Your Name",
        "emailAddress": "your-name@your-domain.com",
        "phoneNumber": "+92 304 1234567",
        "role": "influencer",
        "unreadNotificationCount": 0,
        "ordersCount": 0,
        "cartItemsCount": 0
    },
    "product": {
        "uuid": "b2389dfe-16c6-441d-8c62-0af01be49ee1",
        "slug": "2026-new-style-metal-buckle-flat-sandals-for-wome-803773003590",
        "titleEn": "2026 New Style Metal Buckle Flat Sandals for Women, Summer Outdoor Wear, Fashionable Square-Toed Soft-Soled Women's Flat",
        "titleAr": "صنادل نسائية مسطحة بمشبك معدني موديل 2026 جديد، مناسبة للارتداء الصيفي الخارجي، تصميم عصري بأصابع مربعة ونعل ناعم",
        "briefEn": "2026 New Style Metal Buckle Flat Sandals for Women, Summer Outdoor Wear, Fashionable Square-Toed Soft-Soled Women's Flat",
        "briefAr": "صنادل نسائية مسطحة بمشبك معدني موديل 2026 جديد، مناسبة للارتداء الصيفي الخارجي، تصميم عصري بأصابع مربعة ونعل ناعم",
        "descriptionEn": "2026 New Style Metal Buckle Flat Sandals for Women, Summer Outdoor Wear, Fashionable Square-Toed Soft-Soled Women's Flat",
        "descriptionAr": "null\nnull",
        "descriptionHtmlEn": "null\nnull",
        "descriptionHtmlAr": "null\nnull",
        "featuredImageUrl": "s3://product-images/7c828d72-414c-476f-b0e3-4d4462760bda.webp",
        "featuredThumbnailUrl": "s3://product-images/4654ef37-07c2-4658-b164-b94475d2c28f.webp",
        "status": "active",
        "shopId": "BBBTXVhUs23KBMjQuVftwvEhw",
        "shopName": "台州伞灯鞋业有限公司",
        "procurementId": "803773003590",
        "salesCount": 0,
        "likesCount": 0,
        "reviewsCount": 8,
        "viewsCount": 2,
        "ratingSum": 36,
        "ratingCount": 8,
        "ratingAvg": 4.5,
        "ratingOneStarCount": 1,
        "ratingTwoStarCount": 0,
        "ratingThreeStarCount": 0,
        "ratingFourStarCount": 0,
        "ratingFiveStarCount": 7
    },
    "rating": 5,
    "comment": "This is a little bad.",
    "orderUuid": "8298ad98-12c0-4901-820e-29c16df3301f",
    "isEdited": false
}
```

Create Product Review (Genuine)
-------------------------------

```http
POST /v1/products/<product-uuid>/reviews/genuine HTTP/1.1
```

### Request Body

| Field | Type | Required | Description |
|---|---|---|---|
| `emailAddress` | `string` | Yes | The email of the customer on whose behalf the genuine review is being created.
| `rating` | `number` (1–5) | Yes | Star rating |
| `comment` | `string` (1–512 chars) | Yes | Review text |

```json
{
    "emailAddress": "your-name@your-domain.com",
    "rating": 1,
    "comment": "This was very bad"
}
```

### Response Body

```json
{
    "uuid": "23af61b1-1d3f-464d-b69e-61a29c2300f8",
    "customer": {
        "uuid": "71b7f3cd-50a4-4a0a-8ccb-cd9c8587b565",
        "fullName": "Your Name",
        "emailAddress": "your-name@your-domain.com",
        "phoneNumber": null,
        "role": "customer",
        "unreadNotificationCount": 4,
        "ordersCount": 0,
        "cartItemsCount": 10
    },
    "product": {
        "uuid": "2048895e-3579-41d6-b956-0840588c54b6",
        "slug": "2026-new-oval-fashion-sunglasses-new-style-small-1045502562250",
        "titleEn": "2026 New Oval Fashion Sunglasses New Style Small Frame Sunglasses For Women's",
        "titleAr": "نظارات شمسية نسائية موديل 2026 بإطار بيضاوي صغير وأسلوب عصري",
        "briefEn": "2026 New Oval Fashion Sunglasses New Style Small Frame Sunglasses For Women's",
        "briefAr": "نظارات شمسية نسائية موديل 2026 بإطار بيضاوي صغير وأسلوب عصري",
        "descriptionEn": "2026 New Oval Fashion Sunglasses New Style Small Frame Sunglasses For Women's",
        "descriptionAr": "نظارات شمسية نسائية موديل 2026 بإطار بيضاوي صغير وأسلوب عصري",
        "descriptionHtmlEn": "2026 New Oval Fashion Sunglasses New Style Small Frame Sunglasses For Women's",
        "descriptionHtmlAr": "2026 New Oval Fashion Sunglasses New Style Small Frame Sunglasses For Women's",
        "featuredImageUrl": "s3://product-images/a1eac554-0e68-47d7-b071-a01b34162b7c.webp",
        "featuredThumbnailUrl": "s3://product-images/6db6b3dd-18d6-4c42-a86b-c0dbdb5aa713.webp",
        "status": "active",
        "shopId": "BBB9yoiIngOTqVwzYePJTHj8Q",
        "shopName": "台州市新西音眼镜有限公司",
        "procurementId": "1045502562250",
        "salesCount": 0,
        "likesCount": 0,
        "reviewsCount": 1,
        "viewsCount": 0,
        "ratingSum": 1,
        "ratingCount": 1,
        "ratingAvg": 1,
        "ratingOneStarCount": 1,
        "ratingTwoStarCount": 0,
        "ratingThreeStarCount": 0,
        "ratingFourStarCount": 0,
        "ratingFiveStarCount": 0
    },
    "rating": 1,
    "comment": "This was very bad",
    "orderUuid": "c2eb7cc0-653d-42bf-98dd-f80aa289e1d4",
    "isEdited": false
}
```

Create Product Review Image
---------------------------

```http
POST /v1/products/<product-uuid>/reviews/<product-review-uuid>/images HTTP/1.1
```

```bash
curl --location --request POST 'http://localhost:8000/v1/products/<product-uuid>/reviews/<product-review-uuid>/images' \
--header 'Authorization: Bearer <YOUR_ACCESS_TOKEN>' \
--form 'file=@"/m_Direct_Media____YWCMXRBDU8.jpg"'
```

### Response Body

```json
{
    "uuid": "cb9eb5bd-7165-47fa-96c8-e3f85a27e890",
    "review": {
        "uuid": "7887b00a-b74a-4621-8e8b-0e5233643b4f",
        "rating": "1",
        "comment": "This was very bad",
        "isEdited": false
    },
    "thumbnailUrl": "https://camion.s3.us-east-1.amazonaws.com/review/66329c2f-38d5-4e63-b559-1124c3cc7560.jpg",
    "imageUrl": "https://camion.s3.us-east-1.amazonaws.com/review/66329c2f-38d5-4e63-b559-1124c3cc7560.jpg"
}
```

Delete Product Review Image
---------------------------

```http
DELETE /v1/products/<product-uuid>/reviews/<product-review-uuid>/images/<product-review-image-uuid> HTTP/1.1
```

### Request Body

```bash
curl --location --request DELETE 'http://localhost:8000/v1/products/<product-uuid>/reviews/<product-review-uuid>/images/<product-review-image-uuid>' \
--header 'Authorization: Bearer <YOUR_ACCESS_TOKEN>'
```

Get Product Reviews
-------------------

```http
GET /v1/products/<product-uuid>/reviews HTTP/1.1
```

### Response Body

```json
[
    {
        "uuid": "7887b00a-b74a-4621-8e8b-0e5233643b4f",
        "customer": {
            "uuid": "6c90d8ef-7f9f-4dcb-8db3-9769fa771ae7",
            "fullName": "Your Name",
            "emailAddress": "your-name@your-domain.com",
            "phoneNumber": "+974 12345678",
            "role": "influencer"
        },
        "rating": "1",
        "comment": "This was very bad",
        "isEdited": false,
        "images": [
            {
                "uuid": "cb9eb5bd-7165-47fa-96c8-e3f85a27e890",
                "thumbnailUrl": "https://camion.s3.us-east-1.amazonaws.com/review/66329c2f-38d5-4e63-b559-1124c3cc7560.jpg",
                "imageUrl": "https://camion.s3.us-east-1.amazonaws.com/review/66329c2f-38d5-4e63-b559-1124c3cc7560.jpg"
            }
        ]
    },
    {
        "uuid": "362ad2ce-c5bf-46dd-be56-f00ba4241982",
        "customer": {
            "uuid": "6c90d8ef-7f9f-4dcb-8db3-9769fa771ae7",
            "fullName": "Your Name",
            "emailAddress": "your-name@your-domain.com",
            "phoneNumber": "+974 12345678",
            "role": "influencer"
        },
        "rating": "1",
        "comment": "This was very bad",
        "isEdited": false,
        "images": []
    }
]
```

Get Product Review
------------------

```http
GET /v1/products/<product-uuid>/reviews/<review-uuid> HTTP/1.1
```

### Response Body

```json
{
    "uuid": "7887b00a-b74a-4621-8e8b-0e5233643b4f",
    "customer": {
        "uuid": "6c90d8ef-7f9f-4dcb-8db3-9769fa771ae7",
        "fullName": "Your Name",
        "emailAddress": "your-name@your-domain.com",
        "phoneNumber": "+974 12345678",
        "role": "influencer"
    },
    "rating": "1",
    "comment": "This was very bad",
    "isEdited": false,
    "images": [
        {
            "uuid": "cb9eb5bd-7165-47fa-96c8-e3f85a27e890",
            "thumbnailUrl": "https://camion.s3.us-east-1.amazonaws.com/review/66329c2f-38d5-4e63-b559-1124c3cc7560.jpg",
            "imageUrl": "https://camion.s3.us-east-1.amazonaws.com/review/66329c2f-38d5-4e63-b559-1124c3cc7560.jpg"
        }
    ]
}
```

Update Product Review
---------------------

```http
PUT /v1/products/<product-uuid>/reviews/<review-uuid> HTTP/1.1
```

### Request Body

```json
{
    "rating": 1.0,
    "comment": "This was very very bad"
}
```

### Response Body

```json
{
    "uuid": "7887b00a-b74a-4621-8e8b-0e5233643b4f",
    "rating": 1,
    "comment": "This was very very bad",
    "isEdited": true
}
```

Delete Product Review
---------------------

```http
DELETE /v1/products/<product-uuid>/reviews/<review-uuid> HTTP/1.1
```

Product Attachments
===================

Upload Product Attachment
-------------------------

```http
POST /v1/products/<product-uuid>/attachments HTTP/1.1
```

### Request Body

```bash
curl --location --request POST 'http://localhost:8000/v1/products/8ba85e9b-ebae-4a5b-9165-55cc438ef0d4/attachments' \
--header 'Authorization: Bearer <YOUR_ACCESS_TOKEN>' \
--form 'files=@"/C:/Users/Gloria/Pictures/Test/m_Direct_Media____YWCMXRBDU8.jpg"' \
--form 'files=@"/C:/Users/Gloria/Pictures/Test/m_Freerangestock-Skintone_Studios-12.jpg"'
```

### Response Body

```json
[
    {
        "uuid": "d5524b7e-e72a-405f-868d-c8bf8be96404",
        "product": {
            "uuid": "8ba85e9b-ebae-4a5b-9165-55cc438ef0d4",
            "slug": "triangle-leopard-print-silk-printed-silk-scarf-w-1035742933292",
            "titleEn": "Triangle Leopard Print Silk Printed Silk Scarf Women's Long Scarf Spring and Summer Shawl",
            "titleAr": "Triangle Leopard Print Silk Printed Silk Scarf Women's Long Scarf Spring and Summer Shawl",
            "briefEn": "Triangle Leopard Print Silk Printed Silk Scarf Women's Long Scarf Spring and Summer Shawl",
            "briefAr": "Triangle Leopard Print Silk Printed Silk Scarf Women's Long Scarf Spring and Summer Shawl",
            "descriptionEn": "Triangle Leopard Print Silk Printed Silk Scarf Women's Long Scarf Spring and Summer Shawl",
            "descriptionAr": "وشاح حرير مطبوع بنقشة فهد مثلث، وشاح طويل نسائي لفصلي الربيع والصيف، شال",
            "descriptionHtmlEn": "FASHION TREND\n品名材质尺寸克重包装JY260409棉麻手感/聚酯纤维88*180cm约100g单个opp\n测量说明：尺寸均是平铺手工测量，由于测量方法不同，可能会有1~3CM的允许范围内的误差。\n温馨提示：围巾纺织品面料特点，不能保证每条围巾都无暇，部分有轻微的面料飞纱，勾丝，小染色等完全不影响佩戴效果和牢固效果，请在意的亲请慎拍。\n为什么选择我们？\n厂家直销，货源稳定；自主设计，款式新颖；实力雄厚，价格合理",
            "descriptionHtmlAr": "FASHION TREND\n品名材质尺寸克重包装JY260409棉麻手感/聚酯纤维88*180cm约100g单个opp\n测量说明：尺寸均是平铺手工测量，由于测量方法不同，可能会有1~3CM的允许范围内的误差。\n温馨提示：围巾纺织品面料特点，不能保证每条围巾都无暇，部分有轻微的面料飞纱，勾丝，小染色等完全不影响佩戴效果和牢固效果，请在意的亲请慎拍。\n为什么选择我们？\n厂家直销，货源稳定；自主设计，款式新颖；实力雄厚，价格合理",
            "featuredImageUrl": "s3://product-images/af28d700-ea28-4a6c-80c4-4cbd80e642b0.webp",
            "featuredThumbnailUrl": "s3://product-images/5a9be6a8-d192-4af3-b4b3-7bfbb0886b51.webp",
            "sizechartUrl": "s3://sizecharts/b59f7619-0f73-4d42-9c68-5907d4ea5ff6.webp",
            "status": "active",
            "shopId": "BBB1xC2MM5HFhsw0VHNbzeHVA",
            "shopName": "德清新景悦服饰有限公司",
            "procurementId": "1035742933292",
            "salesCount": 0,
            "likesCount": 0,
            "reviewsCount": 0,
            "viewsCount": 13,
            "ratingSum": 0,
            "ratingCount": 0,
            "ratingAvg": "0",
            "ratingOneStarCount": 0,
            "ratingTwoStarCount": 0,
            "ratingThreeStarCount": 0,
            "ratingFourStarCount": 0,
            "ratingFiveStarCount": 0
        },
        "mediaUrl": "s3://attachments/2487ab0d-945e-459b-bccf-903feb9200a4.webp",
        "mediaType": "image"
    },
    {
        "uuid": "661b6835-d338-41a7-97f5-96a4d4ab2543",
        "product": {
            "uuid": "8ba85e9b-ebae-4a5b-9165-55cc438ef0d4",
            "slug": "triangle-leopard-print-silk-printed-silk-scarf-w-1035742933292",
            "titleEn": "Triangle Leopard Print Silk Printed Silk Scarf Women's Long Scarf Spring and Summer Shawl",
            "titleAr": "Triangle Leopard Print Silk Printed Silk Scarf Women's Long Scarf Spring and Summer Shawl",
            "briefEn": "Triangle Leopard Print Silk Printed Silk Scarf Women's Long Scarf Spring and Summer Shawl",
            "briefAr": "Triangle Leopard Print Silk Printed Silk Scarf Women's Long Scarf Spring and Summer Shawl",
            "descriptionEn": "Triangle Leopard Print Silk Printed Silk Scarf Women's Long Scarf Spring and Summer Shawl",
            "descriptionAr": "وشاح حرير مطبوع بنقشة فهد مثلث، وشاح طويل نسائي لفصلي الربيع والصيف، شال",
            "descriptionHtmlEn": "FASHION TREND\n品名材质尺寸克重包装JY260409棉麻手感/聚酯纤维88*180cm约100g单个opp\n测量说明：尺寸均是平铺手工测量，由于测量方法不同，可能会有1~3CM的允许范围内的误差。\n温馨提示：围巾纺织品面料特点，不能保证每条围巾都无暇，部分有轻微的面料飞纱，勾丝，小染色等完全不影响佩戴效果和牢固效果，请在意的亲请慎拍。\n为什么选择我们？\n厂家直销，货源稳定；自主设计，款式新颖；实力雄厚，价格合理",
            "descriptionHtmlAr": "FASHION TREND\n品名材质尺寸克重包装JY260409棉麻手感/聚酯纤维88*180cm约100g单个opp\n测量说明：尺寸均是平铺手工测量，由于测量方法不同，可能会有1~3CM的允许范围内的误差。\n温馨提示：围巾纺织品面料特点，不能保证每条围巾都无暇，部分有轻微的面料飞纱，勾丝，小染色等完全不影响佩戴效果和牢固效果，请在意的亲请慎拍。\n为什么选择我们？\n厂家直销，货源稳定；自主设计，款式新颖；实力雄厚，价格合理",
            "featuredImageUrl": "s3://product-images/af28d700-ea28-4a6c-80c4-4cbd80e642b0.webp",
            "featuredThumbnailUrl": "s3://product-images/5a9be6a8-d192-4af3-b4b3-7bfbb0886b51.webp",
            "sizechartUrl": "s3://sizecharts/b59f7619-0f73-4d42-9c68-5907d4ea5ff6.webp",
            "status": "active",
            "shopId": "BBB1xC2MM5HFhsw0VHNbzeHVA",
            "shopName": "德清新景悦服饰有限公司",
            "procurementId": "1035742933292",
            "salesCount": 0,
            "likesCount": 0,
            "reviewsCount": 0,
            "viewsCount": 13,
            "ratingSum": 0,
            "ratingCount": 0,
            "ratingAvg": "0",
            "ratingOneStarCount": 0,
            "ratingTwoStarCount": 0,
            "ratingThreeStarCount": 0,
            "ratingFourStarCount": 0,
            "ratingFiveStarCount": 0
        },
        "mediaUrl": "s3://attachments/81016090-46e2-45ba-9e80-6b76194d0377.webp",
        "mediaType": "image"
    }
]
```

Get Product Attachments
-----------------------

```http
GET /v1/products/<product-uuid>/attachments HTTP/1.1
```

### Response Body

```json
[
    {
        "uuid": "c3390237-08e1-4d21-8992-a4a722501d87",
        "mediaUrl": "s3://attachments/1dd28f63-23e1-4b64-b6d5-7f9a26f894fd.webp",
        "mediaType": "image"
    }
]
```

Delete Product Attachment
-------------------------

```http
DELETE /v1/products/<product-uuid>/attachments/<product-attachment-uuid> HTTP/1.1
```

Product Reports
===============

> [!IMPORTANT]
> Customer endpoints require a valid customer token in the `Authorization` header.
> Admin endpoints require a valid `Bearer` token and one of the following roles: `SuperAdmin`, `Admin`, `Manager`.

This feature lets customers report a product for review. Reports are stored with a reason, explanation, optional order number, optional attachments, and a review status for internal moderation.

Report Reasons
--------------

| Value | Description |
|---|---|
| `incorrect_product_information` | Product details are inaccurate |
| `product_quality_concerns` | Product quality issues |
| `safety_concerns` | Safety or compliance concern |
| `incorrect_pricing` | Incorrect pricing shown |
| `duplicate_listing` | Duplicate product listing |
| `inappropriate_offensive_content` | Offensive or inappropriate content |
| `legal_regulatory_concern` | Legal or regulatory issue |
| `other` | Any other valid concern |

Report Statuses
---------------

| Value | Description |
|---|---|
| `pending` | Submitted and waiting for review |
| `under_review` | Being reviewed by the admin team |
| `resolved` | Issue has been handled |
| `rejected` | Report was reviewed and rejected |

Report Priority
--------------

| Value | Description |
|---|---|
| `normal` | Standard queue position |
| `high` | Prioritised report, used automatically for safety concerns |

Create Product Report
---------------------

```http
POST /v1/product-reports HTTP/1.1
```

### Request Body

Use `multipart/form-data` if you want to upload attachments with the report.

Parameter Name | Required | Type | Description
---------------|----------|------|------------
productUuid | Yes | String (UUID) | UUID of the product being reported
reason | Yes | Enum | One of the supported report reasons
details | Yes | String (10–1024 chars) | Customer explanation/details
orderNumber | No | String | Optional order number related to the report
attachments | No | File[] | Optional image or document files

### Example Request

```bash
curl --location --request POST 'http://localhost:8000/v1/product-reports' \
--header 'Authorization: Bearer <CUSTOMER_TOKEN>' \
--form 'productUuid="8ba85e9b-ebae-4a5b-9165-55cc438ef0d4"' \
--form 'reason="safety_concerns"' \
--form 'details="The item has a sharp edge that could injure customers."' \
--form 'orderNumber="1042"' \
--form 'attachments=@"/path/to/photo1.jpg"' \
--form 'attachments=@"/path/to/receipt.pdf"'
```

### Response Body

```json
{
    "uuid": "b4dbb0f1-8f5c-4f3c-9f35-6d2f66b0f9c1",
    "reason": "safety_concerns",
    "details": "The item has a sharp edge that could injure customers.",
    "orderNumber": "1042",
    "status": "pending",
    "priority": "high",
    "attachments": [
        {
            "uuid": "b65f7d1f-0f37-4b2f-8c2c-1cc8ef19d31d",
            "mediaUrl": "s3://product-reports/...",
            "thumbnailUrl": "s3://product-reports/...",
            "mediaType": "image"
        }
    ]
}
```

Upload Product Report Attachments
---------------------------------

```http
POST /v1/product-reports/<report-uuid>/attachments HTTP/1.1
```

Use this endpoint if you want to upload attachments after the report has already been created.

Parameter Name | Required | Type | Description
---------------|----------|------|------------
attachments | Yes | File[] | One or more image/document files

### Response Body

```json
[
    {
        "uuid": "b65f7d1f-0f37-4b2f-8c2c-1cc8ef19d31d",
        "mediaUrl": "s3://product-reports/...",
        "thumbnailUrl": "s3://product-reports/...",
        "mediaType": "image"
    },
    {
        "uuid": "f0c3ed7b-6b4a-4bda-8f1a-dfcd7f2d7655",
        "mediaUrl": "s3://product-reports/...",
        "thumbnailUrl": null,
        "mediaType": "document"
    }
]
```

### Validation / Behavior Notes

- Product must exist
- Reason must be one of the supported values
- `details` is required and must be at least 10 characters
- Safety-related reports are automatically prioritised as `high`
- Duplicate submissions are blocked using a fingerprint based on customer, product, reason, details, and optional order number

Admin Report APIs
-----------------

#### List All Product Reports

```http
GET /v1/product-reports/admin/all?pageNumber=1&itemsPerPage=20&status=pending&reason=safety_concerns HTTP/1.1
```

### Response Body

```json
[
    {
        "uuid": "b4dbb0f1-8f5c-4f3c-9f35-6d2f66b0f9c1",
        "reason": "safety_concerns",
        "details": "The item has a sharp edge that could injure customers.",
        "orderNumber": "1042",
        "status": "pending",
        "priority": "high",
        "customer": {
            "uuid": "6c90d8ef-7f9f-4dcb-8db3-9769fa771ae7",
            "fullName": "Your Name",
            "emailAddress": "your-name@your-domain.com",
            "phoneNumber": "+974 12345678",
            "role": "customer"
        },
        "product": {
            "uuid": "8ba85e9b-ebae-4a5b-9165-55cc438ef0d4",
            "slug": "triangle-leopard-print-silk-printed-silk-scarf-w-1035742933292",
            "titleEn": "Triangle Leopard Print Silk Printed Silk Scarf Women's Long Scarf Spring and Summer Shawl"
        },
        "attachments": []
    }
]
```

#### Get Single Product Report

```http
GET /v1/product-reports/admin/<report-uuid> HTTP/1.1
```

### Response Body

Returns one report object with customer, product, and attachment details.

#### Update Report Status

```http
PATCH /v1/product-reports/<report-uuid>/status HTTP/1.1
```

### Request Body

```json
{
    "status": "under_review",
    "adminNote": "Queued for moderation review."
}
```

### Response Body

Returns the updated report object.

WMS API
=======

> [!IMPORTANT]
> You must include your access token as a `Bearer` token in the Authorization header. Your account must be active while making these requests.

Recover Orphaned Inbound Order
------------------------------

> [!IMPORTANT]
> Required roles: `SuperAdmin`

Use this endpoint to recover a WMS inbound record that was created without a corresponding Gulltrans order or order links. This can happen when the dispatch job crashes between saving the inbound and creating the links.

This endpoint will:
1. Create the missing Gulltrans procurement order(s) for the affected orders
2. Append the resulting Gulltrans order SNs to each order's `gulltrans_order_sns` array
3. Create the missing links between the WMS inbound and the provided orders
4. Patch the `gulltransResponse` on the inbound record

> [!WARNING]
> This endpoint does **not** call `inboundorder/create` on the WMS again. The inbound must already exist on the WMS side. Only use this when the WMS inbound is confirmed present in both the DB and on the JOP WMS platform.

```http
PUT /v1/wms/inbound/<orderNo>/recover HTTP/1.1
```

Parameter Name | Required | Type | Description
---------------|----------|------|------------
orderUuids | Yes | List[UUID] | UUIDs of the camion orders that belong to this inbound
shipperMethod | Yes | Number | Shipper method code (0–4)
shipperCompany | No | String | Name of the shipping company

### How to find the order UUIDs

Query the prod database for confirmed orders with no Gulltrans SNs created before the inbound's `createdAt` timestamp:

```sql
SELECT uuid, status, gulltrans_order_sns, created_at
FROM orders
WHERE status = 'confirmed'
  AND (gulltrans_order_sns IS NULL OR gulltrans_order_sns = '{}')
  AND created_at <= '<inbound-created-at>'
ORDER BY created_at DESC
LIMIT 20;
```

Alternatively, search CloudWatch Logs for the inbound's `orderNo` to find the original dispatch job log which lists the order UUIDs.

### Request Body
```json
{
    "orderUuids": [
        "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
        "b2c3d4e5-f6a7-8901-bcde-f12345678901"
    ],
    "shipperMethod": 0,
    "shipperCompany": ""
}
```

### Response Body
```json
{
    "gulltransOrders": [
        {
            "shopId": "12345678",
            "orderSn": "GT-2026-001",
            "raw": { }
        }
    ],
    "linkedOrderUuids": [
        "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
        "b2c3d4e5-f6a7-8901-bcde-f12345678901"
    ]
}
```

### Error Responses

**404** — Inbound `orderNo` not found in the DB.

**400** — Inbound already has links (recovery not needed). The response includes the existing linked UUIDs:
```json
{
    "message": "Inbound already has links — recovery not needed",
    "linkedOrderUuids": ["a1b2c3d4-e5f6-7890-abcd-ef1234567890"]
}
```

**400** — Gulltrans call failed for one of the shops. No DB writes have been committed at this point — the endpoint is safe to retry:
```json
{
    "message": "Gulltrans failed for shop 12345678: <reason>"
}
```

Get Order Links
---------------

> [!IMPORTANT]
> Required roles: `SuperAdmin`, `Admin`

Returns all records from the `jop_wms_order_links` table as-is.

```http
GET /v1/wms/order-links HTTP/1.1
```

### Response Body
```json
[
    {
        "id": 1,
        "wmsOrderId": 1,
        "orderId": 42,
        "orderUuid": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
        "createdAt": "2026-05-04T12:56:50.444Z"
    }
]
```

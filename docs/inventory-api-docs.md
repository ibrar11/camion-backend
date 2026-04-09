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

Warehouse API
=============

> [!IMPORTANT]
> You must include your access token as a `Bearer` token in the Authorization header. Your account must be active while making these requests.

Create a warehouse
------------------

> [!IMPORTANT]
> Required roles: `SuperAdmin`, `Admin`

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

### Request Body
```json
{
    "name": "1688",
    "code": "1688",
    "addressLine1": "Example Road",
    "addressLine2": "Example Building",
    "country": "CHN",
    "state": "Xinjiang",
    "city": "Xinjiang"
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
    "state": "Xinjiang",
    "city": "Xinjiang",
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
        "state": "Xingyang",
        "city": "Xingyang",
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
    "state": "Xingyang",
    "city": "Xingyang",
    "isActive": true
}
```

Update Warehouse
----------------

> [!IMPORTANT]
> Required roles: `SuperAdmin`, `Admin`

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

### Request Body
```json
{
    "name": "1688 (Partner)",
    "code": "1688",
    "addressLine1": "Example Road",
    "addressLine2": "Example Building",
    "country": "CHN",
    "state": "Xingyang",
    "city": "Xingyang"
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
    "state": "Xingyang",
    "city": "Xingyang",
    "isActive": true
}
```

Delete Warehouse
----------------

> [!IMPORTANT]
> Required roles: `SuperAdmin`, `Admin`

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

### Request Body
```json
{
    "parentUUID": null,
    "slug": "sneakers",
    "name": {
        "en": "Sneakers",
        "ar": "أحذية رياضية"
    },
    "pricingFactor": 1.2
}
```

### Response Body
```json
{
    "uuid": "5d32adfe-cdaa-4d19-9a3b-c2374b2a0aab",
    "slug": "sneakers",
    "nameEn": "sneakers",
    "nameAr": "أحذية رياضية",
    "pricingFactor": 1.2,
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
        "children": [
            {
                "uuid": "f5d519fa-9b21-435c-97ab-8c06e1fb782c",
                "slug": "sneakers-shoes",
                "nameEn": "sneakers-shoes",
                "nameAr": "أحذية رياضية",
                "pricingFactor": "1.2",
                "children": []
            }
        ]
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
    "pricingFactor": 1.4
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

### Request Body
```json
{
    "slug": "sneakers",
    "name": {
        "en": "Sneakers",
        "ar": "أحذية رياضية"
    },
    "pricingFactor": 1.4
}
```

### Response Body
```json
{
    "uuid": "fbb6e9d6-60e3-4d45-8dba-8cd01e6f6e52",
    "slug": "sneakers",
    "nameEn": "Sneakers",
    "nameAr": "أحذية رياضية",
    "pricingFactor": 1.4
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
                "currencyCode": "QAR"
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
title.en | Yes | String | Title of the variant in English
title.ar | Yes | String | Title of the variant in Arabic
sku | Yes | String | The sku of the variant
quantity | Yes | Number | The quantity of the variant in the warehouse
barcode | Yes | String | The unique barcode of the variant
price.amount | Yes | Number | The amount in which we will charge the customer
price.currencyCode | Yes | String | The currency code of the price amount
weight.amount | Yes | Number | The amount of the weight
weight.unit | Yes | String| The weight-unit of the variant. A value from, `g, kg, oz, lb` must be provided.
dimensions.width | Yes | Number | The width of the variant
dimensions.height | Yes | Number | The height of the variant
dimensions.length | Yes | Number | The length of the variant
dimensions.unit | Yes | String | The unit of measurement for dimensions. A value from, `mm, cm, m, km, in, ft, yd, mi` must be provided.
optionValues | No | List[UUID] | A list of UUIDs of option-values

### Request Body
```json
{
    "warehouse": "09d89f39-755b-4959-a5df-654c4f28c35f",
    "title": {
        "en": "iPhone 17 Lavender 256 GB",
        "ar": "iPhone 17 Lavender 256 GB"
    },
    "sku": "iphone-17-lavender-256",
    "quantity": 100,
    "barcode": "10000",
    "price": {
        "amount": 1000,
        "currencyCode": "QAR"
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
    "optionValues": [
        "443d0325-c769-49eb-8867-9287b18c2318"
    ]
}
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
        "amount": 1000,
        "currencyCode": "QAR"
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
    "product": {
        "uuid": "6cfd4dec-10a3-47e6-a2be-96df08cee2ac",
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
            "currencyCode": "QAR"
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
		"currencyCode": "QAR"
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
title.en | Yes | String | Title of the variant in English
title.ar | Yes | String | Title of the variant in Arabic
sku | Yes | String | The sku of the variant
barcode | Yes | String | The unique barcode of the variant
price.amount | Yes | Number | The amount in which we will charge the customer
price.currencyCode | Yes | String | The currency code of the price amount
weight.amount | Yes | Number | The amount of the weight
weight.unit | Yes | String| The weight-unit of the variant. A value from, `g, kg, oz, lb` must be provided.
dimensions.width | Yes | Number | The width of the variant
dimensions.height | Yes | Number | The height of the variant
dimensions.length | Yes | Number | The length of the variant
dimensions.unit | Yes | String | The unit of measurement for dimensions. A value from, `mm, cm, m, km, in, ft, yd, mi` must be provided.

### Request Body
```json
{
    "title": {
        "en": "A new laptop (in english)",
        "ar": "A new laptop (in arabic)"
    },
    "sku": "dell-xps-2026",
    "barcode": "1212321",
    "price": {
        "amount": 1000,
        "currencyCode": "QAR"
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
}
```

### Response Body
```json
{
    "uuid": "f1f6fb3a-f1d1-43b3-95b6-e213a020ca08",
    "titleEn": "A new laptop (in english)",
    "titleAr": "A new laptop (in arabic)",
    "sku": "dell-xps-2026",
    "barcode": "1212321",
    "price": {
        "amount": 1000,
        "currencyCode": "QAR"
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
}
```

Delete Product Variant
----------------------

> [!IMPORTANT]
> Required roles: `SuperAdmin`, `Admin`

```http
DELETE /v1/products/<product-uuid>/variants/<variant-uuid> HTTP/1.1
```

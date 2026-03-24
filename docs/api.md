Camion REST API
===============

User Authentication
===================

Register your account as a user
-------------------------------

### API Endpoint
```http
POST /v1/auth/user/register HTTP/1.1
```

### Request Body
```json
{
    "fullName": "Camion User",
    "emailAddress": "user@camion-app.com",
    "password": "your-password"
}
```

### Response Body
```json
{
    "token": "your-access-token",
    "user": {
        "uuid": "47da9315-f06b-4419-a4e2-1d4c20b99b19",
        "fullName": "Camion User",
        "role": "user",
        "isMfaEnabled": false,
        "isActive": false
    }
}
```

Login as a user
---------------

### API Endpoint
```http
POST /v1/auth/user/login HTTP/1.1
```

### Request Body
```json
{
    "emailAddress": "user@camion-app.com",
    "password": "your-password"
}
```

### Response Body
```json
{
    "token": "your-access-token",
    "user": {
        "uuid": "47da9315-f06b-4419-a4e2-1d4c20b99b19",
        "fullName": "Camion User",
        "role": "user",
        "isMfaEnabled": false,
        "isActive": false
    }
}
```

Logout as a user
----------------
> NOTE: You must include your access token as a `Bearer` token in the Authorization header.

### API Endpoint
```http
POST /v1/auth/user/logout HTTP/1.1
```

Update User (Self)
------------------
> NOTE: You must include your access token as a `Bearer` token in the Authorization header.

### API Endpoint
```http
POST /v1/auth/user/self HTTP/1.1
```

### Request Body
```json
{
    "fullName": "<Your new name>"
}
```

### Response Body
```json
{
    "uuid": "your-uuid",
    "fullName": "Your new name",
    "role": "user",
    "isMfaEnabled": false,
    "isActive": true
}
```

Update User Email Address (Self)
--------------------------------
> NOTE: You must include your access token as a `Bearer` token in the Authorization header.

### API Endpoint
```http
POST /v1/auth/user/self/email-address HTTP/1.1
```

### Request Body
```json
{
    "emailAddress": "your-new-email@camion-app.com"
}
```

### Response Body
```json
{
    "uuid": "47da9315-f06b-4419-a4e2-1d4c20b99b19",
    "fullName": "Camion User",
    "role": "user",
    "isMfaEnabled": false,
    "isActive": true
}
```

Update User Password (Self)
---------------------------
> NOTE: You must include your access token as a `Bearer` token in the Authorization header.

### API Endpoint
```http
POST /v1/auth/user/self/password HTTP/1.1
```

### Request Body
```json
{
    "passwordOld": "<your-old-password>",
    "passwordNew": "<your-new-password>",
    "passwordConfirm": "<your-new-password>"
}
```

### Response Body
```json
{
    "uuid": "47da9315-f06b-4419-a4e2-1d4c20b99b19",
    "fullName": "Camion User",
    "role": "user",
    "isMfaEnabled": false,
    "isActive": true
}
```

Customer Authentication
=======================

TODO:

Products
========

Example Product Document
------------------------
Once all the parameters of a product are set. We should get the following sample document from the products api.

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
                "unit": "KILOGRAMS"
            },
            "dimensions": {
                "width": "1000",
                "height": "1000",
                "length": "1000"
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

Create New Product
------------------
> NOTE: You must include your access token as a `Bearer` token in the Authorization header.

> NOTE: You must have an active account and `SuperAdmin` or `Admin` role to create products.

### API Endpoint
```http
POST /v1/products HTTP/1.1
```

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
    }
}
```

### Response Body
```json
{
    "uuid": "60b9ec90-0875-4319-b471-14153f9e5835",
    "slug": "iphone-17",
    "title": "iPhone 17",
    "titleAr": "آيفون 17",
    "brief": "From $799 or $33.29/mo. per month for 24 months",
    "briefAr": "ابتداءً من 799 دولارًا أو 33.29 دولارًا شهريًا لمدة 24 شهرًا",
    "description": "Your new iPhone awaits. Make it yours.",
    "descriptionAr": "جهاز آيفون الجديد بانتظارك. اجعله ملكك.",
    "descriptionHtml": "<b>Your new iPhone awaits. Make it yours</b>",
    "descriptionHtmlAr": "<b>Your new iPhone awaits. Make it yours</b>",
    "status": "DRAFT"
}
```

Retrieve Products
-----------------
> NOTE: You must include your access token as a `Bearer` token in the Authorization header.

> NOTE: You must have an active account and `SuperAdmin`, `Admin`, `Manager` or `User` role to retrieve products.

### API Endpoint
```http
GET /v1/products HTTP/1.1
```

### Query Parameters
Name | Description | Default
-----|-------------|--------
filters | A JSON string containing your search term, or any advanced search parameters. | `{}`
sort | The order in which we need to sort products |
pageNumber | The current page number | 1
itemsPerPage | The number of products to retrieve in the response | 30

### Response Body
```json
[
    {
        "uuid": "60b9ec90-0875-4319-b471-14153f9e5835",
        "slug": "iphone-17",
        "title": "iPhone 17",
        "titleAr": "آيفون 17",
        "brief": "From $799 or $33.29/mo. per month for 24 months",
        "briefAr": "ابتداءً من 799 دولارًا أو 33.29 دولارًا شهريًا لمدة 24 شهرًا",
        "description": "Your new iPhone awaits. Make it yours.",
        "descriptionAr": "جهاز آيفون الجديد بانتظارك. اجعله ملكك.",
        "descriptionHtml": "<b>Your new iPhone awaits. Make it yours</b>",
        "descriptionHtmlAr": "<b>Your new iPhone awaits. Make it yours</b>",
        "status": "DRAFT",
        "options": [],
        "variants": []
    }
]
```

Retrieve Product
----------------
> NOTE: You must include your access token as a `Bearer` token in the Authorization header.

> NOTE: You must have an active account and `SuperAdmin`, `Admin`, `Manager` or `User` role to retrieve products.

### API Endpoint
```http
GET /v1/products/<product-uuid> HTTP/1.1
```

### Response Body
```json
{
    "uuid": "60b9ec90-0875-4319-b471-14153f9e5835",
    "slug": "iphone-17",
    "title": "iPhone 17",
    "titleAr": "آيفون 17",
    "brief": "From $799 or $33.29/mo. per month for 24 months",
    "briefAr": "ابتداءً من 799 دولارًا أو 33.29 دولارًا شهريًا لمدة 24 شهرًا",
    "description": "Your new iPhone awaits. Make it yours.",
    "descriptionAr": "جهاز آيفون الجديد بانتظارك. اجعله ملكك.",
    "descriptionHtml": "<b>Your new iPhone awaits. Make it yours</b>",
    "descriptionHtmlAr": "<b>Your new iPhone awaits. Make it yours</b>",
    "status": "DRAFT",
    "options": [],
    "variants": []
}
```

Update Product
--------------
> NOTE: You must include your access token as a `Bearer` token in the Authorization header.

> NOTE: You must have an active account and `SuperAdmin`, `Admin` or `Manager` role to update products.

### API Endpoint
```http
PUT /v1/products/<product-uuid> HTTP/1.1
```

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
    "title": "iPhone 17",
    "titleAr": "آيفون 17",
    "brief": "From $899 or $33.29/mo. per month for 24 months",
    "briefAr": "ابتداءً من 899 دولارًا أو 33.29 دولارًا شهريًا لمدة 24 شهرًا",
    "description": "Your new iPhone awaits. Make it yours.",
    "descriptionAr": "جهاز آيفون الجديد بانتظارك. اجعله ملكك.",
    "descriptionHtml": "<b>Your new iPhone awaits. Make it yours</b>",
    "descriptionHtmlAr": "<b>Your new iPhone awaits. Make it yours</b>",
    "status": "DRAFT"
}
```

Update Product Slug
-------------------
> NOTE: You must include your access token as a `Bearer` token in the Authorization header.

> NOTE: You must have an active account and `SuperAdmin` or `Admin` role to update product slugs.

### API Endpoint
```http
PUT /v1/products/<product-uuid>/slug HTTP/1.1
```

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
    "title": "iPhone 17",
    "titleAr": "آيفون 17",
    "brief": "From $899 or $33.29/mo. per month for 24 months",
    "briefAr": "ابتداءً من 899 دولارًا أو 33.29 دولارًا شهريًا لمدة 24 شهرًا",
    "description": "Your new iPhone awaits. Make it yours.",
    "descriptionAr": "جهاز آيفون الجديد بانتظارك. اجعله ملكك.",
    "descriptionHtml": "<b>Your new iPhone awaits. Make it yours</b>",
    "descriptionHtmlAr": "<b>Your new iPhone awaits. Make it yours</b>",
    "status": "DRAFT"
}
```

Update Product Status
---------------------
> NOTE: You must include your access token as a `Bearer` token in the Authorization header.

> NOTE: You must have an active account and `SuperAdmin`, `Admin` or `Manager` role to update product status.

### API Endpoint
```http
PUT /v1/products/<product-uuid>/status HTTP/1.1
```

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
```

Delete Product
--------------
> NOTE: You must include your access token as a `Bearer` token in the Authorization header.

> NOTE: You must have an active account and `SuperAdmin` or `Admin` role to update product status.

### API Endpoint
```http
DELETE /v1/products/<product-uuid> HTTP/1.1
```

Products Options
================
Products options are the choices a customer get when they buy a product, eg. Color, Size or Memory etc.

Create a Product Option
-----------------------
> NOTE: You must include your access token as a `Bearer` token in the Authorization header.

> NOTE: You must have an active account and `SuperAdmin` or `Admin` role to create product options.

### API Endpoint
```http
POST /v1/products/<product-uuid>/options HTTP/1.1
```

### Request Body
```json
{
    "name": "Color",
    "position": 0
}
```

### Response Body
```json
{
    "uuid": "5926e2de-5e66-4e30-ba75-ecda7fbf4522",
    "name": "Color",
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
> NOTE: You must include your access token as a `Bearer` token in the Authorization header.

> NOTE: You must have an active account and `SuperAdmin` or `Admin` role to retrieve product options.

### API Endpoint
```http
GET /v1/products/<product-uuid>/options HTTP/1.1
```

### Query Parameters
Name | Description | Default
-----|-------------|--------
filters | A JSON string containing your search term, or any advanced search parameters. | `{}`
sort | The order in which we need to sort the items |
pageNumber | The current page number | 1
itemsPerPage | The number of items to retrieve in the response | 30

### Response Body
```json
[
    {
        "uuid": "e7685ad8-fa88-41f3-bc97-745fc41fbad2",
        "name": "Size",
        "position": "1"
    },
    {
        "uuid": "5926e2de-5e66-4e30-ba75-ecda7fbf4522",
        "name": "Color",
        "position": "0"
    }
]
```

Get Product Option
------------------
> NOTE: You must include your access token as a `Bearer` token in the Authorization header.

> NOTE: You must have an active account and `SuperAdmin` or `Admin` role to retrieve product options.

### API Endpoint
```http
GET /v1/products/<product-uuid>/options/<option-uuid> HTTP/1.1
```

### Response Body
```json
{
    "uuid": "e7685ad8-fa88-41f3-bc97-745fc41fbad2",
    "name": "Size",
    "position": "1"
}
```

Update Product Option
------------------
> NOTE: You must include your access token as a `Bearer` token in the Authorization header.

> NOTE: You must have an active account and `SuperAdmin` or `Admin` role to update product options.

### API Endpoint
```http
PUT /v1/products/<product-uuid>/options/<option-uuid> HTTP/1.1
```

### Request Body
```json
{
    "name": "Memory Size",
    "position": 1
}
```

### Response Body
```json
{
    "uuid": "e7685ad8-fa88-41f3-bc97-745fc41fbad2",
    "name": "Memory Size",
    "position": 1
}
```

Delete Product Option
---------------------
> NOTE: You must include your access token as a `Bearer` token in the Authorization header.

> NOTE: You must have an active account and `SuperAdmin` or `Admin` role to delete product options.

### API Endpoint
```http
DELETE /v1/products/<product-uuid>/options/<option-uuid> HTTP/1.1
```

Products Options Values
=======================
Products options values are the values a customer selects when they buy a product, eg. Color=Red, Size=Large or Memory=512GB etc.

Create Product Option Value
---------------------------
> NOTE: You must include your access token as a `Bearer` token in the Authorization header.

> NOTE: You must have an active account and `SuperAdmin` or `Admin` role to create product option values.

### API Endpoint
```http
POST /v1/products/<product-uuid>/options/<option-uuid>/values HTTP/1.1
```

### Request Body
```json
{
    "value": "Blue",
    "position": 0
}
```

### Response Body
```json
{
    "uuid": "cdb4ed20-04f9-407c-bcc6-0d0f8679ddfd",
    "value": "Blue",
    "position": 0
}
```

Retrieve Product Option Values
------------------------------
> NOTE: You must include your access token as a `Bearer` token in the Authorization header.

> NOTE: You must have an active account and `SuperAdmin` or `Admin` role to retrieve product option values.

### API Endpoint
```http
GET /v1/products/<product-uuid>/options/<option-uuid>/values HTTP/1.1
```

### Query Parameters
Name | Description | Default
-----|-------------|--------
filters | A JSON string containing your search term, or any advanced search parameters. | `{}`
sort | The order in which we need to sort the items |
pageNumber | The current page number | 1
itemsPerPage | The number of items to retrieve in the response | 30

### Response Body
```json
[
    {
        "uuid": "cdb4ed20-04f9-407c-bcc6-0d0f8679ddfd",
        "value": "Blue",
        "position": "0"
    }
]
```

Retrieve Product Option Value
-----------------------------
> NOTE: You must include your access token as a `Bearer` token in the Authorization header.

> NOTE: You must have an active account and `SuperAdmin` or `Admin` role to retrieve product option values.

### API Endpoint
```http
GET /v1/products/<product-uuid>/options/<option-uuid>/values/<value-uuid> HTTP/1.1
```

### Response Body
```json
{
    "uuid": "cdb4ed20-04f9-407c-bcc6-0d0f8679ddfd",
    "value": "Blue",
    "position": "0"
}
```

Update Product Option Value
---------------------------
> NOTE: You must include your access token as a `Bearer` token in the Authorization header.

> NOTE: You must have an active account and `SuperAdmin` or `Admin` role to update product option values.

### API Endpoint
```http
PUT /v1/products/<product-uuid>/options/<option-uuid>/values/<value-uuid> HTTP/1.1
```

### Request Body
```json
{
    "value": "Red",
    "position": 1
}
```

### Response Body
```json
{
    "uuid": "cdb4ed20-04f9-407c-bcc6-0d0f8679ddfd",
    "value": "Red",
    "position": 1
}
```

Delete Product Option Value
---------------------------
> NOTE: You must include your access token as a `Bearer` token in the Authorization header.

> NOTE: You must have an active account and `SuperAdmin` or `Admin` role to delete product option values.

### API Endpoint
```http
DELETE /v1/products/<product-uuid>/options/<option-uuid>/values/<value-uuid> HTTP/1.1
```

Product Variants
================

Create Product Variant
----------------------
> NOTE: You must include your access token as a `Bearer` token in the Authorization header.

> NOTE: You must have an active account and `SuperAdmin` or `Admin` role to create product variants.

### API Endpoint
```http
PUT /v1/products/<product-uuid>/variants HTTP/1.1
```

### Request Body
```json
{
    "title": {
        "en": "A new laptop | Red 512gb",
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
        "unit": "KILOGRAMS"
    },
    "dimensions": {
        "width": 1000,
        "height": 1000,
        "length": 1000
    },
    "optionValues": [
        "56ccb81e-0c1b-4e0b-aa00-2b111ba68322",
        "2cb13c21-6520-4d29-b599-9558319d0e95"
    ]
}
```

### Response Body
```json
{
    "uuid": "ea48506a-0f77-47cd-8e08-1e868623490e",
    "title": "A new laptop | Red 512gb",
    "titleAr": "A new laptop (in arabic)",
    "sku": "dell-xps-2026",
    "barcode": "1212321",
    "price": {
        "amount": 1000,
        "currencyCode": "QAR"
    },
    "weight": {
        "amount": 1,
        "unit": "KILOGRAMS"
    },
    "dimensions": {
        "width": 1000,
        "height": 1000,
        "length": 1000
    }
}
```

Get Product Variants
--------------------
> NOTE: You must include your access token as a `Bearer` token in the Authorization header.

> NOTE: You must have an active account and `SuperAdmin`, `Admin`, `Manager` or `User` role to retrieve product variants.

### API Endpoint
```http
GET /v1/products/<product-uuid>/variants HTTP/1.1
```

### Query Parameters
Name | Description | Default
-----|-------------|--------
filters | A JSON string containing your search term, or any advanced search parameters. | `{}`
sort | The order in which we need to sort the items |
pageNumber | The current page number | 1
itemsPerPage | The number of items to retrieve in the response | 30

### Response Body
```json
[
    {
        "uuid": "ea48506a-0f77-47cd-8e08-1e868623490e",
        "title": "A new laptop | Red 512gb",
        "titleAr": "A new laptop (in arabic)",
        "sku": "dell-xps-2026",
        "barcode": "1212321",
        "price": {
            "amount": "1000",
            "currencyCode": "QAR"
        },
        "weight": {
            "amount": "1",
            "unit": "KILOGRAMS"
        },
        "dimensions": {
            "width": "1000",
            "height": "1000",
            "length": "1000"
        }
    }
]
```

Get Product Variant
-------------------
> NOTE: You must include your access token as a `Bearer` token in the Authorization header.

> NOTE: You must have an active account and `SuperAdmin`, `Admin`, `Manager` or `User` role to retrieve product variants.

### API Endpoint
```http
GET /v1/products/<product-uuid>/variants/<variant-uuid> HTTP/1.1
```

### Response Body
```json
{
    "uuid": "ea48506a-0f77-47cd-8e08-1e868623490e",
    "title": "A new laptop | Red 512gb",
    "titleAr": "A new laptop (in arabic)",
    "sku": "dell-xps-2026",
    "barcode": "1212321",
    "price": {
        "amount": "1000",
        "currencyCode": "QAR"
    },
    "weight": {
        "amount": "1",
        "unit": "KILOGRAMS"
    },
    "dimensions": {
        "width": "1000",
        "height": "1000",
        "length": "1000"
    }
}
```

Update Product Variant
----------------------
> NOTE: You must include your access token as a `Bearer` token in the Authorization header.

> NOTE: You must have an active account and `SuperAdmin`, `Admin` or `Manager` role to update product variants.

### API Endpoint
```http
PUT /v1/products/<product-uuid>/variants/<variant-uuid> HTTP/1.1
```

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
        "unit": "KILOGRAMS"
    },
    "dimensions": {
        "width": 1000,
        "height": 1000,
        "length": 1000
    }
}
```

### Response Body
```json
{
    "uuid": "ea48506a-0f77-47cd-8e08-1e868623490e",
    "title": "A new laptop (in english)",
    "titleAr": "A new laptop (in arabic)",
    "sku": "dell-xps-2026",
    "barcode": "1212321",
    "price": {
        "amount": 1000,
        "currencyCode": "QAR"
    },
    "weight": {
        "amount": 1,
        "unit": "KILOGRAMS"
    },
    "dimensions": {
        "width": 1000,
        "height": 1000,
        "length": 1000
    }
}
```

Delete Product Variant
----------------------
> NOTE: You must include your access token as a `Bearer` token in the Authorization header.

> NOTE: You must have an active account and `SuperAdmin` or `Admin` role to delete product variants.

### API Endpoint
```http
DELETE /v1/products/<product-uuid>/variants/<variant-uuid> HTTP/1.1
```

GraphQL API
===========

This document includes the documentation of graphql support for the inventory.

The GraphQL support currently covers the following items.

- Products
- Banners
- Categories
- Stories

> [!IMPORTANT]
> You must include your access token as a `Bearer` token in the Authorization header. Your account must be active while making these requests.

Supported Locales
-----------------

The GraphQL API currently supports the following locales

- `en-us`
- `ar-qa`

GraphQL API Endpoint
--------------------

```http
POST /graphql HTTP/1.1
```

Retrieve Products
-----------------

> [!IMPORTANT]
> Required roles: `SuperAdmin`, `Admin`, `Manager`, `User`

### GraphQL Query

```graphql
query GetProducts($locale: String, $filters: String, $sort: String, $pageNumber: Int, $itemsPerPage: Int) {
  getProducts(filters: $filters, sort: $sort, pageNumber: $pageNumber, itemsPerPage: $itemsPerPage) {
    uuid
    slug
    title(locale: $locale)
    brief(locale: $locale)
    description(locale: $locale)
    descriptionHtml(locale: $locale)
    status
    options {
      uuid
      name(locale: $locale)
      position
      values {
        uuid
        value(locale: $locale)
        position
      }
    }
    variants {
      uuid
      title(locale: $locale)
      sku
      barcode
      price {
        amount
        currencyCode
      }
      weight {
        amount
        unit
      }
      dimensions {
        width
        height
        length
      }
      optionValues {
        optionValue {
          uuid
        }
      }
    }
  }
}
```

### GraphQL Variables

```json
{
    "locale": "en-us",
    "pageNumber": 1,
    "itemsPerPage": 100
}
```

### Response

```json
{
    "data": {
        "getProducts": [
            {
                "uuid": "54ce4e55-cc48-4386-b64f-16700e3ab6d1",
                "slug": "iphone-17",
                "title": "iPhone 17",
                "brief": "From $799 or $33.29/mo. per month for 24 months",
                "description": "Your new iPhone awaits. Make it yours.",
                "descriptionHtml": "<b>Your new iPhone awaits. Make it yours</b>",
                "status": "DRAFT",
                "options": [
                    {
                        "uuid": "76e8b712-a376-47e4-86e6-e0f96c74f3fa",
                        "name": "Storage",
                        "position": 0,
                        "values": [
                            {
                                "uuid": "1354c8ed-862c-4072-99cf-1a582840f769",
                                "value": "2 TB (English)",
                                "position": 0
                            }
                        ]
                    }
                ],
                "variants": [
                    {
                        "uuid": "7ed91279-6f50-4e35-91da-b8b9750b10e3",
                        "title": "iPhone 17 Red 2 TB (English)",
                        "sku": "iphone-17-red-1tb",
                        "barcode": "10000",
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
                            {
                                "optionValue": {
                                    "uuid": "1354c8ed-862c-4072-99cf-1a582840f769"
                                }
                            }
                        ]
                    }
                ]
            }
        ]
    }
}
```

Retrieve a Product by its slug
------------------------------

Individual products can also be queried using the schema below.

### GraphQL Query

```graphql
query GetProduct($locale: String, $slug: String) {
  getProduct(slug: $slug) {
    uuid
    slug
    title(locale: $locale)
    brief(locale: $locale)
    description(locale: $locale)
    descriptionHtml(locale: $locale)
    status
    options {
      uuid
      name(locale: $locale)
      position
      values {
        uuid
        value(locale: $locale)
        position
      }
    }
    variants {
      uuid
      title(locale: $locale)
      sku
      barcode
      price {
        amount
        currencyCode
      }
      weight {
        amount
        unit
      }
      dimensions {
        width
        height
        length
      }
      optionValues {
        optionValue {
          uuid
        }
      }
    }
  }
}
```

### GraphQL Variables

```json
{
    "locale": "en-us",
    "slug": "iphone-17"
}
```

### Response

```json
{
    "data": {
        "getProduct": {
            "uuid": "54ce4e55-cc48-4386-b64f-16700e3ab6d1",
            "slug": "iphone-17",
            "title": "iPhone 17",
            "brief": "From $799 or $33.29/mo. per month for 24 months",
            "description": "Your new iPhone awaits. Make it yours.",
            "descriptionHtml": "<b>Your new iPhone awaits. Make it yours</b>",
            "status": "DRAFT",
            "options": [
                {
                    "uuid": "76e8b712-a376-47e4-86e6-e0f96c74f3fa",
                    "name": "Storage",
                    "position": 0,
                    "values": [
                        {
                            "uuid": "1354c8ed-862c-4072-99cf-1a582840f769",
                            "value": "2 TB (English)",
                            "position": 0
                        }
                    ]
                }
            ],
            "variants": [
                {
                    "uuid": "7ed91279-6f50-4e35-91da-b8b9750b10e3",
                    "title": "iPhone 17 Red 2 TB (English)",
                    "sku": "iphone-17-red-1tb",
                    "barcode": "10000",
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
                        {
                            "optionValue": {
                                "uuid": "1354c8ed-862c-4072-99cf-1a582840f769"
                            }
                        }
                    ]
                }
            ]
        }
    }
}
```

Retrieve Banners
----------------

### GraphQL Query

```graphql
query GetBanners($locale: String, $filters: String, $sort: String, $pageNumber: Int, $itemsPerPage: Int) {
  getBanners(filters: $filters, sort: $sort, pageNumber: $pageNumber, itemsPerPage: $itemsPerPage) {
    uuid
    title(locale: $locale)
    imageUrl
    linkUrl
    placement
    isActive
  }
}
```

### GraphQL Variables

```json
{
    "locale": "en-us",
    "pageNumber": 1,
    "itemsPerPage": 100
}
```

### Response

```json
{
    "data": {
        "getBanners": [
            {
                "uuid": "065ebf39-a638-4bc1-aec0-93fb4286a652",
                "title": "New Product (English)",
                "imageUrl": "https://camion.s3.us-east-1.amazonaws.com/1bd64a8f-dd34-4b49-adb5-659bf2b7a151.jpg",
                "linkUrl": "New Products",
                "placement": "homepage",
                "isActive": true
            }
        ]
    }
}
```

Retrieve Categories
-------------------

### GraphQL Query

```graphql
query GetCategories($locale: String, $filters: String, $sort: String, $pageNumber: Int, $itemsPerPage: Int) {
  getCategories(filters: $filters, sort: $sort, pageNumber: $pageNumber, itemsPerPage: $itemsPerPage) {
    uuid
    slug
    name(locale: $locale)
    children {
      uuid
      slug
      name(locale: $locale)
      children {
        uuid
        slug
        name(locale: $locale)
      }
    }
  }
}
```

### GraphQL Variables

```json
{
    "locale": "en-us",
    "pageNumber": 1,
    "itemsPerPage": 100
}
```

### Response

```json
{
    "data": {
        "getCategories": [
            {
                "uuid": "ab783244-807a-4f7a-9a64-4f78941e7792",
                "slug": "electronics",
                "name": "electronics",
                "children": [
                    {
                        "uuid": "076241ba-6897-4328-a3f6-36abd1a06a39",
                        "slug": "phones",
                        "name": "phones",
                        "children": [
                            {
                                "uuid": "22846d73-4229-4ef7-b3f9-141315961489",
                                "slug": "iphones",
                                "name": "iphones"
                            }
                        ]
                    }
                ]
            }
        ]
    }
}
```

Retrieve Stories
----------------

### GraphQL Query

```graphql
query GetStories($locale: String, $filters: String, $sort: String, $pageNumber: Int, $itemsPerPage: Int) {
  getStories(filters: $filters, sort: $sort, pageNumber: $pageNumber, itemsPerPage: $itemsPerPage) {
    uuid
    caption(locale: $locale)
    isHighlighted
    frames {
        uuid
        mediaType
        mediaUrl
        thumbnailUrl
        duration
        order
    }
  }
}
```

### GraphQL Variables

```json
{
    "locale": "en-us",
    "pageNumber": 1,
    "itemsPerPage": 100
}
```

### Response

```json
{
    "data": {
        "getStories": [
            {
                "uuid": "6ff3643d-02fd-4757-abde-93d99daa57ee",
                "caption": "2025 (English)",
                "isHighlighted": false,
                "frames": [
                    {
                        "uuid": "d0bd2ed9-81b2-44fe-84dc-9c52a794a2a3",
                        "mediaType": "image",
                        "mediaUrl": "https://camion.s3.us-east-1.amazonaws.com/5b74e195-ebac-4fea-a84d-a654f96ed5b5.jpg",
                        "thumbnailUrl": "https://camion.s3.us-east-1.amazonaws.com/5b74e195-ebac-4fea-a84d-a654f96ed5b5.jpg",
                        "duration": 5,
                        "order": 0
                    }
                ]
            }
        ]
    }
}
```

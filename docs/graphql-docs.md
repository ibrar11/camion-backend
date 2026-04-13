GraphQL API
===========

This document includes the documentation of GraphQL support for the following items.

- Current Customer
- Current Customer Addresses
- Banners
- Stories
- Categories
- Products

> [!IMPORTANT]
> You must include your access token as a `Bearer` token in the Authorization header. Your must have a Customer account to use the GraphQL APIs.

Supported Languages
-------------------

The GraphQL API currently supports the following languages:

- `en`
- `ar`

Supported Currencies
--------------------

The GraphQL API currently supports the following currencies:

- `qar`
- `aed`
- `sar`
- `kwd`
- `omr`
- `bhd`
- `usd`

GraphQL API Features
====================

The following features are currently supported by the GraphQL API.

- Get Current Customer
- Get Current Customer Addresses
- Get Banners
- Get Stories
- Search Products (Best Match)
- Search Products (Price: Low-to-high)
- Search Products (Price: High-to-low)
- Get Recommended Products
- Get Featured Products
- Get Popular Products
- Get Related Products
- Get Recently Viewed Products
- Get Products
- Get Products By Category
- Get Product
- Get Categories

Get Current Customer
--------------------

### Request Body

```graphql
query GetCurrentCustomer {
  getCurrentCustomer {
    uuid
    fullName
    emailAddress
    phoneNumber
  }
}
```

### Response Body

```json
{
    "data": {
        "getCurrentCustomer": {
            "uuid": "6c90d8ef-7f9f-4dcb-8db3-9769fa771ae7",
            "fullName": "Your Name",
            "emailAddress": "your-name@your-domain.com",
            "phoneNumber": "+974 12345678"
        }
    }
}
```

Get Current Customer Addresses
------------------------------

### Request Body

```graphql
query GetCustomerAddresses($pageNumber: Int, $itemsPerPage: Int) {
  getCustomerAddresses(pageNumber: $pageNumber, itemsPerPage: $itemsPerPage) {
    uuid
    fullName
    phoneNumber
    streetAddress
    apartment
    zipCode
    city
    state
    country
    isDefault
  }
}
```

### GraphQL Variables

```json
{
    "pageNumber": 1,
    "itemsPerPage": 10
}
```

### Response Body

```json
{
    "data": {
        "getCustomerAddresses": [
            {
                "uuid": "acf740ef-12bc-4352-93be-82b0d50eaad4",
                "fullName": "James",
                "phoneNumber": "+974 12345678",
                "streetAddress": "Example Road",
                "apartment": "Unit 18",
                "zipCode": "12345",
                "city": "Example City",
                "state": "Example State",
                "country": "Example country",
                "isDefault": true
            },
            {
                "uuid": "07639713-c299-4cb9-8784-011867e37c30",
                "fullName": "James",
                "phoneNumber": "+974 12345678",
                "streetAddress": "Example Road",
                "apartment": "Unit 18",
                "zipCode": "12345",
                "city": "Example City",
                "state": "Example State",
                "country": "Example country",
                "isDefault": false
            }
        ]
    }
}
```

Get Banners
-----------

### Request Body

```graphql
query GetBanners($language: String, $pageNumber: Int, $itemsPerPage: Int) {
  getBanners(pageNumber: $pageNumber, itemsPerPage: $itemsPerPage) {
    uuid
    title(language: $language)
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
    "language": "en",
    "pageNumber": 1,
    "itemsPerPage": 100
}
```

### Response Body

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
            },
            {
                "uuid": "2d051593-91d1-41bb-b955-35211715599f",
                "title": "",
                "imageUrl": "https://camion.s3.us-east-1.amazonaws.com/1e7930fb-e6aa-482a-a2bb-9403b4ee1d35.jpg",
                "linkUrl": "",
                "placement": "",
                "isActive": true
            }
        ]
    }
}
```

Get Stories
-----------

### Request Body

```graphql
query GetStories($language: String, $pageNumber: Int, $itemsPerPage: Int) {
  getStories(pageNumber: $pageNumber, itemsPerPage: $itemsPerPage) {
    uuid
    caption(language: $language)
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
    "language": "en",
    "pageNumber": 1,
    "itemsPerPage": 100
}
```

### Response Body

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
                    },
                    {
                        "uuid": "3820665b-57c2-4446-9b25-dfc15257399a",
                        "mediaType": "image",
                        "mediaUrl": "https://camion.s3.us-east-1.amazonaws.com/c87816c4-2abb-4224-9ff3-3793d615001d.jpg",
                        "thumbnailUrl": "https://camion.s3.us-east-1.amazonaws.com/c87816c4-2abb-4224-9ff3-3793d615001d.jpg",
                        "duration": 5,
                        "order": 0
                    }
                ]
            }
        ]
    }
}
```

Search Products (Best Match)
----------------------------

### Request Body

```graphql
query SearchProducts($query: String!, $language: String, $currency: String!, $sort: String, $pageNumber: Int, $itemsPerPage: Int) {
  searchProducts(query: $query, language: $language, currency: $currency, sort: $sort, pageNumber: $pageNumber, itemsPerPage: $itemsPerPage) {
    uuid
    slug
    title(language: $language)
    brief(language: $language)
    description(language: $language)
    descriptionHtml(language: $language)
    status
    options {
      uuid
      name(language: $language)
      position
      values {
        uuid
        value(language: $language)
        position
      }
    }
    variants {
      uuid
      title(language: $language)
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
        unit
      }
      optionValues {
        optionValue {
          uuid
        }
      }
      images {
          uuid
          imageUrl
          thumbnailUrl
          alt
          isFeatured
          position
      }
    }
  }
}
```

### GraphQL Variables

```json
{
    "query": "25",
    "language":"en",
    "currency": "qar",
    "sort": "best-match",
    "pageNumber": 1,
    "itemsPerPage": 100
}
```

### Response Body

```json
{
    "data": {
        "searchProducts": [
            {
                "uuid": "15f027b7-ede7-4ccf-9ce9-7cf17ca32c95",
                "slug": "iphone-25",
                "title": "iPhone 25",
                "brief": "From $799 or $33.29/mo. per month for 24 months",
                "description": "Your new iPhone awaits. Make it yours.",
                "descriptionHtml": "<b>Your new iPhone awaits. Make it yours</b>",
                "status": "DRAFT",
                "options": [
                    {
                        "uuid": "aeb2c8c8-fbdd-4ba6-aae5-aaf40c00a26a",
                        "name": "Color",
                        "position": 0,
                        "values": [
                            {
                                "uuid": "16624414-447d-41d2-9224-e1e3efff8205",
                                "value": "Red",
                                "position": 1
                            }
                        ]
                    },
                    {
                        "uuid": "dd1d28cf-37d7-47d7-88c8-9331c27d5201",
                        "name": "Memory",
                        "position": 1,
                        "values": [
                            {
                                "uuid": "652cb2d4-3a4d-4343-82b2-55422a84cb47",
                                "value": "1 TB",
                                "position": 1
                            }
                        ]
                    }
                ],
                "variants": [
                    {
                        "uuid": "28a9db5c-1fb1-4acb-8193-e44514fb0952",
                        "title": "iPhone 24 Red 1 TB",
                        "sku": "iphone-24-red-1tb",
                        "barcode": "10000",
                        "price": {
                            "amount": 4000,
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
                            {
                                "optionValue": {
                                    "uuid": "16624414-447d-41d2-9224-e1e3efff8205"
                                }
                            },
                            {
                                "optionValue": {
                                    "uuid": "652cb2d4-3a4d-4343-82b2-55422a84cb47"
                                }
                            }
                        ],
                        "images": [
                            {
                                "uuid": "feb8f0da-32db-46d6-a132-69cfdd23e29d",
                                "imageUrl": "https://camion.s3.us-east-1.amazonaws.com/13f903c1-88d4-48b0-8ee4-dcde4c36eb15.jpg",
                                "thumbnailUrl": "https://camion.s3.us-east-1.amazonaws.com/13f903c1-88d4-48b0-8ee4-dcde4c36eb15.jpg",
                                "alt": "",
                                "isFeatured": false,
                                "position": 0
                            },
                            {
                                "uuid": "2321d5c9-0b93-4ef4-a4f5-5dd4f48f7946",
                                "imageUrl": "https://camion.s3.us-east-1.amazonaws.com/bcec2846-6350-4547-a248-55c47851c93a.jpg",
                                "thumbnailUrl": "https://camion.s3.us-east-1.amazonaws.com/bcec2846-6350-4547-a248-55c47851c93a.jpg",
                                "alt": "",
                                "isFeatured": false,
                                "position": 0
                            },
                            {
                                "uuid": "c9066b08-aa75-4947-8c21-a9aa7d1d77d1",
                                "imageUrl": "https://camion.s3.us-east-1.amazonaws.com/787d4649-9a61-4ea8-a69b-f10299397aa9.jpg",
                                "thumbnailUrl": "https://camion.s3.us-east-1.amazonaws.com/787d4649-9a61-4ea8-a69b-f10299397aa9.jpg",
                                "alt": "iPhone Photo",
                                "isFeatured": true,
                                "position": 0
                            }
                        ]
                    }
                ]
            }
        ]
    }
}
```

Search Products (Price: Low-to-high)
------------------------------------

### Request Body

```graphql
query SearchProducts($query: String!, $language: String!, $currency: String!, $sort: String, $pageNumber: Int, $itemsPerPage: Int) {
  searchProducts(query: $query, language: $language, currency: $currency, sort: $sort, pageNumber: $pageNumber, itemsPerPage: $itemsPerPage) {
    uuid
    slug
    title(language: $language)
    brief(language: $language)
    description(language: $language)
    descriptionHtml(language: $language)
    status
    options {
      uuid
      name(language: $language)
      position
      values {
        uuid
        value(language: $language)
        position
      }
    }
    variants {
      uuid
      title(language: $language)
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
        unit
      }
      optionValues {
        optionValue {
          uuid
        }
      }
      images {
          uuid
          imageUrl
          thumbnailUrl
          alt
          isFeatured
          position
      }
    }
  }
}
```

### GraphQL Variables

```json
{
    "query": "25",
    "language": "en",
    "currency": "qar",
    "sort": "price:low-to-high",
    "pageNumber": 1,
    "itemsPerPage": 100
}
```

### Response Body

```json
{
    "data": {
        "searchProducts": [
            {
                "uuid": "15f027b7-ede7-4ccf-9ce9-7cf17ca32c95",
                "slug": "iphone-25",
                "title": "iPhone 25",
                "brief": "From $799 or $33.29/mo. per month for 24 months",
                "description": "Your new iPhone awaits. Make it yours.",
                "descriptionHtml": "<b>Your new iPhone awaits. Make it yours</b>",
                "status": "DRAFT",
                "options": [
                    {
                        "uuid": "aeb2c8c8-fbdd-4ba6-aae5-aaf40c00a26a",
                        "name": "Color",
                        "position": 0,
                        "values": [
                            {
                                "uuid": "16624414-447d-41d2-9224-e1e3efff8205",
                                "value": "Red",
                                "position": 1
                            }
                        ]
                    },
                    {
                        "uuid": "dd1d28cf-37d7-47d7-88c8-9331c27d5201",
                        "name": "Memory",
                        "position": 1,
                        "values": [
                            {
                                "uuid": "652cb2d4-3a4d-4343-82b2-55422a84cb47",
                                "value": "1 TB",
                                "position": 1
                            }
                        ]
                    }
                ],
                "variants": [
                    {
                        "uuid": "28a9db5c-1fb1-4acb-8193-e44514fb0952",
                        "title": "iPhone 24 Red 1 TB",
                        "sku": "iphone-24-red-1tb",
                        "barcode": "10000",
                        "price": {
                            "amount": 4000,
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
                            {
                                "optionValue": {
                                    "uuid": "16624414-447d-41d2-9224-e1e3efff8205"
                                }
                            },
                            {
                                "optionValue": {
                                    "uuid": "652cb2d4-3a4d-4343-82b2-55422a84cb47"
                                }
                            }
                        ],
                        "images": [
                            {
                                "uuid": "feb8f0da-32db-46d6-a132-69cfdd23e29d",
                                "imageUrl": "https://camion.s3.us-east-1.amazonaws.com/13f903c1-88d4-48b0-8ee4-dcde4c36eb15.jpg",
                                "thumbnailUrl": "https://camion.s3.us-east-1.amazonaws.com/13f903c1-88d4-48b0-8ee4-dcde4c36eb15.jpg",
                                "alt": "",
                                "isFeatured": false,
                                "position": 0
                            },
                            {
                                "uuid": "2321d5c9-0b93-4ef4-a4f5-5dd4f48f7946",
                                "imageUrl": "https://camion.s3.us-east-1.amazonaws.com/bcec2846-6350-4547-a248-55c47851c93a.jpg",
                                "thumbnailUrl": "https://camion.s3.us-east-1.amazonaws.com/bcec2846-6350-4547-a248-55c47851c93a.jpg",
                                "alt": "",
                                "isFeatured": false,
                                "position": 0
                            },
                            {
                                "uuid": "c9066b08-aa75-4947-8c21-a9aa7d1d77d1",
                                "imageUrl": "https://camion.s3.us-east-1.amazonaws.com/787d4649-9a61-4ea8-a69b-f10299397aa9.jpg",
                                "thumbnailUrl": "https://camion.s3.us-east-1.amazonaws.com/787d4649-9a61-4ea8-a69b-f10299397aa9.jpg",
                                "alt": "iPhone Photo",
                                "isFeatured": true,
                                "position": 0
                            }
                        ]
                    }
                ]
            }
        ]
    }
}
```

Search Products (Price: High-to-low)
------------------------------------

### Request Body

```graphql
query SearchProducts($query: String!, $language: String, $currency: String!, $sort: String, $pageNumber: Int, $itemsPerPage: Int) {
  searchProducts(query: $query, language: $language, currency: $currency, sort: $sort, pageNumber: $pageNumber, itemsPerPage: $itemsPerPage) {
    uuid
    slug
    title(language: $language)
    brief(language: $language)
    description(language: $language)
    descriptionHtml(language: $language)
    status
    options {
      uuid
      name(language: $language)
      position
      values {
        uuid
        value(language: $language)
        position
      }
    }
    variants {
      uuid
      title(language: $language)
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
        unit
      }
      optionValues {
        optionValue {
          uuid
        }
      }
      images {
          uuid
          imageUrl
          thumbnailUrl
          alt
          isFeatured
          position
      }
    }
  }
}
```

### GraphQL Variables

```json
{
    "query": "25",
    "language":"en",
    "currency": "qar",
    "sort": "price:high-to-low",
    "pageNumber": 1,
    "itemsPerPage": 100
}
```

### Response Body

```json
{
    "data": {
        "searchProducts": [
            {
                "uuid": "15f027b7-ede7-4ccf-9ce9-7cf17ca32c95",
                "slug": "iphone-25",
                "title": "iPhone 25",
                "brief": "From $799 or $33.29/mo. per month for 24 months",
                "description": "Your new iPhone awaits. Make it yours.",
                "descriptionHtml": "<b>Your new iPhone awaits. Make it yours</b>",
                "status": "DRAFT",
                "options": [
                    {
                        "uuid": "aeb2c8c8-fbdd-4ba6-aae5-aaf40c00a26a",
                        "name": "Color",
                        "position": 0,
                        "values": [
                            {
                                "uuid": "16624414-447d-41d2-9224-e1e3efff8205",
                                "value": "Red",
                                "position": 1
                            }
                        ]
                    },
                    {
                        "uuid": "dd1d28cf-37d7-47d7-88c8-9331c27d5201",
                        "name": "Memory",
                        "position": 1,
                        "values": [
                            {
                                "uuid": "652cb2d4-3a4d-4343-82b2-55422a84cb47",
                                "value": "1 TB",
                                "position": 1
                            }
                        ]
                    }
                ],
                "variants": [
                    {
                        "uuid": "28a9db5c-1fb1-4acb-8193-e44514fb0952",
                        "title": "iPhone 24 Red 1 TB",
                        "sku": "iphone-24-red-1tb",
                        "barcode": "10000",
                        "price": {
                            "amount": 4000,
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
                            {
                                "optionValue": {
                                    "uuid": "16624414-447d-41d2-9224-e1e3efff8205"
                                }
                            },
                            {
                                "optionValue": {
                                    "uuid": "652cb2d4-3a4d-4343-82b2-55422a84cb47"
                                }
                            }
                        ],
                        "images": [
                            {
                                "uuid": "feb8f0da-32db-46d6-a132-69cfdd23e29d",
                                "imageUrl": "https://camion.s3.us-east-1.amazonaws.com/13f903c1-88d4-48b0-8ee4-dcde4c36eb15.jpg",
                                "thumbnailUrl": "https://camion.s3.us-east-1.amazonaws.com/13f903c1-88d4-48b0-8ee4-dcde4c36eb15.jpg",
                                "alt": "",
                                "isFeatured": false,
                                "position": 0
                            },
                            {
                                "uuid": "2321d5c9-0b93-4ef4-a4f5-5dd4f48f7946",
                                "imageUrl": "https://camion.s3.us-east-1.amazonaws.com/bcec2846-6350-4547-a248-55c47851c93a.jpg",
                                "thumbnailUrl": "https://camion.s3.us-east-1.amazonaws.com/bcec2846-6350-4547-a248-55c47851c93a.jpg",
                                "alt": "",
                                "isFeatured": false,
                                "position": 0
                            },
                            {
                                "uuid": "c9066b08-aa75-4947-8c21-a9aa7d1d77d1",
                                "imageUrl": "https://camion.s3.us-east-1.amazonaws.com/787d4649-9a61-4ea8-a69b-f10299397aa9.jpg",
                                "thumbnailUrl": "https://camion.s3.us-east-1.amazonaws.com/787d4649-9a61-4ea8-a69b-f10299397aa9.jpg",
                                "alt": "iPhone Photo",
                                "isFeatured": true,
                                "position": 0
                            }
                        ]
                    }
                ]
            }
        ]
    }
}
```

Get Recommended Products
------------------------

### Request Body

```graphql
query GetRecommendedProducts($slug: String!, $language: String, $currency: String!, $pageNumber: Int, $itemsPerPage: Int) {
  getRecommendedProducts(slug: $slug, language: $language, currency: $currency, pageNumber: $pageNumber, itemsPerPage: $itemsPerPage) {
    uuid
    slug
    title(language: $language)
    brief(language: $language)
    description(language: $language)
    descriptionHtml(language: $language)
    status
    options {
      uuid
      name(language: $language)
      position
      values {
        uuid
        value(language: $language)
        position
      }
    }
    variants {
      uuid
      title(language: $language)
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
        unit
      }
      optionValues {
        optionValue {
          uuid
        }
      }
      images {
          uuid
          imageUrl
          thumbnailUrl
          alt
          isFeatured
          position
      }
    }
  }
}
```

### GraphQL Variables

```json
{
    "slug": "iphone-16",
    "language":"en",
    "currency": "qar",
    "pageNumber": 1,
    "itemsPerPage": 100
}
```

### Response Body

```json
{
    "data": {
        "getRecommendedProducts": [
            {
                "uuid": "15f027b7-ede7-4ccf-9ce9-7cf17ca32c95",
                "slug": "iphone-25",
                "title": "iPhone 25",
                "brief": "From $799 or $33.29/mo. per month for 24 months",
                "description": "Your new iPhone awaits. Make it yours.",
                "descriptionHtml": "<b>Your new iPhone awaits. Make it yours</b>",
                "status": "DRAFT",
                "options": [
                    {
                        "uuid": "dd1d28cf-37d7-47d7-88c8-9331c27d5201",
                        "name": "Memory",
                        "position": 1,
                        "values": [
                            {
                                "uuid": "652cb2d4-3a4d-4343-82b2-55422a84cb47",
                                "value": "1 TB",
                                "position": 1
                            }
                        ]
                    },
                    {
                        "uuid": "aeb2c8c8-fbdd-4ba6-aae5-aaf40c00a26a",
                        "name": "Color",
                        "position": 0,
                        "values": [
                            {
                                "uuid": "16624414-447d-41d2-9224-e1e3efff8205",
                                "value": "Red",
                                "position": 1
                            }
                        ]
                    }
                ],
                "variants": [
                    {
                        "uuid": "28a9db5c-1fb1-4acb-8193-e44514fb0952",
                        "title": "iPhone 24 Red 1 TB",
                        "sku": "iphone-24-red-1tb",
                        "barcode": "10000",
                        "price": {
                            "amount": 4000,
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
                            {
                                "optionValue": {
                                    "uuid": "16624414-447d-41d2-9224-e1e3efff8205"
                                }
                            },
                            {
                                "optionValue": {
                                    "uuid": "652cb2d4-3a4d-4343-82b2-55422a84cb47"
                                }
                            }
                        ],
                        "images": [
                            {
                                "uuid": "feb8f0da-32db-46d6-a132-69cfdd23e29d",
                                "imageUrl": "https://camion.s3.us-east-1.amazonaws.com/13f903c1-88d4-48b0-8ee4-dcde4c36eb15.jpg",
                                "thumbnailUrl": "https://camion.s3.us-east-1.amazonaws.com/13f903c1-88d4-48b0-8ee4-dcde4c36eb15.jpg",
                                "alt": "",
                                "isFeatured": false,
                                "position": 0
                            },
                            {
                                "uuid": "c9066b08-aa75-4947-8c21-a9aa7d1d77d1",
                                "imageUrl": "https://camion.s3.us-east-1.amazonaws.com/787d4649-9a61-4ea8-a69b-f10299397aa9.jpg",
                                "thumbnailUrl": "https://camion.s3.us-east-1.amazonaws.com/787d4649-9a61-4ea8-a69b-f10299397aa9.jpg",
                                "alt": "iPhone Photo",
                                "isFeatured": true,
                                "position": 0
                            },
                            {
                                "uuid": "2321d5c9-0b93-4ef4-a4f5-5dd4f48f7946",
                                "imageUrl": "https://camion.s3.us-east-1.amazonaws.com/bcec2846-6350-4547-a248-55c47851c93a.jpg",
                                "thumbnailUrl": "https://camion.s3.us-east-1.amazonaws.com/bcec2846-6350-4547-a248-55c47851c93a.jpg",
                                "alt": "",
                                "isFeatured": false,
                                "position": 0
                            }
                        ]
                    }
                ]
            },
            {
                "uuid": "3b860068-9742-4fe7-9b0a-7e54e12da078",
                "slug": "iphone-16",
                "title": "iPhone 16",
                "brief": "From $799 or $33.29/mo. per month for 24 months",
                "description": "Your new iPhone awaits. Make it yours.",
                "descriptionHtml": "<b>Your new iPhone awaits. Make it yours</b>",
                "status": "DRAFT",
                "options": [],
                "variants": []
            },
            {
                "uuid": "c6be4c62-4047-475d-8908-b984d3ac100f",
                "slug": "iphone-18",
                "title": "iPhone 18",
                "brief": "From $799 or $33.29/mo. per month for 24 months",
                "description": "Your new iPhone awaits. Make it yours.",
                "descriptionHtml": "<b>Your new iPhone awaits. Make it yours</b>",
                "status": "DRAFT",
                "options": [
                    {
                        "uuid": "ba1eae52-e95d-4e23-ab57-1689c072c397",
                        "name": "Memory",
                        "position": 1,
                        "values": [
                            {
                                "uuid": "856027a1-0917-490e-a8ff-b67dfcb2e65d",
                                "value": "2 TB",
                                "position": 1
                            },
                            {
                                "uuid": "30b6c571-b1e6-4265-b2e0-2e1f0464505d",
                                "value": "1 TB",
                                "position": 0
                            }
                        ]
                    },
                    {
                        "uuid": "85571dfd-3c69-4d6e-be48-b697da80c422",
                        "name": "Color",
                        "position": 0,
                        "values": []
                    }
                ],
                "variants": [
                    {
                        "uuid": "f6bd65d8-e1a5-4911-ac90-1cc8f82dbe93",
                        "title": "iPhone 24 Red 1 TB",
                        "sku": "iphone-24-red-1tb",
                        "barcode": "10000",
                        "price": {
                            "amount": 4000,
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
                            {
                                "optionValue": {
                                    "uuid": "652cb2d4-3a4d-4343-82b2-55422a84cb47"
                                }
                            },
                            {
                                "optionValue": {
                                    "uuid": "16624414-447d-41d2-9224-e1e3efff8205"
                                }
                            }
                        ],
                        "images": []
                    },
                    {
                        "uuid": "27f1d58d-0633-48e2-968c-524f88075dd6",
                        "title": "iPhone 18 Red 2 TB",
                        "sku": "iphone-18-red-2tb",
                        "barcode": "10000",
                        "price": {
                            "amount": 4000,
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
                            {
                                "optionValue": {
                                    "uuid": "856027a1-0917-490e-a8ff-b67dfcb2e65d"
                                }
                            }
                        ],
                        "images": []
                    },
                    {
                        "uuid": "40bd6be5-3e37-4cc0-8895-88b6a263eb53",
                        "title": "iPhone 18 Red 1 TB",
                        "sku": "iphone-18-red-1tb",
                        "barcode": "10000",
                        "price": {
                            "amount": 3000,
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
                            {
                                "optionValue": {
                                    "uuid": "30b6c571-b1e6-4265-b2e0-2e1f0464505d"
                                }
                            }
                        ],
                        "images": []
                    }
                ]
            },
            {
                "uuid": "660e5d31-24e8-42e2-b8d7-1c45118ef29a",
                "slug": "iphone-17",
                "title": "iPhone 17",
                "brief": "From $799 or $33.29/mo. per month for 24 months",
                "description": "Your new iPhone awaits. Make it yours.",
                "descriptionHtml": "<b>Your new iPhone awaits. Make it yours</b>",
                "status": "DRAFT",
                "options": [
                    {
                        "uuid": "64862084-098d-452d-a358-cf10c2a41603",
                        "name": "Storage",
                        "position": 0,
                        "values": [
                            {
                                "uuid": "e0538aa0-f12e-4562-9357-e842ab89d735",
                                "value": "2 TB",
                                "position": 1
                            },
                            {
                                "uuid": "433393c9-fe11-46c1-a731-74ca0dd20caf",
                                "value": "1 TB",
                                "position": 0
                            }
                        ]
                    },
                    {
                        "uuid": "d3c1f7d0-4c86-4932-b09c-82eeb9d468ae",
                        "name": "Color",
                        "position": 0,
                        "values": []
                    }
                ],
                "variants": [
                    {
                        "uuid": "ea85dc28-2786-46a4-bd27-00fce68ab35f",
                        "title": "iPhone 17 Red 1 TB",
                        "sku": "iphone-17-red-2tb",
                        "barcode": "10000",
                        "price": {
                            "amount": 2000,
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
                            {
                                "optionValue": {
                                    "uuid": "e0538aa0-f12e-4562-9357-e842ab89d735"
                                }
                            }
                        ],
                        "images": []
                    },
                    {
                        "uuid": "c0a7c17f-3f78-45c7-9811-75abb0a46c9a",
                        "title": "iPhone 17 Red 1 TB",
                        "sku": "iphone-17-red-1tb",
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
                            {
                                "optionValue": {
                                    "uuid": "433393c9-fe11-46c1-a731-74ca0dd20caf"
                                }
                            }
                        ],
                        "images": []
                    }
                ]
            }
        ]
    }
}
```

Get Featured Products
---------------------

### Request Body

```graphql
query GetFeaturedProducts($language: String, $currency: String!, $pageNumber: Int, $itemsPerPage: Int) {
  getFeaturedProducts(language: $language, currency: $currency, pageNumber: $pageNumber, itemsPerPage: $itemsPerPage) {
    uuid
    slug
    title(language: $language)
    brief(language: $language)
    description(language: $language)
    descriptionHtml(language: $language)
    status
    options {
      uuid
      name(language: $language)
      position
      values {
        uuid
        value(language: $language)
        position
      }
    }
    variants {
      uuid
      title(language: $language)
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
        unit
      }
      optionValues {
        optionValue {
          uuid
        }
      }
      images {
          uuid
          imageUrl
          thumbnailUrl
          alt
          isFeatured
          position
      }
    }
  }
}
```

### GraphQL Variables

```json
{
    "language":"en",
    "currency": "qar",
    "pageNumber": 1,
    "itemsPerPage": 100
}
```

### Response Body

```json
{
    "data": {
        "getFeaturedProducts": [
            {
                "uuid": "15f027b7-ede7-4ccf-9ce9-7cf17ca32c95",
                "slug": "iphone-25",
                "title": "iPhone 25",
                "brief": "From $799 or $33.29/mo. per month for 24 months",
                "description": "Your new iPhone awaits. Make it yours.",
                "descriptionHtml": "<b>Your new iPhone awaits. Make it yours</b>",
                "status": "DRAFT",
                "options": [
                    {
                        "uuid": "dd1d28cf-37d7-47d7-88c8-9331c27d5201",
                        "name": "Memory",
                        "position": 1,
                        "values": [
                            {
                                "uuid": "652cb2d4-3a4d-4343-82b2-55422a84cb47",
                                "value": "1 TB",
                                "position": 1
                            }
                        ]
                    },
                    {
                        "uuid": "aeb2c8c8-fbdd-4ba6-aae5-aaf40c00a26a",
                        "name": "Color",
                        "position": 0,
                        "values": [
                            {
                                "uuid": "16624414-447d-41d2-9224-e1e3efff8205",
                                "value": "Red",
                                "position": 1
                            }
                        ]
                    }
                ],
                "variants": [
                    {
                        "uuid": "28a9db5c-1fb1-4acb-8193-e44514fb0952",
                        "title": "iPhone 24 Red 1 TB",
                        "sku": "iphone-24-red-1tb",
                        "barcode": "10000",
                        "price": {
                            "amount": 4000,
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
                            {
                                "optionValue": {
                                    "uuid": "16624414-447d-41d2-9224-e1e3efff8205"
                                }
                            },
                            {
                                "optionValue": {
                                    "uuid": "652cb2d4-3a4d-4343-82b2-55422a84cb47"
                                }
                            }
                        ],
                        "images": [
                            {
                                "uuid": "feb8f0da-32db-46d6-a132-69cfdd23e29d",
                                "imageUrl": "https://camion.s3.us-east-1.amazonaws.com/13f903c1-88d4-48b0-8ee4-dcde4c36eb15.jpg",
                                "thumbnailUrl": "https://camion.s3.us-east-1.amazonaws.com/13f903c1-88d4-48b0-8ee4-dcde4c36eb15.jpg",
                                "alt": "",
                                "isFeatured": false,
                                "position": 0
                            },
                            {
                                "uuid": "c9066b08-aa75-4947-8c21-a9aa7d1d77d1",
                                "imageUrl": "https://camion.s3.us-east-1.amazonaws.com/787d4649-9a61-4ea8-a69b-f10299397aa9.jpg",
                                "thumbnailUrl": "https://camion.s3.us-east-1.amazonaws.com/787d4649-9a61-4ea8-a69b-f10299397aa9.jpg",
                                "alt": "iPhone Photo",
                                "isFeatured": true,
                                "position": 0
                            },
                            {
                                "uuid": "2321d5c9-0b93-4ef4-a4f5-5dd4f48f7946",
                                "imageUrl": "https://camion.s3.us-east-1.amazonaws.com/bcec2846-6350-4547-a248-55c47851c93a.jpg",
                                "thumbnailUrl": "https://camion.s3.us-east-1.amazonaws.com/bcec2846-6350-4547-a248-55c47851c93a.jpg",
                                "alt": "",
                                "isFeatured": false,
                                "position": 0
                            }
                        ]
                    }
                ]
            },
            {
                "uuid": "3b860068-9742-4fe7-9b0a-7e54e12da078",
                "slug": "iphone-16",
                "title": "iPhone 16",
                "brief": "From $799 or $33.29/mo. per month for 24 months",
                "description": "Your new iPhone awaits. Make it yours.",
                "descriptionHtml": "<b>Your new iPhone awaits. Make it yours</b>",
                "status": "DRAFT",
                "options": [],
                "variants": []
            },
            {
                "uuid": "c6be4c62-4047-475d-8908-b984d3ac100f",
                "slug": "iphone-18",
                "title": "iPhone 18",
                "brief": "From $799 or $33.29/mo. per month for 24 months",
                "description": "Your new iPhone awaits. Make it yours.",
                "descriptionHtml": "<b>Your new iPhone awaits. Make it yours</b>",
                "status": "DRAFT",
                "options": [
                    {
                        "uuid": "ba1eae52-e95d-4e23-ab57-1689c072c397",
                        "name": "Memory",
                        "position": 1,
                        "values": [
                            {
                                "uuid": "856027a1-0917-490e-a8ff-b67dfcb2e65d",
                                "value": "2 TB",
                                "position": 1
                            },
                            {
                                "uuid": "30b6c571-b1e6-4265-b2e0-2e1f0464505d",
                                "value": "1 TB",
                                "position": 0
                            }
                        ]
                    },
                    {
                        "uuid": "85571dfd-3c69-4d6e-be48-b697da80c422",
                        "name": "Color",
                        "position": 0,
                        "values": []
                    }
                ],
                "variants": [
                    {
                        "uuid": "f6bd65d8-e1a5-4911-ac90-1cc8f82dbe93",
                        "title": "iPhone 24 Red 1 TB",
                        "sku": "iphone-24-red-1tb",
                        "barcode": "10000",
                        "price": {
                            "amount": 4000,
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
                            {
                                "optionValue": {
                                    "uuid": "652cb2d4-3a4d-4343-82b2-55422a84cb47"
                                }
                            },
                            {
                                "optionValue": {
                                    "uuid": "16624414-447d-41d2-9224-e1e3efff8205"
                                }
                            }
                        ],
                        "images": []
                    },
                    {
                        "uuid": "27f1d58d-0633-48e2-968c-524f88075dd6",
                        "title": "iPhone 18 Red 2 TB",
                        "sku": "iphone-18-red-2tb",
                        "barcode": "10000",
                        "price": {
                            "amount": 4000,
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
                            {
                                "optionValue": {
                                    "uuid": "856027a1-0917-490e-a8ff-b67dfcb2e65d"
                                }
                            }
                        ],
                        "images": []
                    },
                    {
                        "uuid": "40bd6be5-3e37-4cc0-8895-88b6a263eb53",
                        "title": "iPhone 18 Red 1 TB",
                        "sku": "iphone-18-red-1tb",
                        "barcode": "10000",
                        "price": {
                            "amount": 3000,
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
                            {
                                "optionValue": {
                                    "uuid": "30b6c571-b1e6-4265-b2e0-2e1f0464505d"
                                }
                            }
                        ],
                        "images": []
                    }
                ]
            },
            {
                "uuid": "660e5d31-24e8-42e2-b8d7-1c45118ef29a",
                "slug": "iphone-17",
                "title": "iPhone 17",
                "brief": "From $799 or $33.29/mo. per month for 24 months",
                "description": "Your new iPhone awaits. Make it yours.",
                "descriptionHtml": "<b>Your new iPhone awaits. Make it yours</b>",
                "status": "DRAFT",
                "options": [
                    {
                        "uuid": "64862084-098d-452d-a358-cf10c2a41603",
                        "name": "Storage",
                        "position": 0,
                        "values": [
                            {
                                "uuid": "e0538aa0-f12e-4562-9357-e842ab89d735",
                                "value": "2 TB",
                                "position": 1
                            },
                            {
                                "uuid": "433393c9-fe11-46c1-a731-74ca0dd20caf",
                                "value": "1 TB",
                                "position": 0
                            }
                        ]
                    },
                    {
                        "uuid": "d3c1f7d0-4c86-4932-b09c-82eeb9d468ae",
                        "name": "Color",
                        "position": 0,
                        "values": []
                    }
                ],
                "variants": [
                    {
                        "uuid": "ea85dc28-2786-46a4-bd27-00fce68ab35f",
                        "title": "iPhone 17 Red 1 TB",
                        "sku": "iphone-17-red-2tb",
                        "barcode": "10000",
                        "price": {
                            "amount": 2000,
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
                            {
                                "optionValue": {
                                    "uuid": "e0538aa0-f12e-4562-9357-e842ab89d735"
                                }
                            }
                        ],
                        "images": []
                    },
                    {
                        "uuid": "c0a7c17f-3f78-45c7-9811-75abb0a46c9a",
                        "title": "iPhone 17 Red 1 TB",
                        "sku": "iphone-17-red-1tb",
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
                            {
                                "optionValue": {
                                    "uuid": "433393c9-fe11-46c1-a731-74ca0dd20caf"
                                }
                            }
                        ],
                        "images": []
                    }
                ]
            }
        ]
    }
}
```

Get Popular Products
--------------------

### Request Body

```graphql
query GetPopularProducts($language: String, $currency: String!, $pageNumber: Int, $itemsPerPage: Int) {
  getPopularProducts(language: $language, currency: $currency, pageNumber: $pageNumber, itemsPerPage: $itemsPerPage) {
    uuid
    slug
    title(language: $language)
    brief(language: $language)
    description(language: $language)
    descriptionHtml(language: $language)
    status
    options {
      uuid
      name(language: $language)
      position
      values {
        uuid
        value(language: $language)
        position
      }
    }
    variants {
      uuid
      title(language: $language)
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
        unit
      }
      optionValues {
        optionValue {
          uuid
        }
      }
      images {
          uuid
          imageUrl
          thumbnailUrl
          alt
          isFeatured
          position
      }
    }
  }
}
```

### GraphQL Variables

```json
{
    "language":"en",
    "currency": "qar",
    "pageNumber": 1,
    "itemsPerPage": 100
}
```

### Response Body

```json
{
    "data": {
        "getPopularProducts": [
            {
                "uuid": "15f027b7-ede7-4ccf-9ce9-7cf17ca32c95",
                "slug": "iphone-25",
                "title": "iPhone 25",
                "brief": "From $799 or $33.29/mo. per month for 24 months",
                "description": "Your new iPhone awaits. Make it yours.",
                "descriptionHtml": "<b>Your new iPhone awaits. Make it yours</b>",
                "status": "DRAFT",
                "options": [
                    {
                        "uuid": "dd1d28cf-37d7-47d7-88c8-9331c27d5201",
                        "name": "Memory",
                        "position": 1,
                        "values": [
                            {
                                "uuid": "652cb2d4-3a4d-4343-82b2-55422a84cb47",
                                "value": "1 TB",
                                "position": 1
                            }
                        ]
                    },
                    {
                        "uuid": "aeb2c8c8-fbdd-4ba6-aae5-aaf40c00a26a",
                        "name": "Color",
                        "position": 0,
                        "values": [
                            {
                                "uuid": "16624414-447d-41d2-9224-e1e3efff8205",
                                "value": "Red",
                                "position": 1
                            }
                        ]
                    }
                ],
                "variants": [
                    {
                        "uuid": "28a9db5c-1fb1-4acb-8193-e44514fb0952",
                        "title": "iPhone 24 Red 1 TB",
                        "sku": "iphone-24-red-1tb",
                        "barcode": "10000",
                        "price": {
                            "amount": 4000,
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
                            {
                                "optionValue": {
                                    "uuid": "16624414-447d-41d2-9224-e1e3efff8205"
                                }
                            },
                            {
                                "optionValue": {
                                    "uuid": "652cb2d4-3a4d-4343-82b2-55422a84cb47"
                                }
                            }
                        ],
                        "images": [
                            {
                                "uuid": "feb8f0da-32db-46d6-a132-69cfdd23e29d",
                                "imageUrl": "https://camion.s3.us-east-1.amazonaws.com/13f903c1-88d4-48b0-8ee4-dcde4c36eb15.jpg",
                                "thumbnailUrl": "https://camion.s3.us-east-1.amazonaws.com/13f903c1-88d4-48b0-8ee4-dcde4c36eb15.jpg",
                                "alt": "",
                                "isFeatured": false,
                                "position": 0
                            },
                            {
                                "uuid": "c9066b08-aa75-4947-8c21-a9aa7d1d77d1",
                                "imageUrl": "https://camion.s3.us-east-1.amazonaws.com/787d4649-9a61-4ea8-a69b-f10299397aa9.jpg",
                                "thumbnailUrl": "https://camion.s3.us-east-1.amazonaws.com/787d4649-9a61-4ea8-a69b-f10299397aa9.jpg",
                                "alt": "iPhone Photo",
                                "isFeatured": true,
                                "position": 0
                            },
                            {
                                "uuid": "2321d5c9-0b93-4ef4-a4f5-5dd4f48f7946",
                                "imageUrl": "https://camion.s3.us-east-1.amazonaws.com/bcec2846-6350-4547-a248-55c47851c93a.jpg",
                                "thumbnailUrl": "https://camion.s3.us-east-1.amazonaws.com/bcec2846-6350-4547-a248-55c47851c93a.jpg",
                                "alt": "",
                                "isFeatured": false,
                                "position": 0
                            }
                        ]
                    }
                ]
            },
            {
                "uuid": "3b860068-9742-4fe7-9b0a-7e54e12da078",
                "slug": "iphone-16",
                "title": "iPhone 16",
                "brief": "From $799 or $33.29/mo. per month for 24 months",
                "description": "Your new iPhone awaits. Make it yours.",
                "descriptionHtml": "<b>Your new iPhone awaits. Make it yours</b>",
                "status": "DRAFT",
                "options": [],
                "variants": []
            },
            {
                "uuid": "c6be4c62-4047-475d-8908-b984d3ac100f",
                "slug": "iphone-18",
                "title": "iPhone 18",
                "brief": "From $799 or $33.29/mo. per month for 24 months",
                "description": "Your new iPhone awaits. Make it yours.",
                "descriptionHtml": "<b>Your new iPhone awaits. Make it yours</b>",
                "status": "DRAFT",
                "options": [
                    {
                        "uuid": "ba1eae52-e95d-4e23-ab57-1689c072c397",
                        "name": "Memory",
                        "position": 1,
                        "values": [
                            {
                                "uuid": "856027a1-0917-490e-a8ff-b67dfcb2e65d",
                                "value": "2 TB",
                                "position": 1
                            },
                            {
                                "uuid": "30b6c571-b1e6-4265-b2e0-2e1f0464505d",
                                "value": "1 TB",
                                "position": 0
                            }
                        ]
                    },
                    {
                        "uuid": "85571dfd-3c69-4d6e-be48-b697da80c422",
                        "name": "Color",
                        "position": 0,
                        "values": []
                    }
                ],
                "variants": [
                    {
                        "uuid": "f6bd65d8-e1a5-4911-ac90-1cc8f82dbe93",
                        "title": "iPhone 24 Red 1 TB",
                        "sku": "iphone-24-red-1tb",
                        "barcode": "10000",
                        "price": {
                            "amount": 4000,
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
                            {
                                "optionValue": {
                                    "uuid": "652cb2d4-3a4d-4343-82b2-55422a84cb47"
                                }
                            },
                            {
                                "optionValue": {
                                    "uuid": "16624414-447d-41d2-9224-e1e3efff8205"
                                }
                            }
                        ],
                        "images": []
                    },
                    {
                        "uuid": "27f1d58d-0633-48e2-968c-524f88075dd6",
                        "title": "iPhone 18 Red 2 TB",
                        "sku": "iphone-18-red-2tb",
                        "barcode": "10000",
                        "price": {
                            "amount": 4000,
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
                            {
                                "optionValue": {
                                    "uuid": "856027a1-0917-490e-a8ff-b67dfcb2e65d"
                                }
                            }
                        ],
                        "images": []
                    },
                    {
                        "uuid": "40bd6be5-3e37-4cc0-8895-88b6a263eb53",
                        "title": "iPhone 18 Red 1 TB",
                        "sku": "iphone-18-red-1tb",
                        "barcode": "10000",
                        "price": {
                            "amount": 3000,
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
                            {
                                "optionValue": {
                                    "uuid": "30b6c571-b1e6-4265-b2e0-2e1f0464505d"
                                }
                            }
                        ],
                        "images": []
                    }
                ]
            },
            {
                "uuid": "660e5d31-24e8-42e2-b8d7-1c45118ef29a",
                "slug": "iphone-17",
                "title": "iPhone 17",
                "brief": "From $799 or $33.29/mo. per month for 24 months",
                "description": "Your new iPhone awaits. Make it yours.",
                "descriptionHtml": "<b>Your new iPhone awaits. Make it yours</b>",
                "status": "DRAFT",
                "options": [
                    {
                        "uuid": "64862084-098d-452d-a358-cf10c2a41603",
                        "name": "Storage",
                        "position": 0,
                        "values": [
                            {
                                "uuid": "e0538aa0-f12e-4562-9357-e842ab89d735",
                                "value": "2 TB",
                                "position": 1
                            },
                            {
                                "uuid": "433393c9-fe11-46c1-a731-74ca0dd20caf",
                                "value": "1 TB",
                                "position": 0
                            }
                        ]
                    },
                    {
                        "uuid": "d3c1f7d0-4c86-4932-b09c-82eeb9d468ae",
                        "name": "Color",
                        "position": 0,
                        "values": []
                    }
                ],
                "variants": [
                    {
                        "uuid": "ea85dc28-2786-46a4-bd27-00fce68ab35f",
                        "title": "iPhone 17 Red 1 TB",
                        "sku": "iphone-17-red-2tb",
                        "barcode": "10000",
                        "price": {
                            "amount": 2000,
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
                            {
                                "optionValue": {
                                    "uuid": "e0538aa0-f12e-4562-9357-e842ab89d735"
                                }
                            }
                        ],
                        "images": []
                    },
                    {
                        "uuid": "c0a7c17f-3f78-45c7-9811-75abb0a46c9a",
                        "title": "iPhone 17 Red 1 TB",
                        "sku": "iphone-17-red-1tb",
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
                            {
                                "optionValue": {
                                    "uuid": "433393c9-fe11-46c1-a731-74ca0dd20caf"
                                }
                            }
                        ],
                        "images": []
                    }
                ]
            }
        ]
    }
}
```

Get Related Products
--------------------

### Request Body

```graphql
query GetRelatedProducts($slug: String!, $language: String, $currency: String!, $pageNumber: Int, $itemsPerPage: Int) {
  getRelatedProducts(slug: $slug, language: $language, currency: $currency, pageNumber: $pageNumber, itemsPerPage: $itemsPerPage) {
    uuid
    slug
    title(language: $language)
    brief(language: $language)
    description(language: $language)
    descriptionHtml(language: $language)
    status
    options {
      uuid
      name(language: $language)
      position
      values {
        uuid
        value(language: $language)
        position
      }
    }
    variants {
      uuid
      title(language: $language)
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
        unit
      }
      optionValues {
        optionValue {
          uuid
        }
      }
      images {
          uuid
          imageUrl
          thumbnailUrl
          alt
          isFeatured
          position
      }
    }
  }
}
```

### GraphQL Variables

```json
{
    "slug": "iphone-16",
    "language":"en",
    "currency": "qar",
    "pageNumber": 1,
    "itemsPerPage": 100
}
```

### Response Body

```json
{
    "data": {
        "getRelatedProducts": [
            {
                "uuid": "15f027b7-ede7-4ccf-9ce9-7cf17ca32c95",
                "slug": "iphone-25",
                "title": "iPhone 25",
                "brief": "From $799 or $33.29/mo. per month for 24 months",
                "description": "Your new iPhone awaits. Make it yours.",
                "descriptionHtml": "<b>Your new iPhone awaits. Make it yours</b>",
                "status": "DRAFT",
                "options": [
                    {
                        "uuid": "dd1d28cf-37d7-47d7-88c8-9331c27d5201",
                        "name": "Memory",
                        "position": 1,
                        "values": [
                            {
                                "uuid": "652cb2d4-3a4d-4343-82b2-55422a84cb47",
                                "value": "1 TB",
                                "position": 1
                            }
                        ]
                    },
                    {
                        "uuid": "aeb2c8c8-fbdd-4ba6-aae5-aaf40c00a26a",
                        "name": "Color",
                        "position": 0,
                        "values": [
                            {
                                "uuid": "16624414-447d-41d2-9224-e1e3efff8205",
                                "value": "Red",
                                "position": 1
                            }
                        ]
                    }
                ],
                "variants": [
                    {
                        "uuid": "28a9db5c-1fb1-4acb-8193-e44514fb0952",
                        "title": "iPhone 24 Red 1 TB",
                        "sku": "iphone-24-red-1tb",
                        "barcode": "10000",
                        "price": {
                            "amount": 4000,
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
                            {
                                "optionValue": {
                                    "uuid": "16624414-447d-41d2-9224-e1e3efff8205"
                                }
                            },
                            {
                                "optionValue": {
                                    "uuid": "652cb2d4-3a4d-4343-82b2-55422a84cb47"
                                }
                            }
                        ],
                        "images": [
                            {
                                "uuid": "feb8f0da-32db-46d6-a132-69cfdd23e29d",
                                "imageUrl": "https://camion.s3.us-east-1.amazonaws.com/13f903c1-88d4-48b0-8ee4-dcde4c36eb15.jpg",
                                "thumbnailUrl": "https://camion.s3.us-east-1.amazonaws.com/13f903c1-88d4-48b0-8ee4-dcde4c36eb15.jpg",
                                "alt": "",
                                "isFeatured": false,
                                "position": 0
                            },
                            {
                                "uuid": "c9066b08-aa75-4947-8c21-a9aa7d1d77d1",
                                "imageUrl": "https://camion.s3.us-east-1.amazonaws.com/787d4649-9a61-4ea8-a69b-f10299397aa9.jpg",
                                "thumbnailUrl": "https://camion.s3.us-east-1.amazonaws.com/787d4649-9a61-4ea8-a69b-f10299397aa9.jpg",
                                "alt": "iPhone Photo",
                                "isFeatured": true,
                                "position": 0
                            },
                            {
                                "uuid": "2321d5c9-0b93-4ef4-a4f5-5dd4f48f7946",
                                "imageUrl": "https://camion.s3.us-east-1.amazonaws.com/bcec2846-6350-4547-a248-55c47851c93a.jpg",
                                "thumbnailUrl": "https://camion.s3.us-east-1.amazonaws.com/bcec2846-6350-4547-a248-55c47851c93a.jpg",
                                "alt": "",
                                "isFeatured": false,
                                "position": 0
                            }
                        ]
                    }
                ]
            },
            {
                "uuid": "3b860068-9742-4fe7-9b0a-7e54e12da078",
                "slug": "iphone-16",
                "title": "iPhone 16",
                "brief": "From $799 or $33.29/mo. per month for 24 months",
                "description": "Your new iPhone awaits. Make it yours.",
                "descriptionHtml": "<b>Your new iPhone awaits. Make it yours</b>",
                "status": "DRAFT",
                "options": [],
                "variants": []
            },
            {
                "uuid": "c6be4c62-4047-475d-8908-b984d3ac100f",
                "slug": "iphone-18",
                "title": "iPhone 18",
                "brief": "From $799 or $33.29/mo. per month for 24 months",
                "description": "Your new iPhone awaits. Make it yours.",
                "descriptionHtml": "<b>Your new iPhone awaits. Make it yours</b>",
                "status": "DRAFT",
                "options": [
                    {
                        "uuid": "ba1eae52-e95d-4e23-ab57-1689c072c397",
                        "name": "Memory",
                        "position": 1,
                        "values": [
                            {
                                "uuid": "856027a1-0917-490e-a8ff-b67dfcb2e65d",
                                "value": "2 TB",
                                "position": 1
                            },
                            {
                                "uuid": "30b6c571-b1e6-4265-b2e0-2e1f0464505d",
                                "value": "1 TB",
                                "position": 0
                            }
                        ]
                    },
                    {
                        "uuid": "85571dfd-3c69-4d6e-be48-b697da80c422",
                        "name": "Color",
                        "position": 0,
                        "values": []
                    }
                ],
                "variants": [
                    {
                        "uuid": "f6bd65d8-e1a5-4911-ac90-1cc8f82dbe93",
                        "title": "iPhone 24 Red 1 TB",
                        "sku": "iphone-24-red-1tb",
                        "barcode": "10000",
                        "price": {
                            "amount": 4000,
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
                            {
                                "optionValue": {
                                    "uuid": "652cb2d4-3a4d-4343-82b2-55422a84cb47"
                                }
                            },
                            {
                                "optionValue": {
                                    "uuid": "16624414-447d-41d2-9224-e1e3efff8205"
                                }
                            }
                        ],
                        "images": []
                    },
                    {
                        "uuid": "27f1d58d-0633-48e2-968c-524f88075dd6",
                        "title": "iPhone 18 Red 2 TB",
                        "sku": "iphone-18-red-2tb",
                        "barcode": "10000",
                        "price": {
                            "amount": 4000,
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
                            {
                                "optionValue": {
                                    "uuid": "856027a1-0917-490e-a8ff-b67dfcb2e65d"
                                }
                            }
                        ],
                        "images": []
                    },
                    {
                        "uuid": "40bd6be5-3e37-4cc0-8895-88b6a263eb53",
                        "title": "iPhone 18 Red 1 TB",
                        "sku": "iphone-18-red-1tb",
                        "barcode": "10000",
                        "price": {
                            "amount": 3000,
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
                            {
                                "optionValue": {
                                    "uuid": "30b6c571-b1e6-4265-b2e0-2e1f0464505d"
                                }
                            }
                        ],
                        "images": []
                    }
                ]
            },
            {
                "uuid": "660e5d31-24e8-42e2-b8d7-1c45118ef29a",
                "slug": "iphone-17",
                "title": "iPhone 17",
                "brief": "From $799 or $33.29/mo. per month for 24 months",
                "description": "Your new iPhone awaits. Make it yours.",
                "descriptionHtml": "<b>Your new iPhone awaits. Make it yours</b>",
                "status": "DRAFT",
                "options": [
                    {
                        "uuid": "64862084-098d-452d-a358-cf10c2a41603",
                        "name": "Storage",
                        "position": 0,
                        "values": [
                            {
                                "uuid": "e0538aa0-f12e-4562-9357-e842ab89d735",
                                "value": "2 TB",
                                "position": 1
                            },
                            {
                                "uuid": "433393c9-fe11-46c1-a731-74ca0dd20caf",
                                "value": "1 TB",
                                "position": 0
                            }
                        ]
                    },
                    {
                        "uuid": "d3c1f7d0-4c86-4932-b09c-82eeb9d468ae",
                        "name": "Color",
                        "position": 0,
                        "values": []
                    }
                ],
                "variants": [
                    {
                        "uuid": "ea85dc28-2786-46a4-bd27-00fce68ab35f",
                        "title": "iPhone 17 Red 1 TB",
                        "sku": "iphone-17-red-2tb",
                        "barcode": "10000",
                        "price": {
                            "amount": 2000,
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
                            {
                                "optionValue": {
                                    "uuid": "e0538aa0-f12e-4562-9357-e842ab89d735"
                                }
                            }
                        ],
                        "images": []
                    },
                    {
                        "uuid": "c0a7c17f-3f78-45c7-9811-75abb0a46c9a",
                        "title": "iPhone 17 Red 1 TB",
                        "sku": "iphone-17-red-1tb",
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
                            {
                                "optionValue": {
                                    "uuid": "433393c9-fe11-46c1-a731-74ca0dd20caf"
                                }
                            }
                        ],
                        "images": []
                    }
                ]
            }
        ]
    }
}
```

Get Recently Viewed Products
----------------------------

### Request Body

```graphql
query GetRecentlyViewedProducts($language: String, $currency: String!, $pageNumber: Int, $itemsPerPage: Int) {
  getRecentlyViewedProducts(language: $language, currency: $currency, pageNumber: $pageNumber, itemsPerPage: $itemsPerPage) {
    uuid
    slug
    title(language: $language)
    brief(language: $language)
    description(language: $language)
    descriptionHtml(language: $language)
    status
    options {
      uuid
      name(language: $language)
      position
      values {
        uuid
        value(language: $language)
        position
      }
    }
    variants {
      uuid
      title(language: $language)
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
        unit
      }
      optionValues {
        optionValue {
          uuid
        }
      }
      images {
          uuid
          imageUrl
          thumbnailUrl
          alt
          isFeatured
          position
      }
    }
  }
}
```

### GraphQL Variables

```json
{
    "language":"en",
    "currency": "qar",
    "pageNumber": 1,
    "itemsPerPage": 100
}
```

### Response Body

```json
{
    "data": {
        "getRecentlyViewedProducts": [
            {
                "uuid": "15f027b7-ede7-4ccf-9ce9-7cf17ca32c95",
                "slug": "iphone-25",
                "title": "iPhone 25",
                "brief": "From $799 or $33.29/mo. per month for 24 months",
                "description": "Your new iPhone awaits. Make it yours.",
                "descriptionHtml": "<b>Your new iPhone awaits. Make it yours</b>",
                "status": "DRAFT",
                "options": [
                    {
                        "uuid": "dd1d28cf-37d7-47d7-88c8-9331c27d5201",
                        "name": "Memory",
                        "position": 1,
                        "values": [
                            {
                                "uuid": "652cb2d4-3a4d-4343-82b2-55422a84cb47",
                                "value": "1 TB",
                                "position": 1
                            }
                        ]
                    },
                    {
                        "uuid": "aeb2c8c8-fbdd-4ba6-aae5-aaf40c00a26a",
                        "name": "Color",
                        "position": 0,
                        "values": [
                            {
                                "uuid": "16624414-447d-41d2-9224-e1e3efff8205",
                                "value": "Red",
                                "position": 1
                            }
                        ]
                    }
                ],
                "variants": [
                    {
                        "uuid": "28a9db5c-1fb1-4acb-8193-e44514fb0952",
                        "title": "iPhone 24 Red 1 TB",
                        "sku": "iphone-24-red-1tb",
                        "barcode": "10000",
                        "price": {
                            "amount": 4000,
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
                            {
                                "optionValue": {
                                    "uuid": "16624414-447d-41d2-9224-e1e3efff8205"
                                }
                            },
                            {
                                "optionValue": {
                                    "uuid": "652cb2d4-3a4d-4343-82b2-55422a84cb47"
                                }
                            }
                        ],
                        "images": [
                            {
                                "uuid": "feb8f0da-32db-46d6-a132-69cfdd23e29d",
                                "imageUrl": "https://camion.s3.us-east-1.amazonaws.com/13f903c1-88d4-48b0-8ee4-dcde4c36eb15.jpg",
                                "thumbnailUrl": "https://camion.s3.us-east-1.amazonaws.com/13f903c1-88d4-48b0-8ee4-dcde4c36eb15.jpg",
                                "alt": "",
                                "isFeatured": false,
                                "position": 0
                            },
                            {
                                "uuid": "c9066b08-aa75-4947-8c21-a9aa7d1d77d1",
                                "imageUrl": "https://camion.s3.us-east-1.amazonaws.com/787d4649-9a61-4ea8-a69b-f10299397aa9.jpg",
                                "thumbnailUrl": "https://camion.s3.us-east-1.amazonaws.com/787d4649-9a61-4ea8-a69b-f10299397aa9.jpg",
                                "alt": "iPhone Photo",
                                "isFeatured": true,
                                "position": 0
                            },
                            {
                                "uuid": "2321d5c9-0b93-4ef4-a4f5-5dd4f48f7946",
                                "imageUrl": "https://camion.s3.us-east-1.amazonaws.com/bcec2846-6350-4547-a248-55c47851c93a.jpg",
                                "thumbnailUrl": "https://camion.s3.us-east-1.amazonaws.com/bcec2846-6350-4547-a248-55c47851c93a.jpg",
                                "alt": "",
                                "isFeatured": false,
                                "position": 0
                            }
                        ]
                    }
                ]
            },
            {
                "uuid": "3b860068-9742-4fe7-9b0a-7e54e12da078",
                "slug": "iphone-16",
                "title": "iPhone 16",
                "brief": "From $799 or $33.29/mo. per month for 24 months",
                "description": "Your new iPhone awaits. Make it yours.",
                "descriptionHtml": "<b>Your new iPhone awaits. Make it yours</b>",
                "status": "DRAFT",
                "options": [],
                "variants": []
            },
            {
                "uuid": "c6be4c62-4047-475d-8908-b984d3ac100f",
                "slug": "iphone-18",
                "title": "iPhone 18",
                "brief": "From $799 or $33.29/mo. per month for 24 months",
                "description": "Your new iPhone awaits. Make it yours.",
                "descriptionHtml": "<b>Your new iPhone awaits. Make it yours</b>",
                "status": "DRAFT",
                "options": [
                    {
                        "uuid": "ba1eae52-e95d-4e23-ab57-1689c072c397",
                        "name": "Memory",
                        "position": 1,
                        "values": [
                            {
                                "uuid": "856027a1-0917-490e-a8ff-b67dfcb2e65d",
                                "value": "2 TB",
                                "position": 1
                            },
                            {
                                "uuid": "30b6c571-b1e6-4265-b2e0-2e1f0464505d",
                                "value": "1 TB",
                                "position": 0
                            }
                        ]
                    },
                    {
                        "uuid": "85571dfd-3c69-4d6e-be48-b697da80c422",
                        "name": "Color",
                        "position": 0,
                        "values": []
                    }
                ],
                "variants": [
                    {
                        "uuid": "f6bd65d8-e1a5-4911-ac90-1cc8f82dbe93",
                        "title": "iPhone 24 Red 1 TB",
                        "sku": "iphone-24-red-1tb",
                        "barcode": "10000",
                        "price": {
                            "amount": 4000,
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
                            {
                                "optionValue": {
                                    "uuid": "652cb2d4-3a4d-4343-82b2-55422a84cb47"
                                }
                            },
                            {
                                "optionValue": {
                                    "uuid": "16624414-447d-41d2-9224-e1e3efff8205"
                                }
                            }
                        ],
                        "images": []
                    },
                    {
                        "uuid": "27f1d58d-0633-48e2-968c-524f88075dd6",
                        "title": "iPhone 18 Red 2 TB",
                        "sku": "iphone-18-red-2tb",
                        "barcode": "10000",
                        "price": {
                            "amount": 4000,
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
                            {
                                "optionValue": {
                                    "uuid": "856027a1-0917-490e-a8ff-b67dfcb2e65d"
                                }
                            }
                        ],
                        "images": []
                    },
                    {
                        "uuid": "40bd6be5-3e37-4cc0-8895-88b6a263eb53",
                        "title": "iPhone 18 Red 1 TB",
                        "sku": "iphone-18-red-1tb",
                        "barcode": "10000",
                        "price": {
                            "amount": 3000,
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
                            {
                                "optionValue": {
                                    "uuid": "30b6c571-b1e6-4265-b2e0-2e1f0464505d"
                                }
                            }
                        ],
                        "images": []
                    }
                ]
            },
            {
                "uuid": "660e5d31-24e8-42e2-b8d7-1c45118ef29a",
                "slug": "iphone-17",
                "title": "iPhone 17",
                "brief": "From $799 or $33.29/mo. per month for 24 months",
                "description": "Your new iPhone awaits. Make it yours.",
                "descriptionHtml": "<b>Your new iPhone awaits. Make it yours</b>",
                "status": "DRAFT",
                "options": [
                    {
                        "uuid": "64862084-098d-452d-a358-cf10c2a41603",
                        "name": "Storage",
                        "position": 0,
                        "values": [
                            {
                                "uuid": "e0538aa0-f12e-4562-9357-e842ab89d735",
                                "value": "2 TB",
                                "position": 1
                            },
                            {
                                "uuid": "433393c9-fe11-46c1-a731-74ca0dd20caf",
                                "value": "1 TB",
                                "position": 0
                            }
                        ]
                    },
                    {
                        "uuid": "d3c1f7d0-4c86-4932-b09c-82eeb9d468ae",
                        "name": "Color",
                        "position": 0,
                        "values": []
                    }
                ],
                "variants": [
                    {
                        "uuid": "ea85dc28-2786-46a4-bd27-00fce68ab35f",
                        "title": "iPhone 17 Red 1 TB",
                        "sku": "iphone-17-red-2tb",
                        "barcode": "10000",
                        "price": {
                            "amount": 2000,
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
                            {
                                "optionValue": {
                                    "uuid": "e0538aa0-f12e-4562-9357-e842ab89d735"
                                }
                            }
                        ],
                        "images": []
                    },
                    {
                        "uuid": "c0a7c17f-3f78-45c7-9811-75abb0a46c9a",
                        "title": "iPhone 17 Red 1 TB",
                        "sku": "iphone-17-red-1tb",
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
                            {
                                "optionValue": {
                                    "uuid": "433393c9-fe11-46c1-a731-74ca0dd20caf"
                                }
                            }
                        ],
                        "images": []
                    }
                ]
            }
        ]
    }
}
```

Get Products
------------

### Request Body

```graphql
query GetProducts($language: String, $currency: String, $sort: String, $pageNumber: Int, $itemsPerPage: Int) {
  getProducts(language: $language, currency: $currency, sort: $sort, pageNumber: $pageNumber, itemsPerPage: $itemsPerPage) {
    uuid
    slug
    title(language: $language)
    brief(language: $language)
    description(language: $language)
    descriptionHtml(language: $language)
    status
    options {
      uuid
      name(language: $language)
      position
      values {
        uuid
        value(language: $language)
        position
      }
    }
    variants {
      uuid
      title(language: $language)
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
      images {
          uuid
          imageUrl
          thumbnailUrl
          alt
          isFeatured
          position
      }
    }
  }
}
```

### GraphQL Variables

```json
{
    "language": "en",
    "currency": "qar",
    "pageNumber": 1,
    "itemsPerPage": 100
}
```

### Response Body

```json
{
    "data": {
        "getProducts": [
            {
                "uuid": "15f027b7-ede7-4ccf-9ce9-7cf17ca32c95",
                "slug": "iphone-25",
                "title": "iPhone 25",
                "brief": "From $799 or $33.29/mo. per month for 24 months",
                "description": "Your new iPhone awaits. Make it yours.",
                "descriptionHtml": "<b>Your new iPhone awaits. Make it yours</b>",
                "status": "DRAFT",
                "options": [
                    {
                        "uuid": "dd1d28cf-37d7-47d7-88c8-9331c27d5201",
                        "name": "Memory",
                        "position": 1,
                        "values": [
                            {
                                "uuid": "652cb2d4-3a4d-4343-82b2-55422a84cb47",
                                "value": "1 TB",
                                "position": 1
                            }
                        ]
                    },
                    {
                        "uuid": "aeb2c8c8-fbdd-4ba6-aae5-aaf40c00a26a",
                        "name": "Color",
                        "position": 0,
                        "values": [
                            {
                                "uuid": "16624414-447d-41d2-9224-e1e3efff8205",
                                "value": "Red",
                                "position": 1
                            }
                        ]
                    }
                ],
                "variants": [
                    {
                        "uuid": "28a9db5c-1fb1-4acb-8193-e44514fb0952",
                        "title": "iPhone 24 Red 1 TB",
                        "sku": "iphone-24-red-1tb",
                        "barcode": "10000",
                        "price": {
                            "amount": 4000,
                            "currencyCode": "QAR"
                        },
                        "weight": {
                            "amount": 1,
                            "unit": "kg"
                        },
                        "dimensions": {
                            "width": 1000,
                            "height": 1000,
                            "length": 1000
                        },
                        "optionValues": [
                            {
                                "optionValue": {
                                    "uuid": "16624414-447d-41d2-9224-e1e3efff8205"
                                }
                            },
                            {
                                "optionValue": {
                                    "uuid": "652cb2d4-3a4d-4343-82b2-55422a84cb47"
                                }
                            }
                        ],
                        "images": [
                            {
                                "uuid": "feb8f0da-32db-46d6-a132-69cfdd23e29d",
                                "imageUrl": "https://camion.s3.us-east-1.amazonaws.com/13f903c1-88d4-48b0-8ee4-dcde4c36eb15.jpg",
                                "thumbnailUrl": "https://camion.s3.us-east-1.amazonaws.com/13f903c1-88d4-48b0-8ee4-dcde4c36eb15.jpg",
                                "alt": "",
                                "isFeatured": false,
                                "position": 0
                            },
                            {
                                "uuid": "c9066b08-aa75-4947-8c21-a9aa7d1d77d1",
                                "imageUrl": "https://camion.s3.us-east-1.amazonaws.com/787d4649-9a61-4ea8-a69b-f10299397aa9.jpg",
                                "thumbnailUrl": "https://camion.s3.us-east-1.amazonaws.com/787d4649-9a61-4ea8-a69b-f10299397aa9.jpg",
                                "alt": "iPhone Photo",
                                "isFeatured": true,
                                "position": 0
                            },
                            {
                                "uuid": "2321d5c9-0b93-4ef4-a4f5-5dd4f48f7946",
                                "imageUrl": "https://camion.s3.us-east-1.amazonaws.com/bcec2846-6350-4547-a248-55c47851c93a.jpg",
                                "thumbnailUrl": "https://camion.s3.us-east-1.amazonaws.com/bcec2846-6350-4547-a248-55c47851c93a.jpg",
                                "alt": "",
                                "isFeatured": false,
                                "position": 0
                            }
                        ]
                    }
                ]
            },
            {
                "uuid": "3b860068-9742-4fe7-9b0a-7e54e12da078",
                "slug": "iphone-16",
                "title": "iPhone 16",
                "brief": "From $799 or $33.29/mo. per month for 24 months",
                "description": "Your new iPhone awaits. Make it yours.",
                "descriptionHtml": "<b>Your new iPhone awaits. Make it yours</b>",
                "status": "DRAFT",
                "options": [],
                "variants": []
            },
            {
                "uuid": "c6be4c62-4047-475d-8908-b984d3ac100f",
                "slug": "iphone-18",
                "title": "iPhone 18",
                "brief": "From $799 or $33.29/mo. per month for 24 months",
                "description": "Your new iPhone awaits. Make it yours.",
                "descriptionHtml": "<b>Your new iPhone awaits. Make it yours</b>",
                "status": "DRAFT",
                "options": [
                    {
                        "uuid": "ba1eae52-e95d-4e23-ab57-1689c072c397",
                        "name": "Memory",
                        "position": 1,
                        "values": [
                            {
                                "uuid": "856027a1-0917-490e-a8ff-b67dfcb2e65d",
                                "value": "2 TB",
                                "position": 1
                            },
                            {
                                "uuid": "30b6c571-b1e6-4265-b2e0-2e1f0464505d",
                                "value": "1 TB",
                                "position": 0
                            }
                        ]
                    },
                    {
                        "uuid": "85571dfd-3c69-4d6e-be48-b697da80c422",
                        "name": "Color",
                        "position": 0,
                        "values": []
                    }
                ],
                "variants": [
                    {
                        "uuid": "f6bd65d8-e1a5-4911-ac90-1cc8f82dbe93",
                        "title": "iPhone 24 Red 1 TB",
                        "sku": "iphone-24-red-1tb",
                        "barcode": "10000",
                        "price": {
                            "amount": 4000,
                            "currencyCode": "QAR"
                        },
                        "weight": {
                            "amount": 1,
                            "unit": "kg"
                        },
                        "dimensions": {
                            "width": 1000,
                            "height": 1000,
                            "length": 1000
                        },
                        "optionValues": [
                            {
                                "optionValue": {
                                    "uuid": "652cb2d4-3a4d-4343-82b2-55422a84cb47"
                                }
                            },
                            {
                                "optionValue": {
                                    "uuid": "16624414-447d-41d2-9224-e1e3efff8205"
                                }
                            }
                        ],
                        "images": []
                    },
                    {
                        "uuid": "27f1d58d-0633-48e2-968c-524f88075dd6",
                        "title": "iPhone 18 Red 2 TB",
                        "sku": "iphone-18-red-2tb",
                        "barcode": "10000",
                        "price": {
                            "amount": 4000,
                            "currencyCode": "QAR"
                        },
                        "weight": {
                            "amount": 1,
                            "unit": "kg"
                        },
                        "dimensions": {
                            "width": 1000,
                            "height": 1000,
                            "length": 1000
                        },
                        "optionValues": [
                            {
                                "optionValue": {
                                    "uuid": "856027a1-0917-490e-a8ff-b67dfcb2e65d"
                                }
                            }
                        ],
                        "images": []
                    },
                    {
                        "uuid": "40bd6be5-3e37-4cc0-8895-88b6a263eb53",
                        "title": "iPhone 18 Red 1 TB",
                        "sku": "iphone-18-red-1tb",
                        "barcode": "10000",
                        "price": {
                            "amount": 3000,
                            "currencyCode": "QAR"
                        },
                        "weight": {
                            "amount": 1,
                            "unit": "kg"
                        },
                        "dimensions": {
                            "width": 1000,
                            "height": 1000,
                            "length": 1000
                        },
                        "optionValues": [
                            {
                                "optionValue": {
                                    "uuid": "30b6c571-b1e6-4265-b2e0-2e1f0464505d"
                                }
                            }
                        ],
                        "images": []
                    }
                ]
            },
            {
                "uuid": "660e5d31-24e8-42e2-b8d7-1c45118ef29a",
                "slug": "iphone-17",
                "title": "iPhone 17",
                "brief": "From $799 or $33.29/mo. per month for 24 months",
                "description": "Your new iPhone awaits. Make it yours.",
                "descriptionHtml": "<b>Your new iPhone awaits. Make it yours</b>",
                "status": "DRAFT",
                "options": [
                    {
                        "uuid": "64862084-098d-452d-a358-cf10c2a41603",
                        "name": "Storage",
                        "position": 0,
                        "values": [
                            {
                                "uuid": "e0538aa0-f12e-4562-9357-e842ab89d735",
                                "value": "2 TB",
                                "position": 1
                            },
                            {
                                "uuid": "433393c9-fe11-46c1-a731-74ca0dd20caf",
                                "value": "1 TB",
                                "position": 0
                            }
                        ]
                    },
                    {
                        "uuid": "d3c1f7d0-4c86-4932-b09c-82eeb9d468ae",
                        "name": "Color",
                        "position": 0,
                        "values": []
                    }
                ],
                "variants": [
                    {
                        "uuid": "ea85dc28-2786-46a4-bd27-00fce68ab35f",
                        "title": "iPhone 17 Red 1 TB",
                        "sku": "iphone-17-red-2tb",
                        "barcode": "10000",
                        "price": {
                            "amount": 2000,
                            "currencyCode": "QAR"
                        },
                        "weight": {
                            "amount": 1,
                            "unit": "kg"
                        },
                        "dimensions": {
                            "width": 1000,
                            "height": 1000,
                            "length": 1000
                        },
                        "optionValues": [
                            {
                                "optionValue": {
                                    "uuid": "e0538aa0-f12e-4562-9357-e842ab89d735"
                                }
                            }
                        ],
                        "images": []
                    },
                    {
                        "uuid": "c0a7c17f-3f78-45c7-9811-75abb0a46c9a",
                        "title": "iPhone 17 Red 1 TB",
                        "sku": "iphone-17-red-1tb",
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
                            "length": 1000
                        },
                        "optionValues": [
                            {
                                "optionValue": {
                                    "uuid": "433393c9-fe11-46c1-a731-74ca0dd20caf"
                                }
                            }
                        ],
                        "images": []
                    }
                ]
            }
        ]
    }
}
```

Get Products By Category
------------------------

### Request Body

```graphql
query GetProductsByCategory($slug: String!, $language: String, $currency: String, $sort: String, $pageNumber: Int, $itemsPerPage: Int) {
  getProductsByCategory(slug: $slug, language: $language, currency: $currency, sort: $sort, pageNumber: $pageNumber, itemsPerPage: $itemsPerPage) {
    uuid
    slug
    title(language: $language)
    brief(language: $language)
    description(language: $language)
    descriptionHtml(language: $language)
    status
    options {
      uuid
      name(language: $language)
      position
      values {
        uuid
        value(language: $language)
        position
      }
    }
    variants {
      uuid
      title(language: $language)
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
      images {
          uuid
          imageUrl
          thumbnailUrl
          alt
          isFeatured
          position
      }
    }
  }
}
```

### GraphQL Variables

```json
{
    "slug": "iphones",
    "language": "en",
    "currency": "qar",
    "pageNumber": 1,
    "itemsPerPage": 100
}
```

### Response Body

```json
{
    "data": {
        "getProductsByCategory": [
            {
                "uuid": "15f027b7-ede7-4ccf-9ce9-7cf17ca32c95",
                "slug": "iphone-25",
                "title": "iPhone 25",
                "brief": "From $799 or $33.29/mo. per month for 24 months",
                "description": "Your new iPhone awaits. Make it yours.",
                "descriptionHtml": "<b>Your new iPhone awaits. Make it yours</b>",
                "status": "DRAFT",
                "options": [
                    {
                        "uuid": "aeb2c8c8-fbdd-4ba6-aae5-aaf40c00a26a",
                        "name": "Color",
                        "position": 0,
                        "values": [
                            {
                                "uuid": "16624414-447d-41d2-9224-e1e3efff8205",
                                "value": "Red",
                                "position": 1
                            }
                        ]
                    },
                    {
                        "uuid": "dd1d28cf-37d7-47d7-88c8-9331c27d5201",
                        "name": "Memory",
                        "position": 1,
                        "values": [
                            {
                                "uuid": "652cb2d4-3a4d-4343-82b2-55422a84cb47",
                                "value": "1 TB",
                                "position": 1
                            }
                        ]
                    }
                ],
                "variants": [
                    {
                        "uuid": "28a9db5c-1fb1-4acb-8193-e44514fb0952",
                        "title": "iPhone 24 Red 1 TB",
                        "sku": "iphone-24-red-1tb",
                        "barcode": "10000",
                        "price": {
                            "amount": 4000,
                            "currencyCode": "QAR"
                        },
                        "weight": {
                            "amount": 1,
                            "unit": "kg"
                        },
                        "dimensions": {
                            "width": 1000,
                            "height": 1000,
                            "length": 1000
                        },
                        "optionValues": [
                            {
                                "optionValue": {
                                    "uuid": "16624414-447d-41d2-9224-e1e3efff8205"
                                }
                            },
                            {
                                "optionValue": {
                                    "uuid": "652cb2d4-3a4d-4343-82b2-55422a84cb47"
                                }
                            }
                        ],
                        "images": [
                            {
                                "uuid": "c9066b08-aa75-4947-8c21-a9aa7d1d77d1",
                                "imageUrl": "https://camion.s3.us-east-1.amazonaws.com/787d4649-9a61-4ea8-a69b-f10299397aa9.jpg",
                                "thumbnailUrl": "https://camion.s3.us-east-1.amazonaws.com/787d4649-9a61-4ea8-a69b-f10299397aa9.jpg",
                                "alt": "iPhone Photo",
                                "isFeatured": true,
                                "position": 0
                            },
                            {
                                "uuid": "2321d5c9-0b93-4ef4-a4f5-5dd4f48f7946",
                                "imageUrl": "https://camion.s3.us-east-1.amazonaws.com/bcec2846-6350-4547-a248-55c47851c93a.jpg",
                                "thumbnailUrl": "https://camion.s3.us-east-1.amazonaws.com/bcec2846-6350-4547-a248-55c47851c93a.jpg",
                                "alt": "",
                                "isFeatured": false,
                                "position": 0
                            },
                            {
                                "uuid": "feb8f0da-32db-46d6-a132-69cfdd23e29d",
                                "imageUrl": "https://camion.s3.us-east-1.amazonaws.com/13f903c1-88d4-48b0-8ee4-dcde4c36eb15.jpg",
                                "thumbnailUrl": "https://camion.s3.us-east-1.amazonaws.com/13f903c1-88d4-48b0-8ee4-dcde4c36eb15.jpg",
                                "alt": "",
                                "isFeatured": false,
                                "position": 0
                            }
                        ]
                    }
                ]
            }
        ]
    }
}
```


Get Product
-----------

### Request Body

```graphql
query GetProduct($slug: String, $language: String, $currency: String) {
  getProduct(slug: $slug, language: $language, currency: $currency) {
    uuid
    slug
    title(language: $language)
    brief(language: $language)
    description(language: $language)
    descriptionHtml(language: $language)
    status
    options {
      uuid
      name(language: $language)
      position
      values {
        uuid
        value(language: $language)
        position
      }
    }
    variants {
      uuid
      title(language: $language)
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
        unit
      }
      optionValues {
        optionValue {
          uuid
        }
      }
      images {
          uuid
          imageUrl
          thumbnailUrl
          alt
          isFeatured
          position
      }
    }
    reviews {
        uuid
        rating
        comment
        customer {
            uuid
            fullName
        }
    }
  }
}
```

### GraphQL Variables

```json
{
    "slug": "iphone-17",
    "language": "en",
    "currency": "qar"
}
```

### Response Body

```json
{
    "data": {
        "getProduct": {
            "uuid": "15f027b7-ede7-4ccf-9ce9-7cf17ca32c95",
            "slug": "iphone-25",
            "title": "iPhone 25",
            "brief": "From $799 or $33.29/mo. per month for 24 months",
            "description": "Your new iPhone awaits. Make it yours.",
            "descriptionHtml": "<b>Your new iPhone awaits. Make it yours</b>",
            "status": "DRAFT",
            "options": [
                {
                    "uuid": "aeb2c8c8-fbdd-4ba6-aae5-aaf40c00a26a",
                    "name": "Color",
                    "position": 0,
                    "values": [
                        {
                            "uuid": "16624414-447d-41d2-9224-e1e3efff8205",
                            "value": "Red",
                            "position": 1
                        }
                    ]
                },
                {
                    "uuid": "dd1d28cf-37d7-47d7-88c8-9331c27d5201",
                    "name": "Memory",
                    "position": 1,
                    "values": [
                        {
                            "uuid": "652cb2d4-3a4d-4343-82b2-55422a84cb47",
                            "value": "1 TB",
                            "position": 1
                        }
                    ]
                }
            ],
            "variants": [
                {
                    "uuid": "28a9db5c-1fb1-4acb-8193-e44514fb0952",
                    "title": "iPhone 24 Red 1 TB",
                    "sku": "iphone-24-red-1tb",
                    "barcode": "10000",
                    "price": {
                        "amount": 4000,
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
                        {
                            "optionValue": {
                                "uuid": "16624414-447d-41d2-9224-e1e3efff8205"
                            }
                        },
                        {
                            "optionValue": {
                                "uuid": "652cb2d4-3a4d-4343-82b2-55422a84cb47"
                            }
                        }
                    ],
                    "images": [
                        {
                            "uuid": "feb8f0da-32db-46d6-a132-69cfdd23e29d",
                            "imageUrl": "https://camion.s3.us-east-1.amazonaws.com/13f903c1-88d4-48b0-8ee4-dcde4c36eb15.jpg",
                            "thumbnailUrl": "https://camion.s3.us-east-1.amazonaws.com/13f903c1-88d4-48b0-8ee4-dcde4c36eb15.jpg",
                            "alt": "",
                            "isFeatured": false,
                            "position": 0
                        },
                        {
                            "uuid": "2321d5c9-0b93-4ef4-a4f5-5dd4f48f7946",
                            "imageUrl": "https://camion.s3.us-east-1.amazonaws.com/bcec2846-6350-4547-a248-55c47851c93a.jpg",
                            "thumbnailUrl": "https://camion.s3.us-east-1.amazonaws.com/bcec2846-6350-4547-a248-55c47851c93a.jpg",
                            "alt": "",
                            "isFeatured": false,
                            "position": 0
                        },
                        {
                            "uuid": "c9066b08-aa75-4947-8c21-a9aa7d1d77d1",
                            "imageUrl": "https://camion.s3.us-east-1.amazonaws.com/787d4649-9a61-4ea8-a69b-f10299397aa9.jpg",
                            "thumbnailUrl": "https://camion.s3.us-east-1.amazonaws.com/787d4649-9a61-4ea8-a69b-f10299397aa9.jpg",
                            "alt": "iPhone Photo",
                            "isFeatured": true,
                            "position": 0
                        }
                    ]
                }
            ],
            "reviews": [
                {
                    "uuid": "362ad2ce-c5bf-46dd-be56-f00ba4241982",
                    "rating": 1,
                    "comment": "This was very bad",
                    "customer": {
                        "uuid": "6c90d8ef-7f9f-4dcb-8db3-9769fa771ae7",
                        "fullName": "Your Name"
                    }
                }
            ]
        }
    }
}
```

Get Categories
--------------

### Request Body

```graphql
query GetCategories($language: String, $pageNumber: Int, $itemsPerPage: Int) {
  getCategories(pageNumber: $pageNumber, itemsPerPage: $itemsPerPage) {
    uuid
    slug
    name(language: $language)
    thumbnailUrl
    children {
      uuid
      slug
      name(language: $language)
      thumbnailUrl
      children {
        uuid
        slug
        name(language: $language)
        thumbnailUrl
      }
    }
  }
}
```

### GraphQL Variables

```json
{
    "language": "en",
    "pageNumber": 1,
    "itemsPerPage": 100
}
```

### Response Body

```json
{
    "data": {
        "getCategories": [
            {
                "uuid": "4708c8c7-2f1e-40a7-bf80-d524d4b5db51",
                "slug": "iphones",
                "name": "iphones",
                "thumbnailUrl": "https://camion.s3.us-east-1.amazonaws.com/c87816c4-2abb-4224-9ff3-3793d615001d.jpg",
                "children": [
                    {
                        "uuid": "25308ea0-2d4b-4693-a6e4-0e4e96805f3c",
                        "slug": "iphones-two",
                        "name": "iphones",
                        "thumbnailUrl": "https://camion.s3.us-east-1.amazonaws.com/c87816c4-2abb-4224-9ff3-3793d615001d.jpg",
                        "children": []
                    }
                ]
            }
        ]
    }
}
```

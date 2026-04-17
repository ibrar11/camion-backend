GraphQL API
===========

This document includes the documentation of GraphQL support for the following items.

- Current Customer
- Current Customer Addresses
- Banners
- Stories
- Categories
- Products
- Notifications
- Orders

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
- Get Notifications
- Mark Notification as Read
- Get Languages
- Get Currencies
- Get Current Affiliate
- Get Current Affiliate Wallet Transactions
- Get Current Affiliate Bank Accounts
- Get Current Affiliate Coupons
- Get Current Customer Orders

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
        images {
            uuid
            thumbnailUrl
            imageUrl
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

#### Failed Response

```json
{
    "data": {
        "getProduct": null
    }
}
```

#### Successful Response

```json
{
    "data": {
        "getProduct": {
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
                            "uuid": "433393c9-fe11-46c1-a731-74ca0dd20caf",
                            "value": "1 TB",
                            "position": 0
                        },
                        {
                            "uuid": "e0538aa0-f12e-4562-9357-e842ab89d735",
                            "value": "2 TB",
                            "position": 1
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
                },
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
                }
            ],
            "reviews": [
                {
                    "uuid": "7887b00a-b74a-4621-8e8b-0e5233643b4f",
                    "rating": 1,
                    "comment": "This was very bad",
                    "customer": {
                        "uuid": "6c90d8ef-7f9f-4dcb-8db3-9769fa771ae7",
                        "fullName": "Your Name"
                    },
                    "images": [
                        {
                            "uuid": "cb9eb5bd-7165-47fa-96c8-e3f85a27e890",
                            "thumbnailUrl": "https://camion.s3.us-east-1.amazonaws.com/review/66329c2f-38d5-4e63-b559-1124c3cc7560.jpg",
                            "imageUrl": "https://camion.s3.us-east-1.amazonaws.com/review/66329c2f-38d5-4e63-b559-1124c3cc7560.jpg"
                        }
                    ]
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

Get Languages
-------------

### Request Body

```graphql
query GetLanguages {
  getLanguages {
    uuid
    name
    shortCode
  }
}
```

### Response Body

```json
{
  "data": {
    "getLanguages": [
      {
        "uuid": "a1b2c3",
        "name": "English",
        "shortCode": "en"
      },
      {
        "uuid": "d4e5f6",
        "name": "Arabic",
        "shortCode": "ar"
      }
    ]
  }
}
```

> ⚠️ If no languages exist, an empty array will be returned.

---

Get Currencies
--------------

### Request Body

```graphql
query GetCurrencies {
  getCurrencies {
    uuid
    name
    alphaCode
  }
}
```

### Response Body

```json
{
  "data": {
    "getCurrencies": [
      {
        "uuid": "x1y2z3",
        "name": "United States Dollar",
        "alphaCode": "USD"
      },
      {
        "uuid": "p4q5r6",
        "name": "Saudi Riyal",
        "alphaCode": "SAR"
      }
    ]
  }
}
```

> ⚠️ If no currencies exist, an empty array will be returned.

---

## ⚠️ Notes

---

* Languages and currencies are **admin-managed resources**
* No default data is guaranteed to exist
* Frontend must handle empty responses safely
* `shortCode` (languages) is lowercase
* `alphaCode` (currencies) is uppercase
* Both fields are unique and enforced at API level

---

Notifications
=============

Notifications are created by the system or admin and delivered to customers. Customers can query their own notifications and mark them as read.

**Notification Types**

| Type | Description |
|---|---|
| `ORDER_PLACED` | Order has been successfully placed |
| `ORDER_CONFIRMED` | Order confirmed by the vendor |
| `ORDER_PROCESSING` | Order is being prepared |
| `ORDER_SHIPPED` | Order has been shipped |
| `ORDER_OUT_FOR_DELIVERY` | Order is out for delivery |
| `ORDER_DELIVERED` | Order has been delivered |
| `ORDER_DELAYED` | Order delivery has been delayed |
| `ORDER_CANCELLED` | Order was cancelled |
| `ORDER_RETURNED` | Order return initiated |
| `ORDER_REFUNDED` | Refund has been processed |
| `PAYMENT_SUCCESSFUL` | Payment was completed successfully |
| `PAYMENT_FAILED` | Payment attempt failed |
| `PAYMENT_PENDING` | Payment is awaiting confirmation |
| `PAYMENT_REFUND_INITIATED` | Refund has been initiated |
| `PAYMENT_REFUND_COMPLETED` | Refund has been credited back |
| `PAYMENT_METHOD_ADDED` | A new payment method was added |
| `PAYMENT_METHOD_REMOVED` | A payment method was removed |
| `PAYMENT_DUE_REMINDER` | Upcoming or overdue payment reminder |
| `LOW_STOCK_ALERT` | Product stock is running low |
| `OUT_OF_STOCK` | Product is now out of stock |
| `BACK_IN_STOCK` | Previously out-of-stock product is available again |
| `PRICE_DROP` | Product price has dropped |
| `LIMITED_STOCK_WARNING` | Only a few units remaining |

**Priority Levels**

| Value | Meaning |
|---|---|
| `LOW` | Informational, no urgency |
| `MEDIUM` | Standard notification (default) |
| `HIGH` | Requires immediate attention |

---

Get Notifications
-----------------

Retrieves all notifications for the logged-in customer, ordered by most recent first.

> ⚠️ Returns an empty array if the customer has no notifications.

### Request Body

```graphql
query GetNotifications {
  getNotifications {
    uuid
    type
    title
    brief
    message
    payload
    priority
    isRead
    createdAt
    updatedAt
    customer {
      uuid
      fullName
      emailAddress
      phoneNumber
    }
  }
}
```

### Response Body

```json
{
    "data": {
        "getNotifications": [
            {
                "uuid": "a3f1e2c4-9b87-4d12-bc34-1f2e3d4a5b6c",
                "type": "ORDER_SHIPPED",
                "title": "Your order has been shipped",
                "brief": "Order #1042 is on its way",
                "message": "Great news! Your order #1042 has been shipped and is on its way to you. Expected delivery in 2–3 business days.",
                "payload": {
                    "orderId": "1042",
                    "trackingNumber": "TRK9876543210"
                },
                "priority": "HIGH",
                "isRead": false,
                "createdAt": "2026-04-15T10:30:00.000Z",
                "updatedAt": "2026-04-15T10:30:00.000Z",
                "customer": {
                    "uuid": "6c90d8ef-7f9f-4dcb-8db3-9769fa771ae7",
                    "fullName": "Your Name",
                    "emailAddress": "your-name@your-domain.com",
                    "phoneNumber": "+974 12345678"
                }
            },
            {
                "uuid": "b7d2f3e5-1c98-4e23-cd45-2g3f4e5b6c7d",
                "type": "PRICE_DROP",
                "title": "Price drop on an item you liked",
                "brief": "iPhone 25 is now cheaper",
                "message": "The iPhone 25 you viewed recently has dropped in price. Grab it before it sells out!",
                "payload": {
                    "productSlug": "iphone-25",
                    "oldPrice": 79900,
                    "newPrice": 69900,
                    "currency": "qar"
                },
                "priority": "MEDIUM",
                "isRead": true,
                "createdAt": "2026-04-14T08:00:00.000Z",
                "updatedAt": "2026-04-14T09:15:00.000Z",
                "customer": {
                    "uuid": "6c90d8ef-7f9f-4dcb-8db3-9769fa771ae7",
                    "fullName": "Your Name",
                    "emailAddress": "your-name@your-domain.com",
                    "phoneNumber": "+974 12345678"
                }
            }
        ]
    }
}
```

Get Current Affiliate
---------------------

### GraphQL Query

```graphql
query GetCurrentAffiliate {
    getCurrentAffiliate {
        uuid
        fullName
        gender
        nationality
        bio
        type
        status
        status
        totalCommission {
            amount
            currencyCode
        }
        totalPaid {
            amount
            currencyCode
        }
        remainingBalance {
            amount
            currencyCode
        }
        couponsCreated
        couponsUsed
        trendingCoupon {
            uuid
        }
        topProduct {
            uuid
        }
        wallet {
            uuid
            amount {
                amount
                currencyCode
            }
        }
        createdAt
    }
}
```

### Response Body

If the current customer is not an affiliate, this method should return null.

#### Failed Response

```json
{
    "data": {
        "getCurrentAffiliate": null
    }
}
```

#### Successful Response

```json
{
    "data": {
        "getCurrentAffiliate": {
            "uuid": "650c2dab-3347-4223-95be-ed322f915c53",
            "fullName": "Amin Ullah",
            "gender": "Male",
            "nationality": "Saudi",
            "bio": "I am a Saudi",
            "type": "affiliate",
            "status": "rejected",
            "totalCommission": {
                "amount": 0,
                "currencyCode": "QAR"
            },
            "totalPaid": {
                "amount": 0,
                "currencyCode": "QAR"
            },
            "remainingBalance": {
                "amount": 0,
                "currencyCode": "QAR"
            },
            "couponsCreated": 18,
            "couponsUsed": 0,
            "trendingCoupon": {
                "uuid": "32c60164-f17f-4a79-8388-2133e5a4f5e9"
            },
            "topProduct": {
                "uuid": "c6be4c62-4047-475d-8908-b984d3ac100f"
            },
            "wallet": {
                "uuid": "c807c0a1-152d-4348-a7b1-b2320eabf9fc",
                "amount": {
                    "amount": 200,
                    "currencyCode": "QAR"
                }
            },
            "createdAt": "2026-04-14T06:44:14.229Z"
        }
    }
}
```

Get Current Affiliate Wallet Transactions
-----------------------------------------

### GraphQL Query

```graphql
query GetCurrentAffiliateWalletTransactions($pageNumber: Int, $itemsPerPage: Int) {
    getCurrentAffiliateWalletTransactions(pageNumber: $pageNumber, itemsPerPage: $itemsPerPage) {
        uuid
        amount {
            amount
            currencyCode
        }
        type
        description
        createdAt
    }
}
```

### Response Body

```json
{
    "data": {
        "getCurrentAffiliateWalletTransactions": [
            {
                "uuid": "804f8446-cb10-4997-bfac-d7e0487aba93",
                "amount": {
                    "amount": 100,
                    "currencyCode": "QAR"
                },
                "type": "credit",
                "description": "Your commission for the month of July",
                "createdAt": "2026-04-14T06:52:21.998Z"
            },
            {
                "uuid": "34995443-d0ff-4c94-b7ee-975850a85a00",
                "amount": {
                    "amount": 100,
                    "currencyCode": "QAR"
                },
                "type": "debit",
                "description": "Reversed transaction # 804f8446-cb10-4997-bfac-d7e0487aba93",
                "createdAt": "2026-04-14T06:53:49.184Z"
            },
            {
                "uuid": "505f3585-fe14-4d1b-b12d-85c9f822f8ee",
                "amount": {
                    "amount": 100,
                    "currencyCode": "QAR"
                },
                "type": "credit",
                "description": "Your commission for the month of July",
                "createdAt": "2026-04-14T09:59:12.921Z"
            },
            {
                "uuid": "e883c151-de96-4ba3-b294-24db6e75661d",
                "amount": {
                    "amount": 100,
                    "currencyCode": "QAR"
                },
                "type": "credit",
                "description": "Your commission for the month of July",
                "createdAt": "2026-04-15T06:51:51.011Z"
            },
            {
                "uuid": "32a41b95-25dd-4024-beea-5858633d034a",
                "amount": {
                    "amount": 100,
                    "currencyCode": "QAR"
                },
                "type": "credit",
                "description": "Your commission for the month of July",
                "createdAt": "2026-04-15T10:24:10.783Z"
            },
            {
                "uuid": "72b2d69c-aa4b-44ff-b61e-920c7947e909",
                "amount": {
                    "amount": 100,
                    "currencyCode": "QAR"
                },
                "type": "debit",
                "description": "Reversed transaction # 804f8446-cb10-4997-bfac-d7e0487aba93",
                "createdAt": "2026-04-15T10:27:03.400Z"
            }
        ]
    }
}
```

Get Current Affiliate Bank Accounts
-----------------------------------

### GraphQL Query

```graphql
query GetCurrentAffiliateBankAccounts($pageNumber: Int, $itemsPerPage: Int) {
    getCurrentAffiliateBankAccounts(pageNumber: $pageNumber, itemsPerPage: $itemsPerPage) {
        uuid
        bankName
        accountHolderName
        accountNumber
        iban
        swiftCode
        isDefault
    }
}
```

### Response Body

```json
{
    "data": {
        "getCurrentAffiliateBankAccounts": [
            {
                "uuid": "15aca348-0ef6-49ca-85ac-6917ffaef677",
                "bankName": "Habib Bank Limited",
                "accountHolderName": "James Cann",
                "accountNumber": "1993 9899 3948 3948 12392",
                "iban": "PKHBLL199398993948394812394",
                "swiftCode": "PKHBLL1",
                "isDefault": false
            },
            {
                "uuid": "61b690d6-de05-497d-bef9-ca2be1b75476",
                "bankName": "Habib Bank Limited",
                "accountHolderName": "James Cann",
                "accountNumber": "1993 9899 3948 3948 12394",
                "iban": "PKHBLL199398993948394812394",
                "swiftCode": "PKHBLL1",
                "isDefault": false
            },
            {
                "uuid": "cc1f48c9-4d77-4422-be4d-d26e92c76cbc",
                "bankName": "Habib Bank Limited",
                "accountHolderName": "James Cann",
                "accountNumber": "1993 9899 3948 3948 12394",
                "iban": "PKHBLL199398993948394812394",
                "swiftCode": "PKHBLL1",
                "isDefault": true
            }
        ]
    }
}
```

Get Current Affiliate Coupons
-----------------------------

### GraphQL Query

```graphql
query GetCurrentAffiliateCoupons($pageNumber: Int, $itemsPerPage: Int) {
    getCurrentAffiliateCoupons(pageNumber: $pageNumber, itemsPerPage: $itemsPerPage) {
        uuid
        code
        discountPercentage
        ordersCount
        expiresAt
        createdAt
    }
}
```

### Response

```json
{
    "data": {
        "getCurrentAffiliateCoupons": [
            {
                "uuid": "32c60164-f17f-4a79-8388-2133e5a4f5e9",
                "code": "amin12",
                "discountPercentage": 4,
                "ordersCount": 0,
                "expiresAt": "2026-12-31T00:00:00.000Z",
                "createdAt": "2026-04-15T10:07:07.504Z"
            }
        ]
    }
}
```

Get Current Customer Orders
-----------------------------

### GraphQL Query

```graphql
query GetCurrentCustomerOrders($pageNumber: Int, $itemsPerPage: Int) {
    getCurrentCustomerOrders(pageNumber: $pageNumber, itemsPerPage: $itemsPerPage) {
        uuid
        status
        subTotal {
            amount
            currencyCode
        }
        shippingCost {
            amount
            currencyCode
        }
        discount {
            amount
            currencyCode
        }
        total {
            amount
            currencyCode
        }
        eta
        orderItems {
            uuid
            price {
                amount
                currencyCode
            }
            quantity
            total {
                amount
                currencyCode
            }
            product {
                uuid
                slug
                title
                brief
                description
                descriptionHtml
                status
            }
            variant {
                uuid
                title
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
            }
        }
    }
}
```

### Response

```json
{
    "data": {
        "getCurrentCustomerOrders": [
            {
                "uuid": "0a791d05-f5cb-4005-aa63-7ba68a8c06b9",
                "status": "payment_pending",
                "subTotal": {
                    "amount": 688,
                    "currencyCode": "USD"
                },
                "shippingCost": {
                    "amount": 0,
                    "currencyCode": "USD"
                },
                "discount": {
                    "amount": 0,
                    "currencyCode": "USD"
                },
                "total": {
                    "amount": 688,
                    "currencyCode": "USD"
                },
                "eta": "6-10 working days",
                "orderItems": [
                    {
                        "uuid": "acd18a70-693a-4167-b813-5d5a925786de",
                        "price": {
                            "amount": 688,
                            "currencyCode": "USD"
                        },
                        "quantity": 1,
                        "total": {
                            "amount": 688,
                            "currencyCode": "USD"
                        },
                        "product": {
                            "uuid": "660e5d31-24e8-42e2-b8d7-1c45118ef29a",
                            "slug": "iphone-17",
                            "title": "iPhone 17",
                            "brief": "From $799 or $33.29/mo. per month for 24 months",
                            "description": "Your new iPhone awaits. Make it yours.",
                            "descriptionHtml": "<b>Your new iPhone awaits. Make it yours</b>",
                            "status": "DRAFT",
                        },
                        "variant": {
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
                            }
                        }
                    }
                ]
            }
        ]
    }
}
```

Get Current Customer Order
-----------------------------

### GraphQL Query

```graphql
query GetCurrentCustomerOrder($uuid: string) {
    getCurrentCustomerOrder(uuid: $uuid) {
        uuid
        status
        subTotal {
            amount
            currencyCode
        }
        shippingCost {
            amount
            currencyCode
        }
        discount {
            amount
            currencyCode
        }
        total {
            amount
            currencyCode
        }
        eta
        orderItems {
            uuid
            price {
                amount
                currencyCode
            }
            quantity
            total {
                amount
                currencyCode
            }
            product {
                uuid
                slug
                title
                brief
                description
                descriptionHtml
                status
            }
            variant {
                uuid
                title
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
            }
        }
    }
}
```

### Response

```json
{
    "data": {
        "getCurrentCustomerOrders":{
            "uuid": "0a791d05-f5cb-4005-aa63-7ba68a8c06b9",
            "status": "payment_pending",
            "subTotal": {
                "amount": 688,
                "currencyCode": "USD"
            },
            "shippingCost": {
                "amount": 0,
                "currencyCode": "USD"
            },
            "discount": {
                "amount": 0,
                "currencyCode": "USD"
            },
            "total": {
                "amount": 688,
                "currencyCode": "USD"
            },
            "eta": "6-10 working days",
            "orderItems": [
                {
                    "uuid": "acd18a70-693a-4167-b813-5d5a925786de",
                    "price": {
                        "amount": 688,
                        "currencyCode": "USD"
                    },
                    "quantity": 1,
                    "total": {
                        "amount": 688,
                        "currencyCode": "USD"
                    },
                    "product": {
                        "uuid": "660e5d31-24e8-42e2-b8d7-1c45118ef29a",
                        "slug": "iphone-17",
                        "title": "iPhone 17",
                        "brief": "From $799 or $33.29/mo. per month for 24 months",
                        "description": "Your new iPhone awaits. Make it yours.",
                        "descriptionHtml": "<b>Your new iPhone awaits. Make it yours</b>",
                        "status": "DRAFT",
                    },
                    "variant": {
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
                        }
                    }
                }
            ]
        }
    }
}
```

Get Current Customer WishList
-----------------------------

### GraphQL Query

```graphql
query GetCustomerWishlist($language: String) {
    getCustomerWishlist(language: $language) {
        uuid
        product {
            uuid
            slug
            title(language: $language)
            brief(language: $language)
            description(language: $language)
            descriptionHtml(language: $language)
            status
        }
    }
}
```
### GraphQL Variables

```json
{
    "language": "en",
}
```

### Response

```json
{
    "data": {
        "getCustomerWishlist": {
            "uuid": "f0fdab43-b693-4762-a997-cc9d3817ba85",
            "product": {
                "uuid": "a383097d-1555-4c85-a388-84eb864225c4",
                "slug": "cross-border-variable-speed-bicycle-foldableable-aluminum-alloy",
                "title": "Cross-Border Variable Speed Bicycle Foldableable Aluminum Alloy Lightweight Commuter Foldableing Bicycle 20inch Bicycle",
                "brief": "",
                "description": "",
                "descriptionHtml": "",
                "status": "ACTIVE"
            }
        }
    }
}
```

Get Current Customer WishList Count
-------------------------------------

### GraphQL Query

```graphql
query GetCustomerWishlistCount {
    getCustomerWishlistCount
}
```

### Response

```json
{
    "data": {
        "getCustomerWishlistCount": 1
    }
}
```

Get Cart
---------

### GraphQL Query

```graphql
query GetCart {
    getCart {
        items {
            uuid
            product {
                uuid
                slug
                title
                brief
                description
                descriptionHtml
                status
            }
            variant {
                uuid
                title
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
            }
            quantity
            subTotal {
                amount
                currencyCode
            }
        }
        count
    }
}
```

### Response

```json
{
    "data": {
        "getCart": {
            "items": [
                {
                    "uuid": "3fe6f35d-f6be-4c93-81f6-36372de8ee76",
                    "product": {
                        "uuid": "a383097d-1555-4c85-a388-84eb864225c4",
                        "slug": "cross-border-variable-speed-bicycle-foldableable-aluminum-alloy",
                        "title": "Cross-Border Variable Speed Bicycle Foldableable Aluminum Alloy Lightweight Commuter Foldableing Bicycle 20inch Bicycle",
                        "brief": "",
                        "description": "Get you bike",
                        "descriptionHtml": "",
                        "status": "ACTIVE"
                    },
                    "variant": {
                        "uuid": "ed0286b4-3eb8-4a84-971a-fb49fd6bcfd1",
                        "title": "Technology gray [aluminum alloy spoke wheel] 20inch [price for each of 5 to 19 vehicles]",
                        "sku": "5627530595058",
                        "barcode": "5627530595058",
                        "price": {
                            "amount": 688,
                            "currencyCode": "USD"
                        },
                        "weight": {
                            "amount": 16,
                            "unit": "kg"
                        },
                        "dimensions": {
                            "width": 36,
                            "height": 57,
                            "length": 88,
                            "unit": "cm"
                        }
                    },
                    "quantity": 1,
                    "subTotal": {
                        "amount": 688,
                        "currencyCode": "USD"
                    }
                }
            ],
            "count": 1
        }
    }
}
```
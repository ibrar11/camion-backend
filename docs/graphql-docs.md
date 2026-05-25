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
- CMS Pages

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
- Get CMS Pages
- Get CMS Page
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
- Get Coupons Orders
- Get Current Customer Orders
- Get Promos

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
    unreadNotificationCount
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
            "phoneNumber": "+974 12345678",
            "unreadNotificationCount": 5
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
    color
    isActive
  }
}
```

### GraphQL Variables

```json
{
    "language": "en",
    "pageNumber": 1,
    "itemsPerPage": 24
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
                "color": "#000000",
                "isActive": true
            },
            {
                "uuid": "2d051593-91d1-41bb-b955-35211715599f",
                "title": "",
                "imageUrl": "https://camion.s3.us-east-1.amazonaws.com/1e7930fb-e6aa-482a-a2bb-9403b4ee1d35.jpg",
                "linkUrl": "",
                "placement": "",
                "color": "#000000",
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
    "itemsPerPage": 24
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
    featuredImageUrl
    featuredThumbnailUrl
    salesCount
    likesCount
    reviewsCount
    ratingAvg
    variants {
      uuid
      title(language: $language)
      sku
      price(currency: $currency) {
        amount
        currencyCode
      }
      discountedPrice(currency: $currency) {
        amount
        currencyCode
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
    "query": "iphone",
    "language":"en",
    "currency": "qar",
    "sort": "best-match",
    "pageNumber": 1,
    "itemsPerPage": 10
}
```

### Response Body

```json
{
    "data": {
        "searchProducts": [
            {
                "uuid": "28da9466-2e8d-4b09-b6bc-fa429484f9c6",
                "slug": "iphone-22",
                "title": "iPhone 22",
                "brief": "From $799 or $33.29/mo. per month for 24 months",
                "description": "Your new iPhone awaits. Make it yours.",
                "descriptionHtml": "<b>Your new iPhone awaits. Make it yours</b>",
                "featuredImageUrl": "https://assets.dev.camiontrading.com/product-images/a5e23a38-d42c-4340-b601-51788510e52e.jpg",
                "featuredThumbnailUrl": "https://assets.dev.camiontrading.com/product-images/a5e23a38-d42c-4340-b601-51788510e52e.jpg",
                "salesCount": 0,
                "likesCount": 0,
                "reviewsCount": 1,
                "ratingAvg": 5,
                "variants": [
                    {
                        "uuid": "27da54da-8ef9-424f-9c62-ba11f4f924fd",
                        "title": "iPhone 20 RED 1 TB",
                        "sku": "iphone-20-red-1tb",
                        "price": {
                            "amount": 7500,
                            "currencyCode": "qar"
                        },
                        "discountedPrice": {
                            "amount": 6750,
                            "currencyCode": "qar"
                        },
                        "images": [
                            {
                                "uuid": "e23e83b6-48b9-436b-84c1-617a9bc5a60e",
                                "imageUrl": "https://assets.dev.camiontrading.com/product-images/a5e23a38-d42c-4340-b601-51788510e52e.jpg",
                                "thumbnailUrl": "https://assets.dev.camiontrading.com/product-images/a5e23a38-d42c-4340-b601-51788510e52e.jpg",
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

Search Products (Price: Low-to-high)
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
    featuredImageUrl
    featuredThumbnailUrl
    salesCount
    likesCount
    reviewsCount
    ratingAvg
    variants {
      uuid
      title(language: $language)
      sku
      price(currency: $currency) {
        amount
        currencyCode
      }
      discountedPrice(currency: $currency) {
        amount
        currencyCode
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
    "query": "iphone",
    "language": "en",
    "currency": "qar",
    "sort": "price:low-to-high",
    "pageNumber": 1,
    "itemsPerPage": 24
}
```

### Response Body

```json
{
    "data": {
        "searchProducts": [
            {
                "uuid": "28da9466-2e8d-4b09-b6bc-fa429484f9c6",
                "slug": "iphone-22",
                "title": "iPhone 22",
                "brief": "From $799 or $33.29/mo. per month for 24 months",
                "description": "Your new iPhone awaits. Make it yours.",
                "descriptionHtml": "<b>Your new iPhone awaits. Make it yours</b>",
                "featuredImageUrl": "https://assets.dev.camiontrading.com/product-images/a5e23a38-d42c-4340-b601-51788510e52e.jpg",
                "featuredThumbnailUrl": "https://assets.dev.camiontrading.com/product-images/a5e23a38-d42c-4340-b601-51788510e52e.jpg",
                "salesCount": 0,
                "likesCount": 0,
                "reviewsCount": 1,
                "ratingAvg": 5,
                "variants": [
                    {
                        "uuid": "27da54da-8ef9-424f-9c62-ba11f4f924fd",
                        "title": "iPhone 20 RED 1 TB",
                        "sku": "iphone-20-red-1tb",
                        "price": {
                            "amount": 7500,
                            "currencyCode": "qar"
                        },
                        "discountedPrice": {
                            "amount": 6750,
                            "currencyCode": "qar"
                        },
                        "images": [
                            {
                                "uuid": "e23e83b6-48b9-436b-84c1-617a9bc5a60e",
                                "imageUrl": "https://assets.dev.camiontrading.com/product-images/a5e23a38-d42c-4340-b601-51788510e52e.jpg",
                                "thumbnailUrl": "https://assets.dev.camiontrading.com/product-images/a5e23a38-d42c-4340-b601-51788510e52e.jpg",
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
    featuredImageUrl
    featuredThumbnailUrl
    salesCount
    likesCount
    reviewsCount
    ratingAvg
    variants {
      uuid
      title(language: $language)
      sku
      price(currency: $currency) {
        amount
        currencyCode
      }
      discountedPrice(currency: $currency) {
        amount
        currencyCode
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
    "query": "iphone",
    "language":"en",
    "currency": "qar",
    "sort": "price:high-to-low",
    "pageNumber": 1,
    "itemsPerPage": 24
}
```

### Response Body

```json
{
    "data": {
        "searchProducts": [
            {
                "uuid": "28da9466-2e8d-4b09-b6bc-fa429484f9c6",
                "slug": "iphone-22",
                "title": "iPhone 22",
                "brief": "From $799 or $33.29/mo. per month for 24 months",
                "description": "Your new iPhone awaits. Make it yours.",
                "descriptionHtml": "<b>Your new iPhone awaits. Make it yours</b>",
                "featuredImageUrl": "https://assets.dev.camiontrading.com/product-images/a5e23a38-d42c-4340-b601-51788510e52e.jpg",
                "featuredThumbnailUrl": "https://assets.dev.camiontrading.com/product-images/a5e23a38-d42c-4340-b601-51788510e52e.jpg",
                "salesCount": 0,
                "likesCount": 0,
                "reviewsCount": 1,
                "ratingAvg": 5,
                "variants": [
                    {
                        "uuid": "27da54da-8ef9-424f-9c62-ba11f4f924fd",
                        "title": "iPhone 20 RED 1 TB",
                        "sku": "iphone-20-red-1tb",
                        "price": {
                            "amount": 7500,
                            "currencyCode": "qar"
                        },
                        "discountedPrice": {
                            "amount": 6750,
                            "currencyCode": "qar"
                        },
                        "images": [
                            {
                                "uuid": "e23e83b6-48b9-436b-84c1-617a9bc5a60e",
                                "imageUrl": "https://assets.dev.camiontrading.com/product-images/a5e23a38-d42c-4340-b601-51788510e52e.jpg",
                                "thumbnailUrl": "https://assets.dev.camiontrading.com/product-images/a5e23a38-d42c-4340-b601-51788510e52e.jpg",
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
    featuredImageUrl
    featuredThumbnailUrl
    salesCount
    likesCount
    reviewsCount
    ratingAvg
    variants {
      uuid
      title(language: $language)
      sku
      price(currency: $currency) {
        amount
        currencyCode
      }
      discountedPrice(currency: $currency) {
        amount
        currencyCode
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
    "slug": "iphone-22",
    "language":"en",
    "currency": "qar",
    "pageNumber": 1,
    "itemsPerPage": 24
}
```

### Response Body

```json
{
    "data": {
        "getRecommendedProducts": [
            {
                "uuid": "28da9466-2e8d-4b09-b6bc-fa429484f9c6",
                "slug": "iphone-22",
                "title": "iPhone 22",
                "brief": "From $799 or $33.29/mo. per month for 24 months",
                "description": "Your new iPhone awaits. Make it yours.",
                "descriptionHtml": "<b>Your new iPhone awaits. Make it yours</b>",
                "featuredImageUrl": "https://assets.dev.camiontrading.com/product-images/a5e23a38-d42c-4340-b601-51788510e52e.jpg",
                "featuredThumbnailUrl": "https://assets.dev.camiontrading.com/product-images/a5e23a38-d42c-4340-b601-51788510e52e.jpg",
                "salesCount": 0,
                "likesCount": 0,
                "reviewsCount": 1,
                "ratingAvg": 5,
                "variants": [
                    {
                        "uuid": "27da54da-8ef9-424f-9c62-ba11f4f924fd",
                        "title": "iPhone 20 RED 1 TB",
                        "sku": "iphone-20-red-1tb",
                        "price": {
                            "amount": 7500,
                            "currencyCode": "qar"
                        },
                        "discountedPrice": {
                            "amount": 6750,
                            "currencyCode": "qar"
                        },
                        "images": [
                            {
                                "uuid": "e23e83b6-48b9-436b-84c1-617a9bc5a60e",
                                "imageUrl": "https://assets.dev.camiontrading.com/product-images/a5e23a38-d42c-4340-b601-51788510e52e.jpg",
                                "thumbnailUrl": "https://assets.dev.camiontrading.com/product-images/a5e23a38-d42c-4340-b601-51788510e52e.jpg",
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
    featuredImageUrl
    featuredThumbnailUrl
    salesCount
    likesCount
    reviewsCount
    ratingAvg
    variants {
      uuid
      title(language: $language)
      sku
      price(currency: $currency) {
        amount
        currencyCode
      }
      discountedPrice(currency: $currency) {
        amount
        currencyCode
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
    "itemsPerPage": 2
}
```

### Response Body

```json
{
    "data": {
        "getFeaturedProducts": [
            {
                "uuid": "28da9466-2e8d-4b09-b6bc-fa429484f9c6",
                "slug": "iphone-22",
                "title": "iPhone 22",
                "brief": "From $799 or $33.29/mo. per month for 24 months",
                "description": "Your new iPhone awaits. Make it yours.",
                "descriptionHtml": "<b>Your new iPhone awaits. Make it yours</b>",
                "featuredImageUrl": "https://assets.dev.camiontrading.com/product-images/a5e23a38-d42c-4340-b601-51788510e52e.jpg",
                "featuredThumbnailUrl": "https://assets.dev.camiontrading.com/product-images/a5e23a38-d42c-4340-b601-51788510e52e.jpg",
                "salesCount": 0,
                "likesCount": 0,
                "reviewsCount": 1,
                "ratingAvg": 5,
                "variants": [
                    {
                        "uuid": "27da54da-8ef9-424f-9c62-ba11f4f924fd",
                        "title": "iPhone 20 RED 1 TB",
                        "sku": "iphone-20-red-1tb",
                        "price": {
                            "amount": 7500,
                            "currencyCode": "qar"
                        },
                        "discountedPrice": {
                            "amount": 6750,
                            "currencyCode": "qar"
                        },
                        "images": [
                            {
                                "uuid": "e23e83b6-48b9-436b-84c1-617a9bc5a60e",
                                "imageUrl": "https://assets.dev.camiontrading.com/product-images/a5e23a38-d42c-4340-b601-51788510e52e.jpg",
                                "thumbnailUrl": "https://assets.dev.camiontrading.com/product-images/a5e23a38-d42c-4340-b601-51788510e52e.jpg",
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
    featuredImageUrl
    featuredThumbnailUrl
    salesCount
    likesCount
    reviewsCount
    ratingAvg
    variants {
      uuid
      title(language: $language)
      sku
      price(currency: $currency) {
        amount
        currencyCode
      }
      discountedPrice(currency: $currency) {
        amount
        currencyCode
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
    "itemsPerPage": 10
}
```

### Response Body

```json
{
    "data": {
        "getPopularProducts": [
            {
                "uuid": "28da9466-2e8d-4b09-b6bc-fa429484f9c6",
                "slug": "iphone-22",
                "title": "iPhone 22",
                "brief": "From $799 or $33.29/mo. per month for 24 months",
                "description": "Your new iPhone awaits. Make it yours.",
                "descriptionHtml": "<b>Your new iPhone awaits. Make it yours</b>",
                "featuredImageUrl": "https://assets.dev.camiontrading.com/product-images/a5e23a38-d42c-4340-b601-51788510e52e.jpg",
                "featuredThumbnailUrl": "https://assets.dev.camiontrading.com/product-images/a5e23a38-d42c-4340-b601-51788510e52e.jpg",
                "salesCount": 0,
                "likesCount": 0,
                "reviewsCount": 1,
                "ratingAvg": 5,
                "variants": [
                    {
                        "uuid": "27da54da-8ef9-424f-9c62-ba11f4f924fd",
                        "title": "iPhone 20 RED 1 TB",
                        "sku": "iphone-20-red-1tb",
                        "price": {
                            "amount": 7500,
                            "currencyCode": "qar"
                        },
                        "discountedPrice": {
                            "amount": 6750,
                            "currencyCode": "qar"
                        },
                        "images": [
                            {
                                "uuid": "e23e83b6-48b9-436b-84c1-617a9bc5a60e",
                                "imageUrl": "https://assets.dev.camiontrading.com/product-images/a5e23a38-d42c-4340-b601-51788510e52e.jpg",
                                "thumbnailUrl": "https://assets.dev.camiontrading.com/product-images/a5e23a38-d42c-4340-b601-51788510e52e.jpg",
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
    featuredImageUrl
    featuredThumbnailUrl
    salesCount
    likesCount
    reviewsCount
    ratingAvg
    variants {
      uuid
      title(language: $language)
      sku
      price(currency: $currency) {
        amount
        currencyCode
      }
      discountedPrice(currency: $currency) {
        amount
        currencyCode
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
    "slug": "iphone-22",
    "language":"en",
    "currency": "qar",
    "pageNumber": 1,
    "itemsPerPage": 24
}
```

### Response Body

```json
{
    "data": {
        "getRelatedProducts": [
            {
                "uuid": "28da9466-2e8d-4b09-b6bc-fa429484f9c6",
                "slug": "iphone-22",
                "title": "iPhone 22",
                "brief": "From $799 or $33.29/mo. per month for 24 months",
                "description": "Your new iPhone awaits. Make it yours.",
                "descriptionHtml": "<b>Your new iPhone awaits. Make it yours</b>",
                "featuredImageUrl": "https://assets.dev.camiontrading.com/product-images/a5e23a38-d42c-4340-b601-51788510e52e.jpg",
                "featuredThumbnailUrl": "https://assets.dev.camiontrading.com/product-images/a5e23a38-d42c-4340-b601-51788510e52e.jpg",
                "salesCount": 0,
                "likesCount": 0,
                "reviewsCount": 1,
                "ratingAvg": 5,
                "variants": [
                    {
                        "uuid": "27da54da-8ef9-424f-9c62-ba11f4f924fd",
                        "title": "iPhone 20 RED 1 TB",
                        "sku": "iphone-20-red-1tb",
                        "price": {
                            "amount": 7500,
                            "currencyCode": "qar"
                        },
                        "discountedPrice": {
                            "amount": 6750,
                            "currencyCode": "qar"
                        },
                        "images": [
                            {
                                "uuid": "e23e83b6-48b9-436b-84c1-617a9bc5a60e",
                                "imageUrl": "https://assets.dev.camiontrading.com/product-images/a5e23a38-d42c-4340-b601-51788510e52e.jpg",
                                "thumbnailUrl": "https://assets.dev.camiontrading.com/product-images/a5e23a38-d42c-4340-b601-51788510e52e.jpg",
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
    featuredImageUrl
    featuredThumbnailUrl
    salesCount
    likesCount
    reviewsCount
    ratingAvg
    variants {
      uuid
      title(language: $language)
      sku
      price(currency: $currency) {
        amount
        currencyCode
      }
      discountedPrice(currency: $currency) {
        amount
        currencyCode
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
    "itemsPerPage": 24
}
```

### Response Body

```json
{
    "data": {
        "getRecentlyViewedProducts": [
            {
                "uuid": "28da9466-2e8d-4b09-b6bc-fa429484f9c6",
                "slug": "iphone-22",
                "title": "iPhone 22",
                "brief": "From $799 or $33.29/mo. per month for 24 months",
                "description": "Your new iPhone awaits. Make it yours.",
                "descriptionHtml": "<b>Your new iPhone awaits. Make it yours</b>",
                "featuredImageUrl": "https://assets.dev.camiontrading.com/product-images/a5e23a38-d42c-4340-b601-51788510e52e.jpg",
                "featuredThumbnailUrl": "https://assets.dev.camiontrading.com/product-images/a5e23a38-d42c-4340-b601-51788510e52e.jpg",
                "salesCount": 0,
                "likesCount": 0,
                "reviewsCount": 1,
                "ratingAvg": 5,
                "variants": [
                    {
                        "uuid": "27da54da-8ef9-424f-9c62-ba11f4f924fd",
                        "title": "iPhone 20 RED 1 TB",
                        "sku": "iphone-20-red-1tb",
                        "price": {
                            "amount": 7500,
                            "currencyCode": "qar"
                        },
                        "discountedPrice": {
                            "amount": 6750,
                            "currencyCode": "qar"
                        },
                        "images": [
                            {
                                "uuid": "e23e83b6-48b9-436b-84c1-617a9bc5a60e",
                                "imageUrl": "https://assets.dev.camiontrading.com/product-images/a5e23a38-d42c-4340-b601-51788510e52e.jpg",
                                "thumbnailUrl": "https://assets.dev.camiontrading.com/product-images/a5e23a38-d42c-4340-b601-51788510e52e.jpg",
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
    featuredImageUrl
    featuredThumbnailUrl
    salesCount
    likesCount
    reviewsCount
    ratingAvg
    variants {
      uuid
      title(language: $language)
      sku
      price(currency: $currency) {
        amount
        currencyCode
      }
      discountedPrice(currency: $currency) {
        amount
        currencyCode
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
    "itemsPerPage": 1
}
```

### Response Body

```json
{
    "data": {
        "getProducts": [
            {
                "uuid": "28da9466-2e8d-4b09-b6bc-fa429484f9c6",
                "slug": "iphone-22",
                "title": "iPhone 22",
                "brief": "From $799 or $33.29/mo. per month for 24 months",
                "description": "Your new iPhone awaits. Make it yours.",
                "descriptionHtml": "<b>Your new iPhone awaits. Make it yours</b>",
                "featuredImageUrl": "https://assets.dev.camiontrading.com/product-images/a5e23a38-d42c-4340-b601-51788510e52e.jpg",
                "featuredThumbnailUrl": "https://assets.dev.camiontrading.com/product-images/a5e23a38-d42c-4340-b601-51788510e52e.jpg",
                "salesCount": 0,
                "likesCount": 0,
                "reviewsCount": 1,
                "ratingAvg": 5,
                "variants": [
                    {
                        "uuid": "27da54da-8ef9-424f-9c62-ba11f4f924fd",
                        "title": "iPhone 20 RED 1 TB",
                        "sku": "iphone-20-red-1tb",
                        "price": {
                            "amount": 7500,
                            "currencyCode": "qar"
                        },
                        "discountedPrice": {
                            "amount": 6750,
                            "currencyCode": "qar"
                        },
                        "images": [
                            {
                                "uuid": "e23e83b6-48b9-436b-84c1-617a9bc5a60e",
                                "imageUrl": "https://assets.dev.camiontrading.com/product-images/a5e23a38-d42c-4340-b601-51788510e52e.jpg",
                                "thumbnailUrl": "https://assets.dev.camiontrading.com/product-images/a5e23a38-d42c-4340-b601-51788510e52e.jpg",
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
    salesCount
    likesCount
    reviewsCount
    ratingAvg
    variants {
      uuid
      title(language: $language)
      sku
      price(currency: $currency) {
        amount
        currencyCode
      }
      discountedPrice(currency: $currency) {
        amount
        currencyCode
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
    "itemsPerPage": 24
}
```

### Response Body

```json
{
    "data": {
        "getProductsByCategory": [
            {
                "uuid": "28da9466-2e8d-4b09-b6bc-fa429484f9c6",
                "slug": "iphone-22",
                "title": "iPhone 22",
                "brief": "From $799 or $33.29/mo. per month for 24 months",
                "description": "Your new iPhone awaits. Make it yours.",
                "descriptionHtml": "<b>Your new iPhone awaits. Make it yours</b>",
                "featuredImageUrl": "https://assets.dev.camiontrading.com/product-images/a5e23a38-d42c-4340-b601-51788510e52e.jpg",
                "featuredThumbnailUrl": "https://assets.dev.camiontrading.com/product-images/a5e23a38-d42c-4340-b601-51788510e52e.jpg",
                "salesCount": 0,
                "likesCount": 0,
                "reviewsCount": 1,
                "ratingAvg": 5,
                "variants": [
                    {
                        "uuid": "27da54da-8ef9-424f-9c62-ba11f4f924fd",
                        "title": "iPhone 20 RED 1 TB",
                        "sku": "iphone-20-red-1tb",
                        "price": {
                            "amount": 7500,
                            "currencyCode": "qar"
                        },
                        "discountedPrice": {
                            "amount": 7500,
                            "currencyCode": "qar"
                        },
                        "images": [
                            {
                                "uuid": "e23e83b6-48b9-436b-84c1-617a9bc5a60e",
                                "imageUrl": "https://assets.dev.camiontrading.com/product-images/a5e23a38-d42c-4340-b601-51788510e52e.jpg",
                                "thumbnailUrl": "https://assets.dev.camiontrading.com/product-images/a5e23a38-d42c-4340-b601-51788510e52e.jpg",
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
    featuredImageUrl
    featuredThumbnailUrl
    status
    salesCount
    likesCount
    reviewsCount
    ratingAvg
    ratingOneStarCount
    ratingTwoStarCount
    ratingThreeStarCount
    ratingFourStarCount
    ratingFiveStarCount
    productCategories {
        category {
            uuid
            slug
            name(language: $language)
        }
    }
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
      price(currency: $currency) {
        amount
        currencyCode
      }
      discountedPrice(currency: $currency) {
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
    "slug": "iphone-22",
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
            "uuid": "28da9466-2e8d-4b09-b6bc-fa429484f9c6",
            "slug": "iphone-22",
            "title": "iPhone 22",
            "brief": "From $799 or $33.29/mo. per month for 24 months",
            "description": "Your new iPhone awaits. Make it yours.",
            "descriptionHtml": "<b>Your new iPhone awaits. Make it yours</b>",
            "featuredImageUrl": "https://assets.dev.camiontrading.com/product-images/a5e23a38-d42c-4340-b601-51788510e52e.jpg",
            "featuredThumbnailUrl": "https://assets.dev.camiontrading.com/product-images/a5e23a38-d42c-4340-b601-51788510e52e.jpg",
            "status": "active",
            "salesCount": 0,
            "likesCount": 0,
            "reviewsCount": 1,
            "ratingAvg": 5,
            "ratingOneStarCount": 0,
            "ratingTwoStarCount": 0,
            "ratingThreeStarCount": 0,
            "ratingFourStarCount": 0,
            "ratingFiveStarCount": 0,
            "productCategories": [
                {
                    "category": {
                        "uuid": "d66ec8b3-2201-4cfc-bbdb-85274efb7bba",
                        "slug": "iphones",
                        "name": "iphones"
                    }
                },
                {
                    "category": {
                        "uuid": "70bcc216-2fc3-4dc2-bd65-642dccdd141a",
                        "slug": "iphones-two",
                        "name": "iphones"
                    }
                },
                {
                    "category": {
                        "uuid": "a095966a-95f1-4e75-88ff-572478d08ae9",
                        "slug": "iphones-three",
                        "name": "iphones"
                    }
                }
            ],
            "options": [
                {
                    "uuid": "d8dbb95c-ad90-475c-afe0-c3ac9b059542",
                    "name": "Color",
                    "position": 0,
                    "values": [
                        {
                            "uuid": "7dc2f302-9094-4130-8917-299fa8df6528",
                            "value": "Red",
                            "position": 0
                        }
                    ]
                },
                {
                    "uuid": "ea319224-05e3-4977-af3b-66ca1ca5d15c",
                    "name": "Storage",
                    "position": 1,
                    "values": [
                        {
                            "uuid": "94c267ba-aaf0-4a14-8d28-e1ed2a1d5240",
                            "value": "1 TB",
                            "position": 1
                        }
                    ]
                }
            ],
            "variants": [
                {
                    "uuid": "27da54da-8ef9-424f-9c62-ba11f4f924fd",
                    "title": "iPhone 20 RED 1 TB",
                    "sku": "iphone-20-red-1tb",
                    "barcode": "10000",
                    "price": {
                        "amount": -1,
                        "currencyCode": "qar"
                    },
                    "discountedPrice": {
                        "amount": -1,
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
                    },
                    "optionValues": [
                        {
                            "optionValue": {
                                "uuid": "7dc2f302-9094-4130-8917-299fa8df6528"
                            }
                        },
                        {
                            "optionValue": {
                                "uuid": "94c267ba-aaf0-4a14-8d28-e1ed2a1d5240"
                            }
                        }
                    ],
                    "images": [
                        {
                            "uuid": "e23e83b6-48b9-436b-84c1-617a9bc5a60e",
                            "imageUrl": "https://assets.dev.camiontrading.com/product-images/a5e23a38-d42c-4340-b601-51788510e52e.jpg",
                            "thumbnailUrl": "https://assets.dev.camiontrading.com/product-images/a5e23a38-d42c-4340-b601-51788510e52e.jpg",
                            "alt": "",
                            "isFeatured": false,
                            "position": 0
                        }
                    ]
                }
            ],
            "reviews": [
                {
                    "uuid": "337579b9-bf12-456a-89f4-d8c1e85507e7",
                    "rating": 1,
                    "comment": "This was very bad",
                    "customer": {
                        "uuid": "9c2dcd9d-ec6f-4bfe-839c-21d4f47a4051",
                        "fullName": "Your Name"
                    },
                    "images": []
                },
                {
                    "uuid": "4e6945a6-b07f-4c30-9ec2-d26ed87c37d7",
                    "rating": 1,
                    "comment": "This was very bad",
                    "customer": {
                        "uuid": "9c2dcd9d-ec6f-4bfe-839c-21d4f47a4051",
                        "fullName": "Your Name"
                    },
                    "images": []
                },
                {
                    "uuid": "e6621c3b-2c57-49f3-a037-0e4eb451669c",
                    "rating": 1,
                    "comment": "This was very bad",
                    "customer": {
                        "uuid": "9c2dcd9d-ec6f-4bfe-839c-21d4f47a4051",
                        "fullName": "Your Name"
                    },
                    "images": []
                },
                {
                    "uuid": "55f8b095-8e46-45c1-b01f-4dedf6556d31",
                    "rating": 1,
                    "comment": "This was very bad",
                    "customer": {
                        "uuid": "9c2dcd9d-ec6f-4bfe-839c-21d4f47a4051",
                        "fullName": "Your Name"
                    },
                    "images": []
                },
                {
                    "uuid": "e6b53b10-5411-40a4-bff7-f26d3c48c062",
                    "rating": 1,
                    "comment": "This was very bad",
                    "customer": {
                        "uuid": "9c2dcd9d-ec6f-4bfe-839c-21d4f47a4051",
                        "fullName": "Your Name"
                    },
                    "images": []
                },
                {
                    "uuid": "029ad3a7-5fb0-4281-9fae-147849f16167",
                    "rating": 1,
                    "comment": "This was very bad",
                    "customer": {
                        "uuid": "9c2dcd9d-ec6f-4bfe-839c-21d4f47a4051",
                        "fullName": "Your Name"
                    },
                    "images": []
                },
                {
                    "uuid": "22f6cf78-ae91-45ff-ae3b-5d2e78975466",
                    "rating": 1,
                    "comment": "This was very bad",
                    "customer": {
                        "uuid": "9c2dcd9d-ec6f-4bfe-839c-21d4f47a4051",
                        "fullName": "Your Name"
                    },
                    "images": []
                },
                {
                    "uuid": "4edf8ed8-0fa2-44fc-92d5-a3dc33a69671",
                    "rating": 1,
                    "comment": "This was very bad",
                    "customer": {
                        "uuid": "9c2dcd9d-ec6f-4bfe-839c-21d4f47a4051",
                        "fullName": "Your Name"
                    },
                    "images": []
                },
                {
                    "uuid": "1f85c097-065c-4dab-9f16-b75b5d8453c3",
                    "rating": 1,
                    "comment": "This was very bad",
                    "customer": {
                        "uuid": "9c2dcd9d-ec6f-4bfe-839c-21d4f47a4051",
                        "fullName": "Your Name"
                    },
                    "images": []
                },
                {
                    "uuid": "be21cb1a-ad7f-4b2c-a1c4-027691226575",
                    "rating": 1,
                    "comment": "This was very bad",
                    "customer": {
                        "uuid": "9c2dcd9d-ec6f-4bfe-839c-21d4f47a4051",
                        "fullName": "Your Name"
                    },
                    "images": []
                },
                {
                    "uuid": "60e2b636-ec57-486d-9a50-13a7e9a49e58",
                    "rating": 1,
                    "comment": "This was very bad",
                    "customer": {
                        "uuid": "9c2dcd9d-ec6f-4bfe-839c-21d4f47a4051",
                        "fullName": "Your Name"
                    },
                    "images": []
                },
                {
                    "uuid": "77b2744e-3675-4c8f-ac4f-954a3b8bafb6",
                    "rating": 5,
                    "comment": "This was very bad",
                    "customer": {
                        "uuid": "9c2dcd9d-ec6f-4bfe-839c-21d4f47a4051",
                        "fullName": "Your Name"
                    },
                    "images": []
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
    "itemsPerPage": 24
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

Get Featured Categories
-----------------------

### Request Body

```graphql
query GetFeaturedCategories($language: String, $pageNumber: Int, $itemsPerPage: Int) {
  getFeaturedCategories(pageNumber: $pageNumber, itemsPerPage: $itemsPerPage) {
    uuid
    slug
    name(language: $language)
    isFeatured
    thumbnailUrl
  }
}
```

### GraphQL Variables

```json
{
    "language": "en",
    "pageNumber": 1,
    "itemsPerPage": 24
}
```

### Response Body

```json
{
    "data": {
        "getFeaturedCategories": [
            {
                "uuid": "d4f136cf-8df0-4978-be32-ba8e2b967ba6",
                "slug": "iphones-six",
                "name": "iphones",
                "isFeatured": true,
                "thumbnailUrl": "https://camion.s3.us-east-1.amazonaws.com/c87816c4-2abb-4224-9ff3-3793d615001d.jpg"
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
        "alphaCode": "qar"
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
            "fullName": "James",
            "gender": "Male",
            "nationality": "Saudi",
            "bio": "I am a Saudi",
            "type": "affiliate",
            "status": "rejected",
            "totalCommission": {
                "amount": 0,
                "currencyCode": "qar"
            },
            "totalPaid": {
                "amount": 0,
                "currencyCode": "qar"
            },
            "remainingBalance": {
                "amount": 0,
                "currencyCode": "qar"
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
                    "currencyCode": "qar"
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
                    "currencyCode": "qar"
                },
                "type": "credit",
                "description": "Your commission for the month of July",
                "createdAt": "2026-04-14T06:52:21.998Z"
            },
            {
                "uuid": "34995443-d0ff-4c94-b7ee-975850a85a00",
                "amount": {
                    "amount": 100,
                    "currencyCode": "qar"
                },
                "type": "debit",
                "description": "Reversed transaction # 804f8446-cb10-4997-bfac-d7e0487aba93",
                "createdAt": "2026-04-14T06:53:49.184Z"
            },
            {
                "uuid": "505f3585-fe14-4d1b-b12d-85c9f822f8ee",
                "amount": {
                    "amount": 100,
                    "currencyCode": "qar"
                },
                "type": "credit",
                "description": "Your commission for the month of July",
                "createdAt": "2026-04-14T09:59:12.921Z"
            },
            {
                "uuid": "e883c151-de96-4ba3-b294-24db6e75661d",
                "amount": {
                    "amount": 100,
                    "currencyCode": "qar"
                },
                "type": "credit",
                "description": "Your commission for the month of July",
                "createdAt": "2026-04-15T06:51:51.011Z"
            },
            {
                "uuid": "32a41b95-25dd-4024-beea-5858633d034a",
                "amount": {
                    "amount": 100,
                    "currencyCode": "qar"
                },
                "type": "credit",
                "description": "Your commission for the month of July",
                "createdAt": "2026-04-15T10:24:10.783Z"
            },
            {
                "uuid": "72b2d69c-aa4b-44ff-b61e-920c7947e909",
                "amount": {
                    "amount": 100,
                    "currencyCode": "qar"
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
        totalSales {
            amount
            currencyCode
        }
        totalCommission {
            amount
            currencyCode
        }
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
                "uuid": "41cc410c-faad-4732-b301-8a31d09e671f",
                "code": "amin16",
                "discountPercentage": 10,
                "ordersCount": 1,
                "totalSales": {
                    "amount": 100,
                    "currencyCode": "qar"
                },
                "totalCommission": {
                    "amount": 10,
                    "currencyCode": "qar"
                },
                "expiresAt": "Mon Dec 31 2029 05:00:00 GMT+0500 (Pakistan Standard Time)",
                "createdAt": "Fri May 22 2026 17:28:07 GMT+0500 (Pakistan Standard Time)"
            }
        ]
    }
}
```

Get Coupons Orders
------------------

### GraphQL Query

```graphql
query GetCouponOrders($uuid: String, $pageNumber: Int, $itemsPerPage: Int) {
    getCouponOrders(uuid: $uuid, pageNumber: $pageNumber, itemsPerPage: $itemsPerPage) {
        uuid
        total {
            amount
            currencyCode
        }
        commission {
            amount
            currencyCode
        }
        status
        createdAt
    }
}
```

### GraphQL Variables

```json
{
    "uuid": "41cc410c-faad-4732-b301-8a31d09e671f",
    "pageNumber": 1,
    "itemsPerPage": 24
}
```

### Response

```json
{
    "data": {
        "getCouponOrders": [
            {
                "uuid": "c87da440-5ce4-4cdf-9111-524420c0a0f0",
                "total": {
                    "amount": 100,
                    "currencyCode": "qar"
                },
                "commission": {
                    "amount": 10,
                    "currencyCode": "qar"
                },
                "status": "payment_pending",
                "createdAt": "2026-05-18T07:16:11.496Z"
            }
        ]
    }
}
```

Get Current Customer Orders
-----------------------------

### GraphQL Query

```graphql
query GetCurrentCustomerOrders($pageNumber: Int, $itemsPerPage: Int, $currency: String,  $language: String) {
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
        tracking {
            stage
            status
            waybillNo
        }
        orderPlacementDate
        shippingAddress {
            uuid
            fullName
            country
            city
            state
            apartment
            streetAddress
            zipCode
            phoneNumber
        }
        orderItems {
            uuid
            price {
                amount
                currencyCode
            }
            discountedPrice {
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
                title(language: $language)
                brief(language: $language)
                description(language: $language)
                descriptionHtml(language: $language)
                featuredImageUrl
                featuredThumbnailUrl
                status
            }
            variant {
                uuid
                title(language: $language)
                sku
                barcode
                price(currency: $currency) {
                    amount
                    currencyCode
                }
                discountedPrice(currency: $currency) {
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
}
```

### GraphQL Variables

```json
{
    "status": "pending" | "confirmed" | "cancelled" | "delivered" | "payment_pending" | "payment_successful"|  "payment_rejected" ,
    "language":"en",
    "currency": "qar",
    "pageNumber":1,
    "itemsPerPage": 10,
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
                    "currencyCode": "qar"
                },
                "shippingCost": {
                    "amount": 0,
                    "currencyCode": "qar"
                },
                "discount": {
                    "amount": 0,
                    "currencyCode": "qar"
                },
                "total": {
                    "amount": 688,
                    "currencyCode": "qar"
                },
                "eta": "6-10 working days",
                "orderItems": [
                    {
                        "uuid": "acd18a70-693a-4167-b813-5d5a925786de",
                        "price": {
                            "amount": 688,
                            "currencyCode": "qar"
                        },
                        "discountedPrice": {
                            "amount": 688,
                            "currencyCode": "qar"
                        },
                        "quantity": 1,
                        "total": {
                            "amount": 688,
                            "currencyCode": "qar"
                        },
                        "product": {
                            "uuid": "660e5d31-24e8-42e2-b8d7-1c45118ef29a",
                            "slug": "iphone-17",
                            "title": "iPhone 17",
                            "brief": "From $799 or $33.29/mo. per month for 24 months",
                            "description": "Your new iPhone awaits. Make it yours.",
                            "descriptionHtml": "<b>Your new iPhone awaits. Make it yours</b>",
                            "featuredImageUrl": "https://assets.dev.camiontrading.com/product-images/a5e23a38-d42c-4340-b601-51788510e52e.jpg",
                            "featuredThumbnailUrl": "https://assets.dev.camiontrading.com/product-images/a5e23a38-d42c-4340-b601-51788510e52e.jpg",
                            "status": "DRAFT",
                        },
                        "variant": {
                            "uuid": "c0a7c17f-3f78-45c7-9811-75abb0a46c9a",
                            "title": "iPhone 17 Red 1 TB",
                            "sku": "iphone-17-red-1tb",
                            "barcode": "10000",
                            "price": {
                                "amount": 1000,
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
                            "images": [
                                {
                                    "uuid": "e23e83b6-48b9-436b-84c1-617a9bc5a60e",
                                    "imageUrl": "https://assets.dev.camiontrading.com/product-images/a5e23a38-d42c-4340-b601-51788510e52e.jpg",
                                    "thumbnailUrl": "https://assets.dev.camiontrading.com/product-images/a5e23a38-d42c-4340-b601-51788510e52e.jpg",
                                    "alt": "",
                                    "isFeatured": false,
                                    "position": 0
                                }
                            ]
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
query GetCurrentCustomerOrder($uuid: String!, $currency: String,  $language: String) {
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
        tracking {
            stage
            status
            waybillNo
        }
        orderPlacementDate
        shippingAddress {
            uuid
            fullName
            country
            city
            state
            apartment
            streetAddress
            zipCode
            phoneNumber
        }
        orderItems {
            uuid
            price {
                amount
                currencyCode
            }
            discountedPrice {
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
                title(language: $language)
                brief(language: $language)
                description(language: $language)
                descriptionHtml(language: $language)
                featuredImageUrl
                featuredThumbnailUrl
                status
                productCategories {
                    category {
                        uuid
                        slug
                        name
                        nameEn
                        nameAr
                        thumbnailUrl
                    }
                }
            }
            variant {
                uuid
                title(language: $language)
                sku
                barcode
                price(currency: $currency) {
                    amount
                    currencyCode
                }
                discountedPrice(currency: $currency) {
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
                images {
                    uuid
                    imageUrl
                    thumbnailUrl
                    alt
                    isFeatured
                    position
                }
                optionValues{
                    optionValue{
                        uuid
                        value(language: $language)
                        position
                        option {
                            uuid
                            name(language: $language)
                            position
                        }
                    }
                }
            }
        }
    }
}
```

### GraphQL Variables

```json
{
    "uuid": "0a791d05-f5cb-4005-aa63-7ba68a8c06b9" ,
    "language":"en",
    "currency": "qar",
}
```

### Response

```json
{
    "data": {
        "getCurrentCustomerOrder":{
            "uuid": "0a791d05-f5cb-4005-aa63-7ba68a8c06b9",
            "status": "confirmed",
            "subTotal": {
                "amount": 688,
                "currencyCode": "qar"
            },
            "shippingCost": {
                "amount": 321,
                "currencyCode": "qar"
            },
            "discount": {
                "amount": 0,
                "currencyCode": "qar"
            },
            "total": {
                "amount": 1009,
                "currencyCode": "qar"
            },
            "eta": "6-10 working days",
            "tracking": {
                "stage": "inbound",
                "status": "Goods Being Sourced",
                "waybillNo": null
            },
            "orderPlacementDate": "2026-05-15T14:05:23.594Z",
            "orderItems": [
                {
                    "uuid": "acd18a70-693a-4167-b813-5d5a925786de",
                    "price": {
                        "amount": 688,
                        "currencyCode": "qar"
                    },
                    "discountedPrice": {
                        "amount": 688,
                        "currencyCode": "qar"
                    },
                    "quantity": 1,
                    "total": {
                        "amount": 688,
                        "currencyCode": "qar"
                    },
                    "product": {
                        "uuid": "660e5d31-24e8-42e2-b8d7-1c45118ef29a",
                        "slug": "iphone-17",
                        "title": "iPhone 17",
                        "brief": "From $799 or $33.29/mo. per month for 24 months",
                        "description": "Your new iPhone awaits. Make it yours.",
                        "descriptionHtml": "<b>Your new iPhone awaits. Make it yours</b>",
                        "featuredImageUrl": "https://assets.dev.camiontrading.com/product-images/a5e23a38-d42c-4340-b601-51788510e52e.jpg",
                        "featuredThumbnailUrl": "https://assets.dev.camiontrading.com/product-images/a5e23a38-d42c-4340-b601-51788510e52e.jpg",
                        "status": "DRAFT",
                        "productCategories": [
                            {
                                "category": {
                                    "uuid": "5e012103-2e5a-4f30-af5b-06b8fe6f2628",
                                    "slug": "electronics-laptops",
                                    "name": "laptop",
                                    "nameEn": "laptop",
                                    "nameAr": "كمبيوتر محمول",
                                    "thumbnailUrl": ""
                                }
                            }
                        ]
                    },
                    "variant": {
                        "uuid": "c0a7c17f-3f78-45c7-9811-75abb0a46c9a",
                        "title": "iPhone 17 Red 1 TB",
                        "sku": "iphone-17-red-1tb",
                        "barcode": "10000",
                        "price": {
                            "amount": 1000,
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
                        "images": [
                            {
                                "uuid": "e23e83b6-48b9-436b-84c1-617a9bc5a60e",
                                "imageUrl": "https://assets.dev.camiontrading.com/product-images/a5e23a38-d42c-4340-b601-51788510e52e.jpg",
                                "thumbnailUrl": "https://assets.dev.camiontrading.com/product-images/a5e23a38-d42c-4340-b601-51788510e52e.jpg",
                                "alt": "",
                                "isFeatured": false,
                                "position": 0
                            }
                        ]
                        "optionValues": [
                            {
                                "optionValue": {
                                    "uuid": "9106ada0-6e4c-4310-b4ed-a2350494a8cd",
                                    "value": "White 2151 short sleeves-100% cotton",
                                    "position": 1,
                                    "option": {
                                        "uuid": "8d37acb5-3cf0-4854-846a-ee35ff57916a",
                                        "name": "Color",
                                        "position": 1
                                    }
                                }
                            },
                            {
                                "optionValue": {
                                    "uuid": "767b2e2a-4ab2-4ca9-85e3-d0845a2b503c",
                                    "value": "S [recommendation 45-57.5kg ]",
                                    "position": 1,
                                    "option": {
                                        "uuid": "5a4ea9b6-4e15-4fad-8205-e02a11af355b",
                                        "name": "Size",
                                        "position": 2
                                    }
                                }
                            }
                        ]
                    }
                }
            ]
        }
    }
}
```

Get Current Customer Order Preview
-----------------------------------

### GraphQL Query

```graphql
query GetCurrentCustomerOrderPrevie($language: String, $currency: String, $couponCode: String)  {
    getCurrentCustomerOrderPreview(language: $language, currency: $currency, couponCode: $couponCode) {
        items{
            uuid
            product {
                uuid
                slug
                title(language: $language)
                brief(language: $language)
                description(language: $language)
                descriptionHtml(language: $language)
                featuredImageUrl
                featuredThumbnailUrl
                status
                salesCount
                likesCount
                reviewsCount
                ratingAvg
                ratingOneStarCount
                ratingTwoStarCount
                ratingThreeStarCount
                ratingFourStarCount
                ratingFiveStarCount
            }
            variant {
                uuid
                title
                sku
                barcode
                price(currency: $currency) {
                    amount
                    currencyCode
                }
                discountedPrice(currency: $currency) {
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
                images {
                    uuid
                    imageUrl
                    thumbnailUrl
                    alt
                    isFeatured
                    position
                }
                optionValues{
                    optionValue{
                        uuid
                        value(language: $language)
                        position
                        option {
                            uuid
                            name(language: $language)
                            position
                        }
                    }
                }
            }
        }
        shippingAddress {
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
        cart_total
        discount
        shippingTotal
        grand_total
        eta
        orderTotalWarning
    }
}
```

### GraphQL Variables

```json
{
    "language":"en",
    "currency": "qar",
    "couponCode"?: "4422"
}
```

### Response

```json
{
    "data": {
        "getCurrentCustomerOrderPreview": {
            "items": [
                {
                    "uuid": "628ae1a7-0509-4dd3-ac71-b2ae1ab375fe",
                    "product": {
                        "uuid": "6ffa8d28-eaa1-40c9-9978-cfad977a3317",
                        "slug": "156inch-laptop-i7-quad-core-independent-graphics-gaming-office",
                        "title": "15.6inch Laptop I7 Quad-Core Independent Graphics Gaming Office Business Learning Online Class Live Broadcast I5 Ultra-Thin Satc",
                        "brief": "",
                        "description": "",
                        "descriptionHtml": "",
                        "featuredImageUrl": "https://assets.dev.camiontrading.com/product-images/a5e23a38-d42c-4340-b601-51788510e52e.jpg",
                        "featuredThumbnailUrl": "https://assets.dev.camiontrading.com/product-images/a5e23a38-d42c-4340-b601-51788510e52e.jpg",
                        "status": "active",
                        "salesCount": 0,
                        "likesCount": 0,
                        "reviewsCount": 0,
                        "ratingAvg": 0,
                        "ratingOneStarCount": 0,
                        "ratingTwoStarCount": 0,
                        "ratingThreeStarCount": 0,
                        "ratingFourStarCount": 0,
                        "ratingFiveStarCount": 0
                    },
                    "variant": {
                        "uuid": "1c2d2fe9-035f-491b-bb69-9a5a2601f18c",
                        "title": "Configuration 2 recommended for entry-level office",
                        "sku": "6044512586268",
                        "barcode": "6044512586268",
                        "price": {
                            "amount": 525,
                            "currencyCode": "qar"
                        },
                        "discountedPrice": {
                            "amount": 525,
                            "currencyCode": "qar"
                        },
                        "weight": {
                            "amount": 1,
                            "unit": "kg"
                        },
                        "dimensions": {
                            "width": 1,
                            "height": 1,
                            "length": 1,
                            "unit": "cm"
                        }
                        "images": [
                            {
                                "uuid": "e23e83b6-48b9-436b-84c1-617a9bc5a60e",
                                "imageUrl": "https://assets.dev.camiontrading.com/product-images/a5e23a38-d42c-4340-b601-51788510e52e.jpg",
                                "thumbnailUrl": "https://assets.dev.camiontrading.com/product-images/a5e23a38-d42c-4340-b601-51788510e52e.jpg",
                                "alt": "",
                                "isFeatured": false,
                                "position": 0
                            }
                        ]
                        "optionValues": [
                            {
                                "optionValue": {
                                    "uuid": "9106ada0-6e4c-4310-b4ed-a2350494a8cd",
                                    "value": "White 2151 short sleeves-100% cotton",
                                    "position": 1,
                                    "option": {
                                        "uuid": "8d37acb5-3cf0-4854-846a-ee35ff57916a",
                                        "name": "Color",
                                        "position": 1
                                    }
                                }
                            },
                            {
                                "optionValue": {
                                    "uuid": "767b2e2a-4ab2-4ca9-85e3-d0845a2b503c",
                                    "value": "S [recommendation 45-57.5kg ]",
                                    "position": 1,
                                    "option": {
                                        "uuid": "5a4ea9b6-4e15-4fad-8205-e02a11af355b",
                                        "name": "Size",
                                        "position": 2
                                    }
                                }
                            }
                        ]
                    }
                }
            ],
            "shippingAddress": {
                "uuid": "79a96a53-8f78-485c-8424-df092b5d0697",
                "fullName": "Fahad Al-Saud",
                "phoneNumber": "+966 51 234 5678",
                "streetAddress": "King Fahd Road",
                "apartment": "Apartment 12B, Al Noor Building",
                "zipCode": "12271",
                "city": "Riyadh",
                "state": "RI",
                "country": "SA",
                "isDefault": true
            },
            "cart_total": 990,
            "discount": 0,
            "shippingTotal": 231,
            "grand_total": 1221,
            "eta": "6-10 working days",
            "orderTotalWarning": "Order value should not be less than 250 QAR",
        }
    }
}
```

Get Current Customer WishList
-----------------------------

### GraphQL Query

```graphql
query GetCustomerWishlist($language: String, $currency: String, $pageNumber: Int, $itemsPerPage: Int) {
    getCustomerWishlist(language: $language, currency: $currency, pageNumber: $pageNumber, itemsPerPage: $itemsPerPage) {
        uuid
        product {
            uuid
            slug
            title(language: $language)
            brief(language: $language)
            description(language: $language)
            descriptionHtml(language: $language)
            featuredImageUrl
            featuredThumbnailUrl
            status
            salesCount
            likesCount
            reviewsCount
            ratingAvg
            ratingOneStarCount
            ratingTwoStarCount
            ratingThreeStarCount
            ratingFourStarCount
            ratingFiveStarCount
        }
        variant {
            uuid
            title
            sku
            barcode
            price(currency: $currency) {
                amount
                currencyCode
            }
            discountedPrice(currency: $currency) {
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
    "language": "ar",
    "currency": "qar",
    "pageNumber": 1,
    "itemsPerPage": 1
}
```

### Response

```json
{
    "data": {
        "getCustomerWishlist": [
            {
                "uuid": "056c1bcc-f421-47f9-8a4c-a95a6e8c98e8",
                "product": {
                    "uuid": "28da9466-2e8d-4b09-b6bc-fa429484f9c6",
                    "slug": "iphone-22",
                    "title": "iPhone 22",
                    "brief": "From $799 or $33.29/mo. per month for 24 months",
                    "description": "Your new iPhone awaits. Make it yours.",
                    "descriptionHtml": "<b>Your new iPhone awaits. Make it yours</b>",
                    "featuredImageUrl": "https://assets.dev.camiontrading.com/product-images/a5e23a38-d42c-4340-b601-51788510e52e.jpg",
                    "featuredThumbnailUrl": "https://assets.dev.camiontrading.com/product-images/a5e23a38-d42c-4340-b601-51788510e52e.jpg",
                    "status": "active",
                    "salesCount": 0,
                    "likesCount": 0,
                    "reviewsCount": 1,
                    "ratingAvg": 5,
                    "ratingOneStarCount": 0,
                    "ratingTwoStarCount": 0,
                    "ratingThreeStarCount": 0,
                    "ratingFourStarCount": 0,
                    "ratingFiveStarCount": 0
                },
                "variant": {
                    "uuid": "27da54da-8ef9-424f-9c62-ba11f4f924fd",
                    "title": "iPhone 20 RED 1 TB",
                    "sku": "iphone-20-red-1tb",
                    "barcode": "10000",
                    "price": {
                        "amount": 7500,
                        "currencyCode": "qar"
                    },
                    "discountedPrice": {
                        "amount": 6750,
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
                    },
                    "images": [
                        {
                            "uuid": "e23e83b6-48b9-436b-84c1-617a9bc5a60e",
                            "imageUrl": "https://assets.dev.camiontrading.com/product-images/a5e23a38-d42c-4340-b601-51788510e52e.jpg",
                            "thumbnailUrl": "https://assets.dev.camiontrading.com/product-images/a5e23a38-d42c-4340-b601-51788510e52e.jpg",
                            "alt": "",
                            "isFeatured": false,
                            "position": 0
                        }
                    ]
                }
            }
        ]
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

Get Customer Cart
------------------

### GraphQL Query

```graphql
query GetCustomerCart($language: String, $currency: String, $pageNumber: Int, $itemsPerPage: Int) {
    getCustomerCart(language: $language, currency: $currency, pageNumber: $pageNumber, itemsPerPage: $itemsPerPage) {
        uuid
        product {
            uuid
            slug
            title(language: $language)
            brief(language: $language)
            description(language: $language)
            descriptionHtml(language: $language)
            featuredImageUrl
            featuredThumbnailUrl
            status
            salesCount
            likesCount
            reviewsCount
            ratingAvg
            ratingOneStarCount
            ratingTwoStarCount
            ratingThreeStarCount
            ratingFourStarCount
            ratingFiveStarCount
        }
        variant {
            uuid
            title
            sku
            barcode
            price(currency: $currency) {
                amount
                currencyCode
            }
            discountedPrice(currency: $currency) {
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
            images {
                uuid
                imageUrl
                thumbnailUrl
                alt
                isFeatured
                position
            }
            optionValues{
                optionValue{
                    uuid
                    value(language: $language)
                    position
                    option {
                        uuid
                        name(language: $language)
                        position
                    }
                }
            }
        }
        availableStock
        subTotal {
            amount
            currency
        }
        discountPrice {
            amount
            currency
        }
        total {
            amount
            currency
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
    "itemsPerPage": 1
}
```

### Response

```json
{
    "data": {
        "getCustomerCart": [
            {
                "uuid": "8c534e15-673f-440e-b548-04424cc92363",
                "product": {
                    "uuid": "28da9466-2e8d-4b09-b6bc-fa429484f9c6",
                    "slug": "iphone-22",
                    "title": "iPhone 22",
                    "brief": "From $799 or $33.29/mo. per month for 24 months",
                    "description": "Your new iPhone awaits. Make it yours.",
                    "descriptionHtml": "<b>Your new iPhone awaits. Make it yours</b>",
                    "featuredImageUrl": "https://assets.dev.camiontrading.com/product-images/a5e23a38-d42c-4340-b601-51788510e52e.jpg",
                    "featuredThumbnailUrl": "https://assets.dev.camiontrading.com/product-images/a5e23a38-d42c-4340-b601-51788510e52e.jpg",
                    "status": "active",
                    "salesCount": 0,
                    "likesCount": 0,
                    "reviewsCount": 1,
                    "ratingAvg": 5,
                    "ratingOneStarCount": 0,
                    "ratingTwoStarCount": 0,
                    "ratingThreeStarCount": 0,
                    "ratingFourStarCount": 0,
                    "ratingFiveStarCount": 0
                },
                "variant": {
                    "uuid": "27da54da-8ef9-424f-9c62-ba11f4f924fd",
                    "title": "iPhone 20 RED 1 TB",
                    "sku": "iphone-20-red-1tb",
                    "barcode": "10000",
                    "price": {
                        "amount": 7500,
                        "currencyCode": "qar"
                    },
                    "discountedPrice": {
                        "amount": 7500,
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
                    },
                    "images": [
                        {
                            "uuid": "e23e83b6-48b9-436b-84c1-617a9bc5a60e",
                            "imageUrl": "https://assets.dev.camiontrading.com/product-images/a5e23a38-d42c-4340-b601-51788510e52e.jpg",
                            "thumbnailUrl": "https://assets.dev.camiontrading.com/product-images/a5e23a38-d42c-4340-b601-51788510e52e.jpg",
                            "alt": "",
                            "isFeatured": false,
                            "position": 0
                        }
                    ],
                    "optionValues": [
                        {
                            "optionValue": {
                                "uuid": "853fe098-90a1-460d-ab49-20abc7f55896",
                                "value": "Off-white and dark gray [double standard model]",
                                "position": 8,
                                "option": {
                                    "uuid": "caf82529-a8a9-43e3-b927-7447e61eba12",
                                    "name": "Color",
                                    "position": 1
                                }
                            }
                        }
                    ]
                },
                "availableStock": 100,
                "subTotal": {
                    "amount": 15000,
                    "currencyCode": "qar"
                },
                "discountPrice": {
                    "amount": 2000,
                    "currencyCode": "qar"
                },
                "subTotal": {
                    "amount": 13000,
                    "currencyCode": "qar"
                },
            }
        ]
    }
}
```

Get Current Customer Cart Count
--------------------------------

### GraphQL Query

```graphql
query GetCustomerCartCount {
    getCustomerCartCount
}
```

### Response

```json
{
    "data": {
        "getCustomerCartCount": 1
    }
}
```

Get Promos
----------

```graphql
query Promos($pageNumber: Int, $itemsPerPage: Int) {
    getPromos(pageNumber: $pageNumber, itemsPerPage: $itemsPerPage) {
        uuid
        name
        text
        callToActionText
        callToActionLink
    }
}
```

```json
{
    "pageNumber": 1,
    "itemsPerPage": 24
}
```

```json
{
    "data": {
        "getPromos": [
            {
                "uuid": "bced1f96-3e75-40e4-a651-0cfbc8d94326",
                "name": "summer-sale-2027",
                "text": "Summer Sale For All Swim Suits And Free Express Delivery - OFF 80%!",
                "callToActionText": "Shop More",
                "callToActionLink": "https://app.dev.camiontrading.com/fr/shop"
            }
        ]
    }
}
```

Get CMS Pages
-------------

Returns all CMS pages (e.g. Privacy Policy, Refund Policy), sorted by creation date descending.

```graphql
query {
    getPosts {
        uuid
        slug
        title
        brief
        content
        enabled
        images
        createdBy {
            uuid
            fullName
        }
    }
}
```

```json
{
    "data": {
        "getPosts": [
            {
                "uuid": "b3f1a2c4-1234-4abc-9def-000000000001",
                "slug": "privacy-policy",
                "title": "Privacy Policy",
                "brief": "How we handle your data.",
                "content": "Full privacy policy content...",
                "enabled": true,
                "images": null,
                "createdBy": {
                    "uuid": "user-uuid",
                    "fullName": "Admin Name"
                }
            }
        ]
    }
}
```

Get CMS Page
------------

Returns a single CMS page by slug.

```graphql
query GetPost($slug: String!) {
    getPost(slug: $slug) {
        uuid
        slug
        title
        brief
        content
        enabled
        images
        createdBy {
            uuid
            fullName
        }
    }
}
```

```json
{
    "slug": "privacy-policy"
}
```

```json
{
    "data": {
        "getPost": {
            "uuid": "b3f1a2c4-1234-4abc-9def-000000000001",
            "slug": "privacy-policy",
            "title": "Privacy Policy",
            "brief": "How we handle your data.",
            "content": "Full privacy policy content...",
            "enabled": true,
            "images": null,
            "createdBy": {
                "uuid": "user-uuid",
                "fullName": "Admin Name"
            }
        }
    }
}
```

Get Current Customer Return Requests
-------------------------------------

### GraphQL Query

```graphql
query GetCurrentCustomerReturnRequests($currency: String,  $language: String) {
    getCurrentCustomerReturnRequests {
        uuid
        order {
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
        }
        orderItem {
            uuid
            price {
                amount
                currencyCode
            }
            discountedPrice {
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
                title(language: $language)
                brief(language: $language)
                description(language: $language)
                descriptionHtml(language: $language)
                featuredImageUrl
                featuredThumbnailUrl
                status
                productCategories {
                    category {
                        uuid
                        slug
                        name
                        nameEn
                        nameAr
                        thumbnailUrl
                    }
                }
            }
            variant {
                uuid
                title(language: $language)
                sku
                barcode
                price(currency: $currency) {
                    amount
                    currencyCode
                }
                discountedPrice(currency: $currency) {
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
        reason
        reasonDetail
        status
        adminNote
        refundAmount {
            amount
            currencyCode
        }
        evidence {
            uuid
            url
            mimeType
        }
    }
}
```

### GraphQL Variables

```json
{
    "language":"en",
    "currency": "qar",
    "pageNumber":1,
    "itemsPerPage": 10,
}
```

### Response

```json
{
    "data": {
        "getCurrentCustomerReturnRequests": [
            {
                "uuid": "bb14d554-63d6-4f85-a6b2-7070063dace4",
                "order": {
                    "uuid": "685b81a1-127f-4ce6-868e-7df33012a738",
                    "status": "return_requested",
                    "subTotal": {
                        "amount": 525,
                        "currencyCode": "qar"
                    },
                    "shippingCost": {
                        "amount": 165,
                        "currencyCode": "qar"
                    },
                    "discount": {
                        "amount": 53,
                        "currencyCode": "qar"
                    },
                    "total": {
                        "amount": 637,
                        "currencyCode": "qar"
                    }
                },
                "orderItem": null,
                "reason": "wrong_variation",
                "reasonDetail": "order small size",
                "status": "pending",
                "adminNote": null,
                "refundAmount": {
                    "amount": 637,
                    "currencyCode": "qar"
                },
                "evidence": []
            }
        ]
    }
}
```

Get Current Customer Return Request
-------------------------------------

### GraphQL Query

```graphql
query GetCurrentCustomerReturnRequest($uuid: String!,$currency: String,  $language: String) {
    getCurrentCustomerReturnRequest(uuid: $uuid) {
        uuid
        order {
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
        }
        orderItem {
            uuid
            price {
                amount
                currencyCode
            }
            discountedPrice {
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
                title(language: $language)
                brief(language: $language)
                description(language: $language)
                descriptionHtml(language: $language)
                featuredImageUrl
                featuredThumbnailUrl
                status
                productCategories {
                    category {
                        uuid
                        slug
                        name
                        nameEn
                        nameAr
                        thumbnailUrl
                    }
                }
            }
            variant {
                uuid
                title(language: $language)
                sku
                barcode
                price(currency: $currency) {
                    amount
                    currencyCode
                }
                discountedPrice(currency: $currency) {
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
        reason
        reasonDetail
        status
        adminNote
        refundAmount {
            amount
            currencyCode
        }
        evidence {
            uuid
            url
            mimeType
        }
    }
}
```

### GraphQL Variables

```json
{
  "uuid": "bb14d554-63d6-4f85-a6b2-7070063dace4",
  "language": "en",
  "currency": "qar"
}
```

### Response

```json
{
    "data": {
        "getCurrentCustomerReturnRequest": {
            "uuid": "bb14d554-63d6-4f85-a6b2-7070063dace4",
            "order": {
                "uuid": "685b81a1-127f-4ce6-868e-7df33012a738",
                "status": "return_requested",
                "subTotal": {
                    "amount": 525,
                    "currencyCode": "qar"
                },
                "shippingCost": {
                    "amount": 165,
                    "currencyCode": "qar"
                },
                "discount": {
                    "amount": 53,
                    "currencyCode": "qar"
                },
                "total": {
                    "amount": 637,
                    "currencyCode": "qar"
                }
            },
            "orderItem": null,
            "reason": "wrong_variation",
            "reasonDetail": "order small size",
            "status": "pending",
            "adminNote": null,
            "refundAmount": {
                "amount": 637,
                "currencyCode": "qar"
            },
            "evidence": []
        }
    }
}
```

Get Minimum Order Key Value Pair
--------------------------------

### GraphQL Query

```graphql
uery GetMinimumOrderValue($currency: String) {
  getMinimumOrderValue(currency: $currency) {
    uuid
    name
    type
    integerValue
    decimalValue
    stringValue
    booleanValue
    sensitive
  }
}
```

### Response

```json
{
    "data": {
        "getMinimumOrderValue": {
            "uuid": "da8dcbb7-7220-4632-91c0-dd99dd6848ca",
            "name": "min_order_amount_qar",
            "type": "integer",
            "integerValue": 300,
            "decimalValue": 0,
            "stringValue": "0",
            "booleanValue": false,
            "sensitive": false
        }
    }
}
```
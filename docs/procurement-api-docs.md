Procurement REST API
==================

This document includes the documentation of procurement module.

Procedure to Search and Retrieve Products
--------------------------------------

Follow the following steps to search and retrieve product details from the procurement platform.

1. Search products using keyword and filters.
2. Retrieve a specific product detail using product ID.

Procurement API
=============

> [!IMPORTANT]
> You must include your access token as a `Bearer` token in the Authorization header. Your account must be active while making these requests.

Search Products
------------------

> [!IMPORTANT]
> Required roles: `SuperAdmin`, `Admin`

```http
GET /v1/procurement HTTP/1.1
```
Query Parameters
Parameter Name | Required | Type | Description
---------------|----------|------|------------
keyword | Yes | String | Search keyword for products
page | No | NumberString | Page number for pagination
pageSize | No | NumberString | Number of items per page
sort | No | String | Sorting option (e.g., price, sales)
priceStart | No | String | Minimum price filter
priceEnd | No | String | Maximum price filter

### Response Body
```json
[
    {
        "externalId": "123456",
        "title": "Running Shoes",
        "price": 25.5,
        "originalPrice": 30,
        "image": "https://example.com/image.jpg",
        "productUrl": "https://example.com/product",
        "monthlySales": 120,
        "rating": 4.5,
        "minOrderQuantity": 2,
        "isDropshipping": true,
        "supplierType": "manufacturer",
        "category": {
            "level1": "1",
            "level2": "2",
            "level3": "3"
        },
        "createdAt": "2024-01-01",
        "updatedAt": "2024-01-02"
    }
]
```

Retrieve Product Detail
-------------------

> [!IMPORTANT]
> Required roles: `SuperAdmin`, `Admin`

```http
GET /v1/procurement/<product-id> HTTP/1.1
```

### Response Body
```json
{
    "externalId": "123456",
    "title": "Running Shoes",
    "description": "Original product description",
    "descriptionTrans": "Translated description",
    "images": [
        "https://example.com/image1.jpg",
        "https://example.com/image2.jpg"
    ],
    "mainImage": "https://example.com/image1.jpg",
    "video": "https://example.com/video.mp4",
    "price": 25.5,
    "minOrderQuantity": 2,
    "variants": [
        {
            "skuId": "sku-1",
            "price": 25.5,
            "stock": 100,
            "attributes": [
                {
                    "name": "Color",
                    "value": "Red"
                },
                {
                    "name": "Size",
                    "value": "42"
                }
            ],
            "image": "https://example.com/variant.jpg"
        }
    ],
    "options": [
        {
            "name": "Color",
            "values": ["Red", "Blue"]
        },
        {
            "name": "Size",
            "values": ["40", "41", "42"]
        }
    ],
    "attributes": [
        {
            "name": "Material",
            "value": "Leather"
        }
    ],
    "supplier": {
        "name": "ABC Supplier",
        "id": "supplier-123"
    },
    "category": {
        "level1": "1",
        "level2": "2",
        "level3": "3"
    },
    "shipping": {
        "weight": 1.2,
        "length": 30,
        "width": 20,
        "height": 10,
        "origin": "China"
    },
    "meta": {
        "rating": 4.5,
        "sold": 500,
        "isDropshipping": true
    }
}
```

Import Products
------------------

> [!IMPORTANT]
> Required roles: `SuperAdmin`, `Admin`

```http
Post /v1/procurement/import HTTP/1.1
```
Query Parameters
Parameter Name | Required | Type | Description
---------------|----------|------|------------
externalId | Yes | Array<String> | Array of external Ids
categories | Yes | Array<String> | Array of categories uuIds
warehouseUUID | Yes | String | uuid of waregouse

### Request Body
```json
{
    "externalId": ["724311508795"],
    "categories": ["413ca229-065d-4f29-b4cc-c63151bd3b2a"],
    "warehouseUUID": "6ba35190-ef22-4b73-af06-5ba1e0580b57"
}
```

### Response Body
```json
{
    "success": [
        {
            "externalId": "801224174564",
            "product": {
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
        }
    ],
    "failed": [
        {
            "id": "801224174564",
            "reason": "failed to add product options"
        }
    ]
}
```

Create Order
------------------

> [!IMPORTANT]
> Required roles: `SuperAdmin`, `Admin`

Creates a single Gulltrans daigou order for one shop. `shop_id` and `shop_name` are obtained from the `supplier` field of the product detail response (`GET /v1/procurement/<product-id>`). `warehouse_id` and `user_id` are injected server-side from environment variables and must not be sent in the request.

```http
POST /v1/procurement/order HTTP/1.1
```

### Request Body
```json
{
    "shop_id": "BBBZSESFJBTCxhL370nJnRUjQ",
    "shop_name": "BBBZSESFJBTCxhL370nJnRUjQ",
    "platform": "1688",
    "platform_url": "https://detail.1688.com/offer/682292125022.html",
    "name": "Wedding Dress 2025",
    "title_cn": "抖音主婚纱2025新款",
    "goods_amount": "480",
    "freight_fee": "8",
    "remark": "Optional order note",
    "skus": [
        {
            "price": "120",
            "platform_sku": "4881544500911",
            "quantity": "2",
            "freight_fee": "8",
            "sku_info": {
                "shop_id": "BBBZSESFJBTCxhL370nJnRUjQ",
                "shop_name": "BBBZSESFJBTCxhL370nJnRUjQ",
                "sku_img": "https://example.com/image.jpg",
                "spec_id": "7f74e9dcb448177df9404cb65f6bad1e",
                "min_order_quantity": "2",
                "batch_number": "1",
                "imgs": [
                    "https://example.com/image1.jpg",
                    "https://example.com/image2.jpg"
                ],
                "specs": [
                    { "label": "颜色", "value": "白色" },
                    { "label": "尺码", "value": "XL" }
                ],
                "priceRangeList": [
                    { "startQuantity": "2", "price": "99" }
                ]
            }
        }
    ],
    "address": {
        "address": "广东省深圳市龙华区XX公寓",
        "province": "广东省",
        "city": "深圳市",
        "company": "集运公司",
        "district": "龙华区",
        "street": "XX公寓",
        "postcode": "518054",
        "phone": "18512345678",
        "receiver_name": "丁XX",
        "email": "18512345678@163.com",
        "country_name": "中国",
        "country": {
            "country_code": "CN",
            "name": "中国"
        }
    }
}
```

### Request Body Fields
Parameter Name | Required | Type | Description
---------------|----------|------|------------
shop_id | No | String | 1688 shop ID — from `supplier.id` in product detail response
shop_name | No | String | 1688 shop name — from `supplier.name` in product detail response
platform | No | String | Platform identifier. Defaults to `1688`
platform_url | Yes | String | Product URL on 1688
name | Yes | String | Product name
title_cn | No | String | Product name in Chinese
goods_amount | Yes | String | Total goods price (sum of all SKUs)
freight_fee | No | String | Shipping fee
remark | No | String | Order note
skus | Yes | Array | At least one SKU required
address | Yes | Object | Delivery address

### Response Body
```json
{
    "success": true,
    "orderId": "123456789",
    "raw": {}
}
```

---

Bulk Create Orders
------------------

> [!IMPORTANT]
> Required roles: `SuperAdmin`, `Admin`

Creates multiple Gulltrans daigou orders in a single request. Products are automatically grouped by `shop_id` (falls back to `shop_name`) — all products from the same shop are merged into one Gulltrans order with their SKUs combined and `goods_amount` summed. The `address` is shared across all orders.

Orders are processed in parallel batches of 3. Failures are collected per shop and returned alongside successes — a single shop failure does not abort the rest.

```http
POST /v1/procurement/order/bulk HTTP/1.1
```

### Request Body
```json
{
    "orders": [
        {
            "shop_id": "ShopA123",
            "shop_name": "Shop A",
            "platform": "1688",
            "platform_url": "https://detail.1688.com/offer/111.html",
            "name": "Product A",
            "goods_amount": "240",
            "freight_fee": "8",
            "skus": [
                {
                    "price": "120",
                    "platform_sku": "4881544500911",
                    "quantity": "2",
                    "sku_info": {
                        "spec_id": "abc123",
                        "specs": [
                            { "label": "颜色", "value": "白色" },
                            { "label": "尺码", "value": "XL" }
                        ],
                        "priceRangeList": [
                            { "startQuantity": "2", "price": "120" }
                        ]
                    }
                }
            ]
        },
        {
            "shop_id": "ShopA123",
            "shop_name": "Shop A",
            "platform": "1688",
            "platform_url": "https://detail.1688.com/offer/222.html",
            "name": "Product B",
            "goods_amount": "300",
            "freight_fee": "10",
            "skus": [
                {
                    "price": "150",
                    "platform_sku": "4881544500912",
                    "quantity": "2",
                    "sku_info": {
                        "spec_id": "def456",
                        "specs": [
                            { "label": "尺码", "value": "XXL" }
                        ],
                        "priceRangeList": [
                            { "startQuantity": "2", "price": "150" }
                        ]
                    }
                }
            ]
        },
        {
            "shop_id": "ShopB456",
            "shop_name": "Shop B",
            "platform": "1688",
            "platform_url": "https://detail.1688.com/offer/333.html",
            "name": "Product C",
            "goods_amount": "180",
            "skus": [
                {
                    "price": "90",
                    "platform_sku": "4881544500913",
                    "quantity": "2",
                    "sku_info": {
                        "spec_id": "ghi789",
                        "specs": [
                            { "label": "颜色", "value": "黑色" }
                        ],
                        "priceRangeList": [
                            { "startQuantity": "2", "price": "90" }
                        ]
                    }
                }
            ]
        }
    ],
    "address": {
        "address": "广东省深圳市龙华区XX公寓",
        "province": "广东省",
        "city": "深圳市",
        "company": "集运公司",
        "district": "龙华区",
        "street": "XX公寓",
        "postcode": "518054",
        "phone": "18512345678",
        "receiver_name": "丁XX",
        "email": "18512345678@163.com",
        "country_name": "中国",
        "country": {
            "country_code": "CN",
            "name": "中国"
        }
    }
}
```

> [!NOTE]
> The example above sends 3 products: Product A and Product B share `shop_id: "ShopA123"`, so they are merged into **one** Gulltrans order call. Product C from `ShopB456` becomes a separate order. Result: **2 Gulltrans API calls**, not 3.

### Request Body Fields
Parameter Name | Required | Type | Description
---------------|----------|------|------------
orders | Yes | Array | At least one order item required
orders[].shop_id | No | String | 1688 shop ID — used as grouping key
orders[].shop_name | No | String | 1688 shop name — used as fallback grouping key if shop_id is absent
orders[].platform | No | String | Platform identifier. Defaults to `1688`
orders[].platform_url | Yes | String | Product URL on 1688
orders[].name | Yes | String | Product name
orders[].title_cn | No | String | Product name in Chinese
orders[].goods_amount | Yes | String | Goods price for this product
orders[].freight_fee | No | String | Shipping fee for this product
orders[].remark | No | String | Order note for this product
orders[].skus | Yes | Array | At least one SKU required
address | Yes | Object | Shared delivery address applied to all orders

### Response Body
```json
{
    "success": [
        {
            "shopId": "ShopA123",
            "orderId": "987654321",
            "raw": {}
        },
        {
            "shopId": "ShopB456",
            "orderId": "987654322",
            "raw": {}
        }
    ],
    "failed": [
        {
            "shopId": "ShopC789",
            "reason": "Insufficient balance"
        }
    ]
}
```
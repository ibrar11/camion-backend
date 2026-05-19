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
{
    "data": [
        {
            "externalId": 530803621189,
            "title": "15.6inch Laptop I7 Quad-Core Independent Graphics Gaming Office Business Learning Online Class Live Broadcast I5 Ultra-Thin Satc",
            "price": 430,
            "originalPrice": 860,
            "image": "https://cbu01.alicdn.com/img/ibank/O1CN01A4lQkx2NXgmdHWMct_!!1911179973-0-cib.jpg",
            "productUrl": "https://detail.1688.com/offer/530803621189.html?fromkv=refer:HVCVSVCRJVNFERZUGNLDMTSKKRDUCNCEIFGVUV2HJFMVIQ2PIJNEYNKRLBATESZXI5CTGVCPJZNFURZUGRCEST2CKRDUSM2EJNMDGM2QKU6T2PJ5HVEA1111&kjSource=pc",
            "monthlySales": 31,
            "rating": 5,
            "minOrderQuantity": 1,
            "isDropshipping": true,
            "supplierType": "tp_member",
            "category": {
                "level1": 7,
                "level2": 730,
                "level3": 702
            },
            "createdAt": "2025-07-21 21:54:56",
            "updatedAt": "2026-05-01 02:10:09"
        }
    ],
    "pagination": {
        "totalProducts": 2000,
        "totalPage": 2000,
        "page_size": 1,
        "currentPage": 1
    }
}
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
            "title": "Rose gold watch8 40mm",
            "skuId": 5858847709563,
            "price": 2.8,
            "stock": 7433,
            "attributes": [
                {
                    "name": "Color",
                    "value": "Rose gold"
                },
                {
                    "name": "Specification",
                    "value": "watch8 40mm"
                }
            ],
            "image": "https://cbu01.alicdn.com/img/ibank/O1CN01Lnx5Sg22d5m6dtzOX_!!2926577142-0-cib.jpg",
            "shipping": {
                "weight": 1,
                "length": 12,
                "width": 8,
                "height": 1,
                "origin": "广东省深圳市"
            },
            "skuMeta": {
                "shop_id": "BBBMeGcgNWTp_mA8CQOcU8mmA",
                "shop_name": "深圳市联盛兴业科技有限公司",
                "spec_id": "5a6dd69c1bfd22e4453a9a0a96ea4706",
                "sku_img": "https://cbu01.alicdn.com/img/ibank/O1CN01Lnx5Sg22d5m6dtzOX_!!2926577142-0-cib.jpg",
                "min_order_quantity": "1",
                "batch_number": "1",
                "imgs": [
                    "https://cbu01.alicdn.com/img/ibank/O1CN01aXdZQK22d5m3aDbJw_!!2926577142-0-cib.jpg",
                    "https://cbu01.alicdn.com/img/ibank/O1CN01MDVJWg22d5m4r92kV_!!2926577142-0-cib.jpg",
                    "https://cbu01.alicdn.com/img/ibank/O1CN01OAJUpH22d5m5vzTmi_!!2926577142-0-cib.jpg",
                    "https://cbu01.alicdn.com/img/ibank/O1CN01SBzsAy22d5m6dHiuF_!!2926577142-0-cib.jpg",
                    "https://cbu01.alicdn.com/img/ibank/O1CN01gK03LX22d5m5w0DVu_!!2926577142-0-cib.jpg"
                ],
                "specs": [
                    {
                        "label": "颜色",
                        "value": "玫瑰金"
                    },
                    {
                        "label": "规格",
                        "value": "watch8 40mm"
                    }
                ]
            }
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

Imports products from 1688 into the local inventory. After import, the `shopId`, `shopName`, and `procurementId` (1688 product ID) are stored on the `Product` record. Each `ProductVariant` also stores a `skuMeta` JSON object with the raw 1688 SKU metadata (`spec_id`, `sku_img`, `specs`, `shop_id`, `shop_name`, `min_order_quantity`, `batch_number`, `imgs`). Both the product-level fields and `skuMeta` are required by `POST /v1/wms/orders/dispatch` to automatically build Gulltrans procurement orders — variants without `skuMeta` (imported before this field was added) must be re-imported.

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

Save Product to Store
----------------------

> [!IMPORTANT]
> Required roles: SuperAdmin, Admin, Manager

Saves a product directly to the store inventory without going through the import flow. This endpoint accepts product data including options, variants, images, and metadata. Products saved via this endpoint are ready to be listed in the store immediately.

```http
POST /v1/procurement/save HTTP/1.1
```

Request Body Fields
Parameter Name | Required | Type | Description
---------------|----------|------|------------
items |	Yes |	Array |	Array of product items to save
items[].externalId |	Yes |	String |	External product ID from procurement source
items[].slug |	Yes |	String |	Unique URL-friendly identifier (max 64 chars)
items[].title |	Yes |	Object |	Product title with en and ar fields
items[].brief |	Yes |	Object |	Short product description with en and ar fields
items[].description |	Yes |	Object |	Full product description with en and ar fields
items[].descriptionHtml |	Yes |	Object |	HTML formatted description with en and ar fields
items[].categories |	Yes |	Array<String> |	Array of category UUIDs
items[].shopId |	No |	String	1688 shop ID from supplier
items[].shopName |	No |	String |	1688 shop name from supplier
items[].warehouseUUID |	Yes |	String |	UUID of the warehouse
items[].options |	Yes |	Array |	Product options (e.g., Color, Size)
items[].options[].name |	Yes |	Object |	Option name with en and ar fields
items[].options[].position |	Yes |	Number |	Display order position
items[].options[].values |	Yes |	Array |	Option values
items[].options[].values[].value |	Yes |	Object |	Option value name with en and ar fields
items[].options[].values[].position |	Yes |	Number |	Display order position
items[].variants |	Yes |	Array |	Product variants (at least one required)
items[].variants[].title |	Yes |	Object |	Variant title with en and ar fields
items[].variants[].sku |	Yes |	String |	Unique SKU identifier
items[].variants[].barcode |	Yes |	String |	Barcode for the variant
items[].variants[].quantity |	Yes |	Number |	Stock quantity
items[].variants[].cost |	Yes |	Object |	Cost information
items[].variants[].cost.amount |	Yes |	Number |	Cost amount
items[].variants[].cost.currencyCode |	Yes |	String |	Currency code (e.g., "CNY", "USD")
items[].variants[].weight |	Yes |	Object |	Weight information
items[].variants[].weight.amount |	Yes |	Number |	Weight amount
items[].variants[].weight.unit |	Yes |	String |	Weight unit (e.g., "kg", "g")
items[].variants[].dimensions |	Yes |	Object |	Package dimensions
items[].variants[].dimensions.width |	Yes |	Number |	Width
items[].variants[].dimensions.height |	Yes |	Number |	Height
items[].variants[].dimensions.length |	Yes |	Number |	Length
items[].variants[].dimensions.unit |	Yes |	String |	Dimension unit (e.g., "mm", "cm")
items[].variants[].optionValues |	Yes |	Array |	References to option values (UUIDs)
items[].variants[].imageUrl |	Yes |	String |	Main image URL for variant
items[].variants[].attributes |	No |	Array |	Additional variant attributes
items[].variants[].skuMeta | Yes |	Object |	Raw SKU metadata from procurement source
items[].images |	Yes |	Array |	Product images
items[].images[].url |	Yes |	String |	Image URL
items[].images[].isFeatured | Yes |	Boolean | Whether this is the featured image

### Request Body

```json
{
  "items": [
    {
      "externalId": "801934287846",
      "slug": "genuine-goods-second-generation-high-density-nano-sponge-wipe-w",
      "title": {
        "en": "genuine goods Second Generation High Density Nano Sponge Wipe White Shoes Magic Wipe Kitchen Bathroom Cleaning Sponge Durable",
        "ar": "إسفنجة تنظيف نانو عالية الكثافة للجيل الثاني"
      },
      "brief": {
        "en": "High density nano sponge cleaning wipe for white shoes, kitchen, and bathroom",
        "ar": "إسفنجة تنظيف نانو عالية الكثافة للأحذية والمطبخ والحمام"
      },
      "description": {
        "en": "High density nano sponge suitable for kitchen, bathroom, and white shoes cleaning.",
        "ar": "إسفنجة نانو عالية الكثافة مناسبة لتنظيف المطبخ والحمام والأحذية البيضاء."
      },
      "descriptionHtml": {
        "en": "<p>High density nano sponge suitable for kitchen, bathroom, and white shoes cleaning.</p>",
        "ar": "<p>إسفنجة نانو عالية الكثافة مناسبة لتنظيف المطبخ والحمام والأحذية البيضاء.</p>"
      },
      "shopId": "BBBX7Yb9s_99Ld_xVSIDTwzsQ",
      "shopName": "邯郸市玖城科技有限公司",
      "categories": [],
      "warehouseUUID": "6ba35190-ef22-4b73-af06-5ba1e0580b57",
      "options": [
        {
          "name": {
            "en": "Color",
            "ar": "اللون"
          },
          "position": 0,
          "values": [
            {
              "value": {
                "en": "High density 10*6*2",
                "ar": "كثافة عالية 10×6×2"
              },
              "position": 0
            }
          ]
        }
      ],
      "variants": [
        {
          "title": {
            "en": "High density 10*6*2",
            "ar": "كثافة عالية 10×6×2"
          },
          "sku": "801934287846-10x6x2",
          "barcode": "801934287846-001",
          "quantity": 104494547,
          "cost": {
            "amount": 8,
            "currencyCode": "CNY"
          },
          "weight": {
            "amount": 1,
            "unit": "kg"
          },
          "dimensions": {
            "width": 1,
            "height": 1,
            "length": 1,
            "unit": "mm"
          },
          "optionValues": [],
          "imageUrl": "https://cbu01.alicdn.com/img/ibank/O1CN01kmuYIR1NXgpzhMqPv_!!2216226631580-0-cib.jpg",
          "attributes": [
            {
              "optionNameEn": "Color",
              "optionValueEn": "High density 10*6*2"
            }
          ]
        }
      ],
      "images": [
        {
          "url": "https://cbu01.alicdn.com/img/ibank/O1CN01kmuYIR1NXgpzhMqPv_!!2216226631580-0-cib.jpg",
          "isFeatured": true
        }
      ]
    }
  ]
}
```

### Response Body

```json
{
    "success": [
        {
            "uuid": "38750cd1-d6fa-4da3-9d26-a141204de627",
            "slug": "genuine-goods-second-generation-high-density-nano-sponge-wipe-w",
            "titleEn": "genuine goods Second Generation High Density Nano Sponge Wipe White Shoes Magic Wipe Kitchen Bathroom Cleaning Sponge Durable",
            "titleAr": "إسفنجة تنظيف نانو عالية الكثافة للجيل الثاني",
            "briefEn": "High density nano sponge cleaning wipe for white shoes, kitchen, and bathroom",
            "briefAr": "إسفنجة تنظيف نانو عالية الكثافة للأحذية والمطبخ والحمام",
            "descriptionEn": "High density nano sponge suitable for kitchen, bathroom, and white shoes cleaning.",
            "descriptionAr": "إسفنجة نانو عالية الكثافة مناسبة لتنظيف المطبخ والحمام والأحذية البيضاء.",
            "descriptionHtmlEn": "<p>High density nano sponge suitable for kitchen, bathroom, and white shoes cleaning.</p>",
            "descriptionHtmlAr": "<p>إسفنجة نانو عالية الكثافة مناسبة لتنظيف المطبخ والحمام والأحذية البيضاء.</p>",
            "featuredImageUrl": "",
            "featuredThumbnailUrl": "",
            "status": "draft",
            "shopId": "BBBX7Yb9s_99Ld_xVSIDTwzsQ",
            "shopName": "邯郸市玖城科技有限公司",
            "procurementId": "801934287846",
            "salesCount": 0,
            "likesCount": 0,
            "reviewsCount": 0,
            "ratingSum": 0,
            "ratingCount": 0,
            "ratingAvg": "0",
            "ratingOneStarCount": 0,
            "ratingTwoStarCount": 0,
            "ratingThreeStarCount": 0,
            "ratingFourStarCount": 0,
            "ratingFiveStarCount": 0
        }
    ],
    "failed": []
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
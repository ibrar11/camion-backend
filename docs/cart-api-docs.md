Cart REST API
==================

This document includes the documentation of the cart module.

Procedure to Use Cart
--------------------------------------

Follow the following steps to use the cart system:

1. Add item to cart (guest or authenticated user).
2. Retrieve cart items.
3. Update cart item (quantity or variant).
4. Remove item from cart.
5. Clear entire cart.

Cart API
=============

> [!IMPORTANT]
> The cart supports both authenticated users and guest users.
> You must include your access token as a `Bearer` token in the Authorization header. Your account must be active while making these requests.
> Guest users must send x-guest-id header.
> If a valid Bearer token is provided → cart is linked to user.
> f no token → x-guest-id header is required.

Add to Cart
------------------


```http
POST /v1/cart HTTP/1.1
```

Parameter Name | Required | Type | Description
---------------|----------|------|------------
productUuid | Yes | UUID | UUID of the product
variantUuid | Yes | UUID | UUID of the product variant
quantity | Yes | Number | Quantity to add (minimum 1

### Request Body
```json
{ 
    "productUuid": "c023bd4c-e8ce-453e-b41b-07b42c7f0d6d", 
    "variantUuid": "45078e0a-7637-48e5-a7d5-a8645b1ae66f", 
    "quantity": 2 
}
```

### Response Body
```json
{
  "success": true,
  "message": "Added to cart",
  "data": {
    "cartCount": 3
  }
}
```

Retrieve Cart
-------------------

```http
GET /v1/cart HTTP/1.1
```

### Response Body
```json
{
  "success": true,
  "message": "Cart fetched",
  "data": {
    "cartItems": [
        {
            "uuid": "4b4bf00f-11cf-4ddf-9262-c5b4006cabcf",
            "userId": "c023bd4c-e8ce-453e-b41b-07b42c7f0d6d",
            "productId": "45078e0a-7637-48e5-a7d5-a8645b1ae66f",
            "quantity": "2",
            "variation": {
                "uuid": "f1f6fb3a-f1d1-43b3-95b6-e213a020ca08",
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
                }
            },
            "title": "iPhone 17",
            "image": "ProductVariantImage"[],
            "totalPrice": "345",
            "availableStock": "5",
            "isAvailable": "true",
            "createdAt": "2026-03-24 15:19:50.303381+05",
            "updatedAt": "2026-03-24 15:19:50.303381+05"
        }
     ],
    "cartTotal": 1234
  }
}
```

Update Cart Item
----------------

```http
PATCH /v1/cart/update/<cart-uuid> HTTP/1.1
```

Parameter Name | Required | Type | Description
---------------|----------|------|------------
productUuid | Yes | UUID | UUID of the product
variantUuid | No | UUID | New variant UUID
quantity | No | Number | Updated quantity (min 1)

### Request Body
```json
{ 
    "productUuId": "4b4bf00f-11cf-4ddf-9262-c5b4006cabcf",
    "quantity": 3 
}
```

### Response Body
```json
{
  "success": true,
  "message": "Cart updated",
  "data": {
    "uuid": "a993e4c3-76d2-482d-adc3-e55945ebc8b4",
    "productUuId": "4b4bf00f-11cf-4ddf-9262-c5b4006cabcf",
    "quantity": 3,
    "totalPrice": 597
  }
}
```

Remove Item from Cart
----------------

```http
DELETE /v1/cart/remove HTTP/1.1
```

Parameter Name | Required | Type | Description
---------------|----------|------|------------
productUuid | Yes | UUID | UUID of the product

### Request Body
```json
{ 
    "productUuid": "a123bd4c-e8ce-453e-b41b-07b42c7f0d6d"
}
```

### Response Body
```json
{
  "success": true,
  "message": "Item removed",
  "data": { "removed": true }
}
```

Clear Cart
----------------

```http
DELETE /v1/cart/clear HTTP/1.1
```

### Response Body
```json
{
  "success": true,
  "message": "Item removed"
}
```
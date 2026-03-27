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
    "uuid": "a123bd4c-e8ce-453e-b41b-07b42c7f0d6d", 
    "productUuid": "c023bd4c-e8ce-453e-b41b-07b42c7f0d6d", 
    "variantUuid": "45078e0a-7637-48e5-a7d5-a8645b1ae66f", 
    "quantity": 2, 
    "price": 2000 
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
    "cartItems": [ 
        { 
            "uuid": "a123bd4c-e8ce-453e-b41b-07b42c7f0d6d", 
            "productUuid": "c023bd4c-e8ce-453e-b41b-07b42c7f0d6d", 
            "variantUuid": "45078e0a-7637-48e5-a7d5-a8645b1ae66f", 
            "quantity": 2, 
            "price": 2000 
        } 
    ], 
    "cartTotal": 2000
}
```

Update Cart Item
----------------

```http
PATCH /v1/cart/update/<cart-uuid> HTTP/1.1
```

Parameter Name | Required | Type | Description
---------------|----------|------|------------
variantUuid | No | UUID | New variant UUID
quantity | No | Number | Updated quantity (min 1)

### Request Body
```json
{ 
    "quantity": 3 
}
```

### Response Body
```json
{ 
    "uuid": "a123bd4c-e8ce-453e-b41b-07b42c7f0d6d", 
    "productUuid": "c023bd4c-e8ce-453e-b41b-07b42c7f0d6d", 
    "variantUuid": "45078e0a-7637-48e5-a7d5-a8645b1ae66f", 
    "quantity": 3, 
    "price": 3000 
}
```

Remove Item from Cart
----------------

```http
DELETE /v1/cart/remove HTTP/1.1
```

Parameter Name | Required | Type | Description
---------------|----------|------|------------
uuid | Yes | UUID | UUID of the cart item

### Request Body
```json
{ 
    "uuid": "a123bd4c-e8ce-453e-b41b-07b42c7f0d6d"
}
```

### Response Body
```json
{ 
    "message": "Item removed successfully" 
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
   "message": "Cart cleared successfully"
}
```
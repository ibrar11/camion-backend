Promo REST API
==============

The promo api used to create promo banners.

Procedure to create your first Promo
------------------------------------

Follow the following steps to create your first promo. Your can find the documentation of each step below.

1. Create a promo.

> [!IMPORTANT]
> You must include your access token as a `Bearer` token in the Authorization header. Your account must be active while making these requests.

Create a Promo
--------------

> [!IMPORTANT]
> Required roles: `SuperAdmin`, `Admin`, `Manager`

```http
POST /v1/promos HTTP/1.1
```

Parameter Name | Required | Type | Description
---------------|----------|------|------------
name | Yes | String | A unique name for the promo
text | Yes | String | The main text of the promo
callToActionText | Yes | String | The text on the call to action button
callToActionLink | Yes | String | The link on the call to action button

### Request Body

```json
{
    "name": "summer-sale-2026",
    "text": "Summer Sale For All Swim Suits And Free Express Delivery - OFF 50%!",
    "callToActionText": "Shop Now",
    "callToActionLink": "https://app.dev.camiontrading.com/en/shop"
}
```

### Response Body

```json
{
    "uuid": "bced1f96-3e75-40e4-a651-0cfbc8d94326",
    "name": "summer-sale-2026",
    "text": "Summer Sale For All Swim Suits And Free Express Delivery - OFF 50%!",
    "callToActionText": "Shop Now",
    "callToActionLink": "https://app.dev.camiontrading.com/en/shop"
}
```

Get Promos
----------

> [!IMPORTANT]
> Required roles: `SuperAdmin`, `Admin`, `Manager`

```http
GET /v1/promos HTTP/1.1
```

### Response Body

```json
[
    {
        "uuid": "bced1f96-3e75-40e4-a651-0cfbc8d94326",
        "name": "summer-sale-2026",
        "text": "Summer Sale For All Swim Suits And Free Express Delivery - OFF 50%!",
        "callToActionText": "Shop Now",
        "callToActionLink": "https://app.dev.camiontrading.com/en/shop"
    }
]
```

Get Promo
---------

> [!IMPORTANT]
> Required roles: `SuperAdmin`, `Admin`, `Manager`

```http
GET /v1/promos/<promo-uuid> HTTP/1.1
```

### Response Body

```json
{
    "uuid": "bced1f96-3e75-40e4-a651-0cfbc8d94326",
    "name": "summer-sale-2026",
    "text": "Summer Sale For All Swim Suits And Free Express Delivery - OFF 50%!",
    "callToActionText": "Shop Now",
    "callToActionLink": "https://app.dev.camiontrading.com/en/shop"
}
```

Update Promo
------------

> [!IMPORTANT]
> Required roles: `SuperAdmin`, `Admin`, `Manager`

```http
PUT /v1/promos/<promo-uuid> HTTP/1.1
```

Parameter Name | Required | Type | Description
---------------|----------|------|------------
name | Yes | String | A unique name for the promo
text | Yes | String | The main text of the promo
callToActionText | Yes | String | The text on the call to action button
callToActionLink | Yes | String | The link on the call to action button

### Request Body

```json
{
    "name": "summer-sale-2027",
    "text": "Summer Sale For All Swim Suits And Free Express Delivery - OFF 80%!",
    "callToActionText": "Shop More",
    "callToActionLink": "https://app.dev.camiontrading.com/fr/shop"
}
```

### Response Body

```json
{
    "uuid": "bced1f96-3e75-40e4-a651-0cfbc8d94326",
    "name": "summer-sale-2027",
    "text": "Summer Sale For All Swim Suits And Free Express Delivery - OFF 80%!",
    "callToActionText": "Shop More",
    "callToActionLink": "https://app.dev.camiontrading.com/fr/shop"
}
```

Delete Promo
------------

> [!IMPORTANT]
> Required roles: `SuperAdmin`, `Admin`, `Manager`

```http
DELETE /v1/promos/<promo-uuid> HTTP/1.1
```

Banners API
===========

This document includes the documentation of banners module.

Procedure to Create Your First Banner
-------------------------------------

Follow the following steps to create your first banner. You can find the documentation of each step below.

1. Create your banner.
2. Update the banner with link and titles.

> [!IMPORTANT]
> You must include your access token as a `Bearer` token in the Authorization header. Your account must be active while making these requests.

Create a Banner
---------------

You must create a banner by upload an image to the following api route.

```HTTP
POST /v1/banners HTTP/1.1
```

### Example
```bash
curl --location --request POST 'http://localhost:8000/v1/banners' \
--header 'Authorization: Bearer <YOUR_ACCESS_TOKEN>' \
--form 'fileEn=@"/C:/Users/Pictures/Test/m_Direct_Media____YWCMXRBDU8.jpg"' \
--form 'fileAr=@"/C:/Users/Pictures/Test/m_mEZ3PoFGs_k.jpg"'
```

### Response Body
```json
{
    "uuid": "e7374706-2e8a-4bb2-b9a4-de9a5b033967",
    "titleEn": "",
    "titleAr": "",
    "imageUrlEn": "s3://banners/205bf657-2b24-438d-874c-608e53e6646b.jpg",
    "imageUrlAr": "s3://banners/6b4a0e23-3ddd-4a6d-895a-ca751f13faeb.jpg",
    "linkUrl": "",
    "placement": "",
    "color": "",
    "isActive": true
}
```

Retrieve Banners
----------------

> [!IMPORTANT]
> Required roles: `SuperAdmin`, `Admin`, `Manager`

```HTTP
GET /v1/banners HTTP/1.1
```

### Query Parameters
Name | Description | Default
-----|-------------|--------
filters | A JSON string containing your search term, or any advanced search parameters. | `{}`
sort | The order in which we need to sort results |
pageNumber | The current page number | 1
itemsPerPage | The number of results to retrieve in the response | 100

### Response Body
```json
[
    {
        "uuid": "e7374706-2e8a-4bb2-b9a4-de9a5b033967",
        "titleEn": "",
        "titleAr": "",
        "imageUrlEn": "s3://banners/205bf657-2b24-438d-874c-608e53e6646b.jpg",
        "imageUrlAr": "s3://banners/6b4a0e23-3ddd-4a6d-895a-ca751f13faeb.jpg",
        "linkUrl": "",
        "placement": "",
        "color": "",
        "isActive": true
    }
]
```

Retrieve Banner
---------------

> [!IMPORTANT]
> Required roles: `SuperAdmin`, `Admin`, `Manager`

```HTTP
GET /v1/banners/<banner-uuid> HTTP/1.1
```

### Response Body
```json
{
    "uuid": "e7374706-2e8a-4bb2-b9a4-de9a5b033967",
    "titleEn": "New Product (English)",
    "titleAr": "New Product (Arabic)",
    "imageUrlEn": "s3://banners/205bf657-2b24-438d-874c-608e53e6646b.jpg",
    "imageUrlAr": "s3://banners/6b4a0e23-3ddd-4a6d-895a-ca751f13faeb.jpg",
    "linkUrl": "New Products",
    "placement": "homepage",
    "color": "#000000",
    "isActive": true
}
```

Update Banner
-------------

> [!IMPORTANT]
> Required roles: `SuperAdmin`, `Admin`, `Manager`

```HTTP
PUT /v1/banners/<banner-uuid> HTTP/1.1
```

### Request Body
```json
{
    "title": {
        "en": "New Product (English)",
        "ar": "New Product (Arabic)"
    },
    "linkUrl": "New Products",
    "isActive": true,
    "placement": "homepage",
    "color": "#000000"
}
```

### Response Body
```json
{
    "uuid": "e7374706-2e8a-4bb2-b9a4-de9a5b033967",
    "titleEn": "New Product (English)",
    "titleAr": "New Product (Arabic)",
    "imageUrlEn": "s3://banners/205bf657-2b24-438d-874c-608e53e6646b.jpg",
    "imageUrlAr": "s3://banners/6b4a0e23-3ddd-4a6d-895a-ca751f13faeb.jpg",
    "linkUrl": "New Products",
    "placement": "homepage",
    "color": "#000000",
    "isActive": true
}
```

Delete Banner
-------------

> [!IMPORTANT]
> Required roles: `SuperAdmin`, `Admin`, `Manager`

```HTTP
DELETE /v1/banners/<banner-uuid> HTTP/1.1
```

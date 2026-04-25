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
--form 'file=@"/C:/m_Direct_Media____YWCMXRBDU8.jpg"'
```

### Response Body
```json
{
    "uuid": "2d051593-91d1-41bb-b955-35211715599f",
    "titleEn": "",
    "titleAr": "",
    "imageUrl": "https://camion.s3.us-east-1.amazonaws.com/1e7930fb-e6aa-482a-a2bb-9403b4ee1d35.jpg",
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
        "uuid": "065ebf39-a638-4bc1-aec0-93fb4286a652",
        "titleEn": "New Product (English)",
        "titleAr": "New Product (Arabic)",
        "imageUrl": "https://camion.s3.us-east-1.amazonaws.com/1bd64a8f-dd34-4b49-adb5-659bf2b7a151.jpg",
        "linkUrl": "New Products",
        "placement": "homepage",
        "color": "",
        "isActive": true
    },
    {
        "uuid": "2d051593-91d1-41bb-b955-35211715599f",
        "titleEn": "",
        "titleAr": "",
        "imageUrl": "https://camion.s3.us-east-1.amazonaws.com/1e7930fb-e6aa-482a-a2bb-9403b4ee1d35.jpg",
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
    "uuid": "2d051593-91d1-41bb-b955-35211715599f",
    "titleEn": "",
    "titleAr": "",
    "imageUrl": "https://camion.s3.us-east-1.amazonaws.com/1e7930fb-e6aa-482a-a2bb-9403b4ee1d35.jpg",
    "linkUrl": "",
    "placement": "",
    "color": "",
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
    "color": "#000000",
}
```

### Response Body
```json
{
    "uuid": "065ebf39-a638-4bc1-aec0-93fb4286a652",
    "titleEn": "New Product (English)",
    "titleAr": "New Product (Arabic)",
    "imageUrl": "https://camion.s3.us-east-1.amazonaws.com/1bd64a8f-dd34-4b49-adb5-659bf2b7a151.jpg",
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
